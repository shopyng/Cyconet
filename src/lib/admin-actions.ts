'use server';

/**
 * Server Actions for the staff dashboard.
 *
 * Every action calls `verifyAdmin()` first. That is the security boundary —
 * the proxy does not enforce auth (it runs on prefetches) and these endpoints
 * are reachable by direct POST, so the role check has to live here rather than
 * relying on the fact that only admin pages render the buttons.
 */

import { revalidatePath } from 'next/cache';
import { customAlphabet } from 'nanoid';
import type { Prisma } from '@prisma/client';
import { db } from './db';
import { verifyAdmin, eligibility } from './dal';
import { hashPassword } from './auth';
import { sendEmail } from './leads';
import type { FormState } from './form-state';

/**
 * Verification codes for certificates.
 *
 * Crockford-style alphabet: no I, L, O, U, so a code read off a printed
 * certificate cannot be mistyped as a lookalike digit. 10 characters over 32
 * symbols is ~50 bits — not guessable by enumeration.
 */
const verificationCode = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 10);

function superAdmins(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function verifySuperAdmin() {
  const admin = await verifyAdmin();
  const allowed = superAdmins();
  if (allowed.size > 0 && !allowed.has(admin.email.toLowerCase())) {
    throw new Error('Forbidden');
  }
  return admin;
}

function fieldValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function audit(
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Prisma.InputJsonObject,
) {
  await db.auditLog.create({
    data: { actorId, action, entity, entityId, metadata: metadata ?? undefined },
  });
}

async function notifyUser(userId: string, title: string, body: string, href?: string) {
  await db.notification.create({ data: { userId, title, body, href } });
}

async function tryEmail(to: string, subject: string, text: string) {
  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error('[email] workflow email failed:', error);
  }
}

/* ------------------------------------------------------------------ *
 * Applications
 * ------------------------------------------------------------------ */

/**
 * Accept or reject an application.
 *
 * Accepting does three things in one transaction: records the decision,
 * creates the student account if the applicant has none, and enrols them on the
 * track they applied for. All-or-nothing, because an accepted application with
 * no matching enrolment would leave a student who can sign in and see nothing.
 *
 * The generated password is returned once, in the success message, for staff to
 * pass on. There is no email delivery and no reset flow yet, so this is the
 * only time it is visible.
 */
export async function reviewApplication(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const notes = String(formData.get('reviewNotes') ?? '').trim();

  if (!id || (decision !== 'ACCEPTED' && decision !== 'REJECTED')) {
    return { status: 'error', message: 'Choose accept or reject.' };
  }

  const application = await db.application.findUnique({ where: { id } });
  if (!application) {
    return { status: 'error', message: 'That application does not exist.' };
  }
  if (application.status !== 'PENDING') {
    return {
      status: 'error',
      message: `This application was already ${application.status.toLowerCase()}.`,
    };
  }

  if (decision === 'REJECTED') {
    await db.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        reviewNotes: notes || null,
      },
    });
    await audit(admin.id, 'application.rejected', 'Application', id, { email: application.email });
    await tryEmail(
      application.email,
      'Cyconet application update',
      `Hello ${application.name},\n\nThank you for applying to Cyconet. After review, we are unable to offer a place for this track right now.\n\n${notes ? `Notes from admissions:\n${notes}\n\n` : ''}Regards,\nCyconet Admissions`,
    );
    revalidatePath('/admin', 'layout');
    return { status: 'success', message: 'Application rejected.' };
  }

  const program = await db.program.findUnique({
    where: { id: application.track },
    select: { id: true, title: true },
  });
  if (!program) {
    return {
      status: 'error',
      message: `No programme matches the track "${application.track}". Fix the track before accepting.`,
    };
  }

  const email = application.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });

  // Shown only when a new account was created — an existing student keeps their
  // current password, and we must not imply otherwise.
  let issuedPassword: string | null = null;
  if (!existing) issuedPassword = verificationCode().toLowerCase();

  const passwordHash = issuedPassword ? await hashPassword(issuedPassword) : null;

  await db.$transaction(async (tx) => {
    const student =
      existing ??
      (await tx.user.create({
        data: {
          email,
          name: application.name,
          password: passwordHash as string,
          role: 'STUDENT',
        },
      }));

    // Idempotent: an applicant who already sits on this track (perhaps from an
    // earlier cohort) must not trip the unique constraint and roll everything back.
    await tx.enrollment.upsert({
      where: { userId_programId: { userId: student.id, programId: program.id } },
      create: { userId: student.id, programId: program.id },
      update: {},
    });

    await tx.application.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        reviewNotes: notes || null,
      },
    });

    await tx.notification.create({
      data: {
        userId: student.id,
        title: 'Application accepted',
        body: `You have been enrolled on ${program.title}.`,
        href: '/courses',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'application.accepted',
        entity: 'Application',
        entityId: id,
        metadata: { email, programId: program.id },
      },
    });
  });

  revalidatePath('/admin', 'layout');

  await tryEmail(
    email,
    'Your Cyconet application was accepted',
    issuedPassword
      ? `Hello ${application.name},\n\nYour application for ${program.title} has been accepted.\n\nLogin: ${email}\nTemporary password: ${issuedPassword}\n\nSign in at the Cyconet learning portal and change your password when instructed.\n\nRegards,\nCyconet Admissions`
      : `Hello ${application.name},\n\nYour application for ${program.title} has been accepted and added to your existing Cyconet account.\n\nRegards,\nCyconet Admissions`,
  );

  return {
    status: 'success',
    message: issuedPassword
      ? `Accepted and enrolled on ${program.title}. Temporary password for ${email}: ${issuedPassword} — send this to the student now, it will not be shown again.`
      : `Accepted and enrolled on ${program.title}. ${email} already had an account, so their existing password still applies.`,
  };
}

/* ------------------------------------------------------------------ *
 * Project review
 * ------------------------------------------------------------------ */

/** Approve a submission or send it back for revision. */
export async function reviewSubmission(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const feedback = String(formData.get('feedback') ?? '').trim();

  if (!id || (decision !== 'APPROVED' && decision !== 'NEEDS_REVISION')) {
    return { status: 'error', message: 'Choose approve or request changes.' };
  }

  const submission = await db.projectSubmission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { title: true } },
    },
  });
  if (!submission) {
    return { status: 'error', message: 'That submission does not exist.' };
  }

  // Asking for changes without saying what to change wastes a round trip.
  if (decision === 'NEEDS_REVISION' && feedback.length < 10) {
    return {
      status: 'error',
      message: 'Explain what needs changing — at least 10 characters.',
      errors: { feedback: 'Feedback is required when requesting changes.' },
      values: { feedback },
    };
  }

  await db.$transaction(async (tx) => {
    await tx.projectSubmission.update({
      where: { id },
      data: {
        status: decision,
        feedback: feedback || null,
        reviewedAt: new Date(),
      },
    });

    if (feedback) {
      await tx.projectFeedback.create({
        data: {
          submissionId: id,
          authorName: admin.name,
          authorRole: admin.role,
          body: feedback,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: submission.user.id,
        title: decision === 'APPROVED' ? 'Project approved' : 'Project needs revision',
        body:
          decision === 'APPROVED'
            ? `${submission.project.title} has been approved.`
            : `${submission.project.title} needs revision. Check the reviewer feedback.`,
        href: '/projects',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: decision === 'APPROVED' ? 'submission.approved' : 'submission.revision_requested',
        entity: 'ProjectSubmission',
        entityId: id,
        metadata: { student: submission.user.name, project: submission.project.title },
      },
    });
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  await tryEmail(
    submission.user.email,
    decision === 'APPROVED' ? 'Cyconet project approved' : 'Cyconet project needs revision',
    decision === 'APPROVED'
      ? `Hello ${submission.user.name},\n\nYour project "${submission.project.title}" has been approved.\n\nRegards,\nCyconet`
      : `Hello ${submission.user.name},\n\nYour project "${submission.project.title}" needs revision.\n\nFeedback:\n${feedback}\n\nRegards,\nCyconet`,
  );

  return {
    status: 'success',
    message: decision === 'APPROVED' ? 'Submission approved.' : 'Revision requested.',
  };
}

/* ------------------------------------------------------------------ *
 * Certificates
 * ------------------------------------------------------------------ */

const MAX_SIGNATURE_BYTES = 1 * 1024 * 1024;

const SIGNATURE_FILE_SIGNATURES: readonly {
  mime: 'image/png' | 'image/jpeg';
  magic: readonly number[];
}[] = [
  { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
];

type SignatureUpload = {
  // Prisma 7's Bytes input is an ArrayBuffer-backed Uint8Array. Keep the
  // upload in that shape instead of widening it to Node's Buffer type, whose
  // backing buffer is typed as ArrayBufferLike under newer TypeScript libs.
  data: Uint8Array<ArrayBuffer>;
  mimeType: 'image/png' | 'image/jpeg';
  fileName: string;
  size: number;
};

type SignatureUploadResult =
  | { success: true; upload: SignatureUpload }
  | { success: false; error: string };

function sniffSignatureMime(bytes: Uint8Array): 'image/png' | 'image/jpeg' | null {
  for (const signature of SIGNATURE_FILE_SIGNATURES) {
    if (signature.magic.every((byte, index) => bytes[index] === byte)) return signature.mime;
  }
  return null;
}

function signatureFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? 'signature';
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
  return cleaned || 'signature';
}

async function readSignatureUpload(
  formData: FormData,
  field: string,
): Promise<SignatureUploadResult> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Upload both the director and student signature images.' };
  }
  if (file.size > MAX_SIGNATURE_BYTES) {
    return { success: false, error: 'Each signature image must be 1MB or smaller.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffSignatureMime(bytes);
  if (!mimeType) {
    return { success: false, error: 'Signatures must be PNG or JPEG images.' };
  }

  return {
    success: true,
    upload: {
      data: bytes.slice(),
      mimeType,
      fileName: signatureFileName(file.name),
      size: bytes.byteLength,
    },
  };
}

function parseCertificateDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

/**
 * Issue a certificate.
 *
 * Re-checks `eligibility()` at the moment of issue rather than trusting the
 * button. The candidates list is computed on page load, so a student could
 * conceivably have work un-approved between render and click — and a
 * certificate is exactly the kind of thing that must not be issued on stale
 * data.
 */
export async function issueCertificate(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const userId = String(formData.get('userId') ?? '');
  const programId = String(formData.get('programId') ?? '');

  if (!userId || !programId) {
    return { status: 'error', message: 'Missing student or programme.' };
  }

  const [student, program, existing] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    db.program.findUnique({ where: { id: programId }, select: { id: true, title: true } }),
    db.certificate.findUnique({
      where: { userId_programId: { userId, programId } },
      select: { verificationCode: true },
    }),
  ]);

  if (!student || !program) {
    return { status: 'error', message: 'Unknown student or programme.' };
  }
  if (existing) {
    return {
      status: 'error',
      message: `Already issued — code ${existing.verificationCode}.`,
    };
  }

  const status = await eligibility(userId, programId);
  if (!status.eligible) {
    return {
      status: 'error',
      message:
        `${student.name} has not met every requirement yet: ` +
        `lessons ${status.lessons.done}/${status.lessons.total}, ` +
        `exams ${status.exams.passed}/${status.exams.total}, ` +
        `projects ${status.projects.approved}/${status.projects.total}.`,
    };
  }

  const certificate = await db.certificate.create({
    data: {
      userId,
      programId,
      holderName: student.name,
      verificationCode: verificationCode(),
    },
  });
  await notifyUser(
    userId,
    'Certificate issued',
    `Your certificate for ${program.title} is ready.`,
    '/certificate',
  );
  await audit(admin.id, 'certificate.issued', 'Certificate', certificate.id, {
    userId,
    programId,
    verificationCode: certificate.verificationCode,
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  await tryEmail(
    student.email,
    'Your Cyconet certificate is ready',
    `Hello ${student.name},\n\nYour certificate for ${program.title} has been issued.\n\nVerification code: ${certificate.verificationCode}\n\nRegards,\nCyconet`,
  );

  return {
    status: 'success',
    message: `Certificate issued to ${student.name} for ${program.title}. Verification code: ${certificate.verificationCode}`,
  };
}

/**
 * Issue a certificate manually. This intentionally does not call
 * `eligibility()`: staff can certify an offline, classroom, private or
 * otherwise externally assessed student who has no course activity here.
 */
export async function issueManualCertificate(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const holderName = fieldValue(formData, 'holderName');
  const userId = fieldValue(formData, 'userId');
  const programId = fieldValue(formData, 'programId');
  const issuedAt = parseCertificateDate(fieldValue(formData, 'issuedAt'));

  if (!holderName || holderName.length < 2 || holderName.length > 160) {
    return {
      status: 'error',
      message: 'Enter the student name as it should appear on the certificate.',
      errors: { holderName: 'Use a name between 2 and 160 characters.' },
    };
  }
  if (!programId) {
    return { status: 'error', message: 'Choose a programme.' };
  }
  if (!issuedAt) {
    return {
      status: 'error',
      message: 'Enter a valid certificate date.',
      errors: { issuedAt: 'Use a valid date.' },
    };
  }

  const [student, program, existing] = await Promise.all([
    userId
      ? db.user.findFirst({
          where: { id: userId, role: 'STUDENT' },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve(null),
    db.program.findUnique({
      where: { id: programId },
      select: { id: true, title: true },
    }),
    userId
      ? db.certificate.findUnique({
          where: { userId_programId: { userId, programId } },
          select: { verificationCode: true },
        })
      : Promise.resolve(null),
  ]);

  if (userId && !student) {
    return { status: 'error', message: 'Unknown student account.' };
  }
  if (!program) {
    return { status: 'error', message: 'Unknown programme.' };
  }
  if (existing) {
    return {
      status: 'error',
      message: `A certificate already exists for this student and programme — code ${existing.verificationCode}.`,
    };
  }

  const [director, studentSignature] = await Promise.all([
    readSignatureUpload(formData, 'directorSignature'),
    readSignatureUpload(formData, 'studentSignature'),
  ]);
  if (!director.success) {
    return { status: 'error', message: director.error, errors: { directorSignature: director.error } };
  }
  if (!studentSignature.success) {
    return { status: 'error', message: studentSignature.error, errors: { studentSignature: studentSignature.error } };
  }

  const certificate = await db.$transaction(async (tx) => {
    const created = await tx.certificate.create({
      data: {
        ...(userId ? { userId } : {}),
        programId,
        holderName,
        issuedAt,
        verificationCode: verificationCode(),
      },
    });

    await tx.certificateSignature.createMany({
      data: [
        { certificateId: created.id, kind: 'DIRECTOR', ...director.upload },
        { certificateId: created.id, kind: 'STUDENT', ...studentSignature.upload },
      ],
    });

    if (student) {
      await tx.notification.create({
        data: {
          userId: student.id,
          title: 'Certificate issued',
          body: `Your certificate for ${program.title} is ready.`,
          href: '/certificate',
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'certificate.issued_manually',
        entity: 'Certificate',
        entityId: created.id,
        metadata: {
          ...(userId ? { userId } : {}),
          holderName,
          programId,
          verificationCode: created.verificationCode,
          issuedAt: issuedAt.toISOString(),
        },
      },
    });

    return created;
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  if (student) {
    await tryEmail(
      student.email,
      'Your Cyconet certificate is ready',
      `Hello ${student.name},\n\nYour certificate for ${program.title} has been issued.\n\nVerification code: ${certificate.verificationCode}\n\nRegards,\nCyconet`,
    );
  }

  return {
    status: 'success',
    message: `Certificate issued to ${holderName}. Verification code: ${certificate.verificationCode}`,
  };
}

/** Correct the printed issue date without changing the certificate identity. */
export async function updateCertificateIssuedAt(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const id = fieldValue(formData, 'certificateId');
  const issuedAt = parseCertificateDate(fieldValue(formData, 'issuedAt'));

  if (!id) {
    return { status: 'error', message: 'That certificate could not be identified.' };
  }
  if (!issuedAt) {
    return {
      status: 'error',
      message: 'Enter a valid certificate date.',
      errors: { issuedAt: 'Use a valid date.' },
    };
  }

  const certificate = await db.certificate.findUnique({
    where: { id },
    select: { id: true, verificationCode: true },
  });
  if (!certificate) {
    return { status: 'error', message: 'That certificate no longer exists.' };
  }

  await db.certificate.update({
    where: { id: certificate.id },
    data: { issuedAt },
  });
  await audit(admin.id, 'certificate.date_updated', 'Certificate', certificate.id, {
    issuedAt: issuedAt.toISOString(),
    verificationCode: certificate.verificationCode,
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  revalidatePath(`/verify/${certificate.verificationCode}`);
  revalidatePath(`/verify/${certificate.verificationCode}/download`);

  return { status: 'success', message: 'Certificate issue date updated.' };
}

/* ------------------------------------------------------------------ *
 * Payments
 * ------------------------------------------------------------------ */

/**
 * Confirm or reject a tuition payment.
 *
 * Approving is what actually enrols someone: it flips the Enrollment from
 * PENDING_PAYMENT to ACTIVE, which is the state `isEnrolled()` requires before
 * any learning action will run. Both writes happen in one transaction, because
 * an APPROVED payment beside a PENDING_PAYMENT enrolment would leave a student
 * who has paid and still cannot get in.
 */
export async function reviewPayment(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const notes = String(formData.get('reviewNotes') ?? '').trim();

  if (!id || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    return { status: 'error', message: 'Choose confirm or reject.' };
  }

  const payment = await db.payment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amountKobo: true,
      reference: true,
      userId: true,
      programId: true,
      user: { select: { name: true, email: true } },
      program: { select: { title: true } },
    },
  });

  if (!payment) {
    return { status: 'error', message: 'That payment does not exist.' };
  }
  if (payment.status === 'APPROVED') {
    return { status: 'error', message: 'This payment has already been confirmed.' };
  }

  // Rejecting without saying why forces the student to guess, and they will
  // simply re-upload the same receipt. Mirrors the rule on project revisions.
  if (decision === 'REJECTED' && notes.length < 10) {
    return {
      status: 'error',
      message: 'Explain what was wrong — at least 10 characters.',
      errors: { reviewNotes: 'A reason is required when rejecting a payment.' },
      values: { reviewNotes: notes },
    };
  }

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: {
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        reviewNotes: notes || null,
      },
    });

    if (decision === 'APPROVED') {
      await tx.enrollment.updateMany({
        where: { userId: payment.userId, programId: payment.programId },
        data: { status: 'ACTIVE', activatedAt: new Date() },
      });
    }

    await tx.notification.create({
      data: {
        userId: payment.userId,
        title: decision === 'APPROVED' ? 'Payment confirmed' : 'Payment could not be confirmed',
        body:
          decision === 'APPROVED'
            ? `Your payment for ${payment.program.title} has been confirmed. The programme is now open.`
            : `We could not confirm your payment for ${payment.program.title}. ${notes}`,
        href: decision === 'APPROVED' ? '/courses' : '/payment',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: decision === 'APPROVED' ? 'payment.approved' : 'payment.rejected',
        entity: 'Payment',
        entityId: id,
        metadata: {
          reference: payment.reference,
          amountKobo: payment.amountKobo,
          student: payment.user.email,
          programId: payment.programId,
        },
      },
    });
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  await tryEmail(
    payment.user.email,
    decision === 'APPROVED'
      ? 'Your Cyconet payment is confirmed'
      : 'We could not confirm your Cyconet payment',
    decision === 'APPROVED'
      ? `Hello ${payment.user.name},\n\nYour payment for ${payment.program.title} has been confirmed and your programme is now open.\n\nSign in to the learning portal to get started.\n\nRegards,\nCyconet`
      : `Hello ${payment.user.name},\n\nWe could not confirm your payment for ${payment.program.title}.\n\n${notes}\n\nUpload a corrected receipt from your payment page and we will review it again.\n\nRegards,\nCyconet`,
  );

  return {
    status: 'success',
    message:
      decision === 'APPROVED'
        ? `Payment confirmed. ${payment.user.name} is now enrolled on ${payment.program.title}.`
        : 'Payment rejected. The student has been asked to upload a corrected receipt.',
  };
}

/* ------------------------------------------------------------------ *
 * Timetable
 * ------------------------------------------------------------------ */

/**
 * Add a scheduled session.
 *
 * `datetime-local` inputs arrive as "2026-08-14T09:00" with no zone, which the
 * Date constructor reads in the server's local zone. That is the intended
 * reading — staff enter the time the class actually starts in Ibadan — but it
 * does mean the server's TZ should match the school's.
 */
export async function createTimetableEntry(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();

  const programId = String(formData.get('programId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const startRaw = String(formData.get('startTime') ?? '');
  const endRaw = String(formData.get('endTime') ?? '');

  const values = { programId, title, description, location, startTime: startRaw, endTime: endRaw };
  const errors: Record<string, string> = {};

  if (!title || title.length < 3) errors.title = 'Give the session a title.';
  if (title.length > 160) errors.title = 'Keep the title under 160 characters.';

  const program = programId
    ? await db.program.findUnique({ where: { id: programId }, select: { id: true } })
    : null;
  if (!program) errors.programId = 'Choose a programme.';

  const start = startRaw ? new Date(startRaw) : null;
  const end = endRaw ? new Date(endRaw) : null;

  if (!start || Number.isNaN(start.getTime())) errors.startTime = 'Enter a start time.';
  if (!end || Number.isNaN(end.getTime())) errors.endTime = 'Enter an end time.';
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (end <= start) errors.endTime = 'The end time must be after the start time.';
  }

  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors, values };
  }

  await db.timetableEntry.create({
    data: {
      programId,
      title,
      description: description || null,
      location: location || null,
      startTime: start as Date,
      endTime: end as Date,
    },
  });
  await audit(admin.id, 'timetable.created', 'TimetableEntry', undefined, {
    programId,
    title,
    startTime: start?.toISOString(),
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  return { status: 'success', message: `"${title}" added to the timetable.` };
}

/** Remove a scheduled session. */
export async function deleteTimetableEntry(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifyAdmin();
  const id = String(formData.get('id') ?? '');

  if (!id) return { status: 'error', message: 'Missing entry.' };

  const entry = await db.timetableEntry.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!entry) return { status: 'error', message: 'That entry does not exist.' };

  await db.timetableEntry.delete({ where: { id } });
  await audit(admin.id, 'timetable.deleted', 'TimetableEntry', id, { title: entry.title });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  return { status: 'success', message: `"${entry.title}" removed.` };
}

/* ------------------------------------------------------------------ *
 * Curriculum authoring
 * ------------------------------------------------------------------ */

export async function saveProgram(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const id = fieldValue(formData, 'id') || slugify(fieldValue(formData, 'title'));
  const originalId = fieldValue(formData, 'originalId');
  const title = fieldValue(formData, 'title');
  const duration = fieldValue(formData, 'duration');
  const description = fieldValue(formData, 'description');
  // Entered in naira — nobody wants to type kobo — and stored as minor units.
  const priceNaira = Number(fieldValue(formData, 'priceNaira') || 0);
  const errors: Record<string, string> = {};

  if (!id) errors.id = 'Enter a URL-safe programme ID.';
  if (!title || title.length < 3) errors.title = 'Programme title is required.';
  if (!duration) errors.duration = 'Duration is required.';
  if (description.length < 30) errors.description = 'Description needs at least 30 characters.';
  if (!Number.isFinite(priceNaira) || priceNaira < 0) {
    errors.priceNaira = 'Enter the tuition fee in naira, or 0 for free.';
  }
  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors };
  }

  const priceKobo = Math.round(priceNaira * 100);

  const existing = await db.program.findUnique({ where: { id } });
  if (!originalId && existing) {
    return { status: 'error', message: 'A programme with that ID already exists.', errors: { id: 'Choose a unique ID.' } };
  }

  const program = originalId
    ? await db.program.update({
        where: { id: originalId },
        data: { title, duration, description, priceKobo },
      })
    : await db.program.create({ data: { id, title, duration, description, priceKobo } });

  await audit(admin.id, originalId ? 'program.updated' : 'program.created', 'Program', program.id);
  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: originalId ? 'Programme updated.' : 'Programme created.' };
}

export async function saveModule(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const id = fieldValue(formData, 'id');
  const programId = fieldValue(formData, 'programId');
  const title = fieldValue(formData, 'title');
  const description = fieldValue(formData, 'description');
  const order = Number(fieldValue(formData, 'order'));
  const errors: Record<string, string> = {};

  if (!programId) errors.programId = 'Missing programme.';
  if (!title || title.length < 3) errors.title = 'Module title is required.';
  if (description.length < 10) errors.description = 'Description needs at least 10 characters.';
  if (!Number.isInteger(order) || order < 1) errors.order = 'Order must be 1 or higher.';
  if (Object.keys(errors).length > 0) return { status: 'error', message: 'Please check the highlighted fields.', errors };

  const savedModule = id
    ? await db.module.update({ where: { id }, data: { title, description, order } })
    : await db.module.create({ data: { programId, title, description, order } });

  await audit(admin.id, id ? 'module.updated' : 'module.created', 'Module', savedModule.id, { programId });
  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: id ? 'Module updated.' : 'Module added.' };
}

export async function saveLesson(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const id = fieldValue(formData, 'id');
  const moduleId = fieldValue(formData, 'moduleId');
  const title = fieldValue(formData, 'title');
  const content = fieldValue(formData, 'content');
  const videoUrl = fieldValue(formData, 'videoUrl');
  const resourceLabel = fieldValue(formData, 'resourceLabel');
  const resourceUrl = fieldValue(formData, 'resourceUrl');
  const order = Number(fieldValue(formData, 'order'));
  const errors: Record<string, string> = {};

  if (!moduleId) errors.moduleId = 'Missing module.';
  if (!title || title.length < 3) errors.title = 'Lesson title is required.';
  if (content.length < 20) errors.content = 'Lesson content needs at least 20 characters.';
  if (!Number.isInteger(order) || order < 1) errors.order = 'Order must be 1 or higher.';
  if ((resourceLabel && !resourceUrl) || (!resourceLabel && resourceUrl)) {
    errors.resourceUrl = 'Provide both a resource label and URL.';
  }
  if (Object.keys(errors).length > 0) return { status: 'error', message: 'Please check the highlighted fields.', errors };

  const lesson = id
    ? await db.lesson.update({ where: { id }, data: { title, content, videoUrl: videoUrl || null, order } })
    : await db.lesson.create({ data: { moduleId, title, content, videoUrl: videoUrl || null, order } });

  if (resourceLabel && resourceUrl) {
    await db.lessonResource.create({ data: { lessonId: lesson.id, label: resourceLabel, url: resourceUrl } });
  }

  await audit(admin.id, id ? 'lesson.updated' : 'lesson.created', 'Lesson', lesson.id, { moduleId });
  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: id ? 'Lesson updated.' : 'Lesson added.' };
}

export async function saveExam(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const id = fieldValue(formData, 'id');
  const programId = fieldValue(formData, 'programId');
  const title = fieldValue(formData, 'title');
  const description = fieldValue(formData, 'description');
  const passingScore = Number(fieldValue(formData, 'passingScore'));
  const errors: Record<string, string> = {};

  if (!programId) errors.programId = 'Missing programme.';
  if (!title || title.length < 3) errors.title = 'Exam title is required.';
  if (description.length < 10) errors.description = 'Description needs at least 10 characters.';
  if (!Number.isInteger(passingScore) || passingScore < 1 || passingScore > 100) errors.passingScore = 'Pass mark must be 1-100.';
  if (Object.keys(errors).length > 0) return { status: 'error', message: 'Please check the highlighted fields.', errors };

  const exam = id
    ? await db.exam.update({ where: { id }, data: { title, description, passingScore } })
    : await db.exam.create({ data: { programId, title, description, passingScore } });

  await audit(admin.id, id ? 'exam.updated' : 'exam.created', 'Exam', exam.id, { programId });
  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: id ? 'Exam updated.' : 'Exam added.' };
}

export async function saveQuestion(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const id = fieldValue(formData, 'id');
  const examId = fieldValue(formData, 'examId');
  const question = fieldValue(formData, 'question');
  const options = ['A', 'B', 'C', 'D'].map((letter) => fieldValue(formData, `option${letter}`));
  const correct = fieldValue(formData, 'correct').toUpperCase();
  const order = Number(fieldValue(formData, 'order'));
  const errors: Record<string, string> = {};

  if (!examId) errors.examId = 'Missing exam.';
  if (question.length < 10) errors.question = 'Question needs at least 10 characters.';
  options.forEach((option, index) => {
    if (!option) errors[`option${'ABCD'[index]}`] = 'Option is required.';
  });
  if (!['A', 'B', 'C', 'D'].includes(correct)) errors.correct = 'Correct answer must be A, B, C or D.';
  if (!Number.isInteger(order) || order < 1) errors.order = 'Order must be 1 or higher.';
  if (Object.keys(errors).length > 0) return { status: 'error', message: 'Please check the highlighted fields.', errors };

  const saved = id
    ? await db.examQuestion.update({ where: { id }, data: { question, options, correct, order } })
    : await db.examQuestion.create({ data: { examId, question, options, correct, order } });

  await audit(admin.id, id ? 'question.updated' : 'question.created', 'ExamQuestion', saved.id, { examId });
  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: id ? 'Question updated.' : 'Question added.' };
}

export async function saveProject(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const id = fieldValue(formData, 'id');
  const programId = fieldValue(formData, 'programId');
  const title = fieldValue(formData, 'title');
  const description = fieldValue(formData, 'description');
  const requirements = fieldValue(formData, 'requirements');
  const rubricLabel = fieldValue(formData, 'rubricLabel');
  const rubricPoints = Number(fieldValue(formData, 'rubricPoints') || 0);
  const errors: Record<string, string> = {};

  if (!programId) errors.programId = 'Missing programme.';
  if (!title || title.length < 3) errors.title = 'Project title is required.';
  if (description.length < 10) errors.description = 'Description needs at least 10 characters.';
  if (requirements.length < 20) errors.requirements = 'Requirements need at least 20 characters.';
  if (rubricLabel && (!Number.isInteger(rubricPoints) || rubricPoints < 1)) errors.rubricPoints = 'Rubric points must be 1 or higher.';
  if (Object.keys(errors).length > 0) return { status: 'error', message: 'Please check the highlighted fields.', errors };

  const project = id
    ? await db.project.update({ where: { id }, data: { title, description, requirements } })
    : await db.project.create({ data: { programId, title, description, requirements } });

  if (rubricLabel) {
    const count = await db.projectRubricItem.count({ where: { projectId: project.id } });
    await db.projectRubricItem.create({
      data: { projectId: project.id, label: rubricLabel, points: rubricPoints, order: count + 1 },
    });
  }

  await audit(admin.id, id ? 'project.updated' : 'project.created', 'Project', project.id, { programId });
  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: id ? 'Project updated.' : 'Project added.' };
}

export async function deleteCurriculumItem(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await verifySuperAdmin();
  const type = fieldValue(formData, 'type');
  const id = fieldValue(formData, 'id');

  if (!id) return { status: 'error', message: 'Missing item.' };

  if (type === 'question') {
    await db.examQuestion.delete({ where: { id } });
    await audit(admin.id, 'question.deleted', 'ExamQuestion', id);
  } else if (type === 'lesson') {
    await db.lesson.delete({ where: { id } });
    await audit(admin.id, 'lesson.deleted', 'Lesson', id);
  } else if (type === 'module') {
    await db.module.delete({ where: { id } });
    await audit(admin.id, 'module.deleted', 'Module', id);
  } else if (type === 'exam') {
    await db.exam.delete({ where: { id } });
    await audit(admin.id, 'exam.deleted', 'Exam', id);
  } else if (type === 'project') {
    await db.project.delete({ where: { id } });
    await audit(admin.id, 'project.deleted', 'Project', id);
  } else if (type === 'program') {
    const enrolled = await db.enrollment.count({ where: { programId: id } });
    if (enrolled > 0) {
      return { status: 'error', message: 'Cannot delete a programme with enrolled students.' };
    }
    await db.program.delete({ where: { id } });
    await audit(admin.id, 'program.deleted', 'Program', id);
  } else {
    return { status: 'error', message: 'Unknown curriculum item.' };
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');
  return { status: 'success', message: 'Deleted.' };
}
