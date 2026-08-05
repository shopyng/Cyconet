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
import { db } from './db';
import { verifyAdmin, eligibility } from './dal';
import { hashPassword } from './auth';
import type { FormState } from './form-state';

/**
 * Verification codes for certificates.
 *
 * Crockford-style alphabet: no I, L, O, U, so a code read off a printed
 * certificate cannot be mistyped as a lookalike digit. 10 characters over 32
 * symbols is ~50 bits — not guessable by enumeration.
 */
const verificationCode = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 10);

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
  });

  revalidatePath('/admin', 'layout');

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
  await verifyAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const feedback = String(formData.get('feedback') ?? '').trim();

  if (!id || (decision !== 'APPROVED' && decision !== 'NEEDS_REVISION')) {
    return { status: 'error', message: 'Choose approve or request changes.' };
  }

  const submission = await db.projectSubmission.findUnique({
    where: { id },
    select: { id: true },
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

  await db.projectSubmission.update({
    where: { id },
    data: {
      status: decision,
      feedback: feedback || null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  return {
    status: 'success',
    message: decision === 'APPROVED' ? 'Submission approved.' : 'Revision requested.',
  };
}

/* ------------------------------------------------------------------ *
 * Certificates
 * ------------------------------------------------------------------ */

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
  await verifyAdmin();
  const userId = String(formData.get('userId') ?? '');
  const programId = String(formData.get('programId') ?? '');

  if (!userId || !programId) {
    return { status: 'error', message: 'Missing student or programme.' };
  }

  const [student, program, existing] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
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
    data: { userId, programId, verificationCode: verificationCode() },
  });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  return {
    status: 'success',
    message: `Certificate issued to ${student.name} for ${program.title}. Verification code: ${certificate.verificationCode}`,
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
  await verifyAdmin();

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

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  return { status: 'success', message: `"${title}" added to the timetable.` };
}

/** Remove a scheduled session. */
export async function deleteTimetableEntry(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await verifyAdmin();
  const id = String(formData.get('id') ?? '');

  if (!id) return { status: 'error', message: 'Missing entry.' };

  const entry = await db.timetableEntry.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!entry) return { status: 'error', message: 'That entry does not exist.' };

  await db.timetableEntry.delete({ where: { id } });

  revalidatePath('/admin', 'layout');
  revalidatePath('/learning', 'layout');

  return { status: 'success', message: `"${entry.title}" removed.` };
}
