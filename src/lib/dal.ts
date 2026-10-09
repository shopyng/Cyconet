import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { db } from './db';
import { getSession, type SessionUser } from './auth';
import { tenantUrl } from './tenant';

/**
 * Data Access Layer.
 *
 * Every read in the app goes through here, and every function that returns
 * student data verifies the session first. The Next.js auth guide is explicit
 * about why: proxy runs on prefetches and Server Actions are reachable by
 * direct POST, so neither is a security boundary. This module is.
 *
 * `cache()` memoises per render pass, so a page that calls verifySession() in
 * the layout and again in three components pays for one cookie decrypt.
 */

/* ------------------------------------------------------------------ *
 * Session
 * ------------------------------------------------------------------ */

/** Session or null. Use when unauthenticated is a legitimate state. */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  return getSession();
});

/**
 * Session or redirect to the tenant's login.
 *
 * `/login` — not `/learning/login`. The prefix is internal to the rewrite; the
 * proxy 404s any path that arrives carrying it, and a redirect Location goes
 * back to the browser as a fresh request on the same host.
 */
export const verifySession = cache(async (): Promise<SessionUser> => {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
});

/** Session with the ADMIN role, or redirect. */
export const verifyAdmin = cache(async (): Promise<SessionUser> => {
  const user = await getSession();
  if (!user) redirect('/login');
  /*
   * A signed-in student who reaches an admin URL is sent to their own hub rather
   * than shown a login form they are already past. That hub is on another host,
   * so this one needs an absolute URL — a bare '/' would just land them back on
   * the admin dashboard and bounce again.
   */
  if (user.role !== 'ADMIN') redirect(await tenantUrl('learning'));
  return user;
});

/* ------------------------------------------------------------------ *
 * Student reads
 * ------------------------------------------------------------------ */

/** Programs the signed-in student is enrolled in, with curriculum counts. */
export const myEnrollments = cache(async () => {
  const user = await verifySession();

  return db.enrollment.findMany({
    // ACTIVE only, to match isEnrolled(): an unpaid programme must not appear
    // in the hub, or the student would see lessons they cannot open.
    where: { userId: user.id, status: 'ACTIVE' },
    include: {
      program: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: { lessons: { orderBy: { order: 'asc' } } },
          },
          exams: { include: { questions: { select: { id: true } } } },
          projects: true,
        },
      },
    },
    orderBy: { startedAt: 'asc' },
  });
});

/** Lesson IDs this student has completed, as a Set for O(1) lookup. */
export const myCompletedLessonIds = cache(async (): Promise<Set<string>> => {
  const user = await verifySession();
  const rows = await db.progress.findMany({
    where: { userId: user.id, completed: true },
    select: { lessonId: true },
  });
  return new Set(rows.map((r) => r.lessonId));
});

/** Best attempt per exam for this student, keyed by exam ID. */
export const myBestAttempts = cache(async () => {
  const user = await verifySession();
  const attempts = await db.examAttempt.findMany({
    where: { userId: user.id },
    orderBy: { score: 'desc' },
  });

  const best = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (!best.has(attempt.examId)) best.set(attempt.examId, attempt);
  }
  return best;
});

/** Latest submission per project for this student, keyed by project ID. */
export const mySubmissions = cache(async () => {
  const user = await verifySession();
  const submissions = await db.projectSubmission.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: 'desc' },
  });

  const latest = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!latest.has(submission.projectId)) latest.set(submission.projectId, submission);
  }
  return latest;
});

/**
 * A lesson plus the module and program it belongs to — but only if the
 * signed-in student is enrolled in that program. Returns null otherwise, so
 * callers render notFound() rather than leaking that the lesson exists.
 */
export const lessonForStudent = cache(async (lessonId: string) => {
  const user = await verifySession();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: { orderBy: { createdAt: 'asc' } },
      module: {
        include: {
          program: true,
          lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } },
        },
      },
    },
  });
  if (!lesson) return null;

  const enrolled = await db.enrollment.findUnique({
    where: {
      userId_programId: { userId: user.id, programId: lesson.module.programId },
    },
  });
  if (!enrolled) return null;

  const progress = await db.progress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  return { lesson, completed: progress?.completed ?? false };
});

/**
 * True when the signed-in student is enrolled on `programId`.
 *
 * The gate every program-scoped read goes through. Enrolment — not merely
 * holding a session — is what grants access to curriculum, exams and projects.
 */
export const isEnrolled = cache(async (programId: string): Promise<boolean> => {
  const user = await verifySession();
  const enrollment = await db.enrollment.findUnique({
    where: { userId_programId: { userId: user.id, programId } },
    select: { status: true },
  });
  /*
   * ACTIVE only. Every learning Server Action gates on this function, and those
   * actions are reachable by direct POST — so a student whose enrolment is
   * still PENDING_PAYMENT must fail here, not merely be redirected away from
   * the UI by the layout. Payment is a real boundary, and this is where it is
   * enforced for writes.
   */
  return enrollment?.status === 'ACTIVE';
});

/**
 * One programme with its full curriculum, but only if this student is on it.
 * Null otherwise, so callers render notFound() rather than confirming that a
 * programme they cannot see exists.
 */
export const programForStudent = cache(async (programId: string) => {
  if (!(await isEnrolled(programId))) return null;

  return db.program.findUnique({
    where: { id: programId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });
});

/** Every exam across this student's programmes, with the programme title. */
export const myExams = cache(async () => {
  const user = await verifySession();
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    select: { programId: true },
  });

  return db.exam.findMany({
    where: { programId: { in: enrollments.map((e) => e.programId) } },
    include: {
      program: { select: { id: true, title: true } },
      questions: { select: { id: true } },
    },
    orderBy: { title: 'asc' },
  });
});

/**
 * One exam with its questions, enrolment-checked.
 *
 * `correct` is deliberately NOT selected. The questions are rendered into a
 * page the student can view source on, so shipping the answer key would make
 * the exam meaningless. Grading re-reads the correct answers server-side.
 */
export const examForStudent = cache(async (examId: string) => {
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      program: { select: { id: true, title: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: { id: true, question: true, options: true, order: true },
      },
    },
  });
  if (!exam) return null;
  if (!(await isEnrolled(exam.programId))) return null;
  return exam;
});

/** Every attempt this student has made at one exam, newest first. */
export const myAttemptsForExam = cache(async (examId: string) => {
  const user = await verifySession();
  return db.examAttempt.findMany({
    where: { userId: user.id, examId },
    orderBy: { attemptedAt: 'desc' },
  });
});

/**
 * The student's open sitting for an exam, or null.
 *
 * Returns the questions already reordered into the permutation frozen when the
 * sitting started, with each question's options likewise permuted. The page
 * renders exactly what comes back, so a reload cannot deal a different paper.
 *
 * Each option carries the letter it maps back to in `ExamQuestion.correct`, so
 * the form still posts canonical letters and the grader is unchanged — the
 * shuffle is presentation only.
 */
export const myActiveExamSession = cache(async (examId: string) => {
  const user = await verifySession();

  const session = await db.examSession.findFirst({
    where: { userId: user.id, examId, status: 'ACTIVE' },
    orderBy: { startedAt: 'desc' },
  });
  if (!session) return null;

  // Expired but never closed out — treat as gone rather than serving a paper
  // whose submission the action would refuse anyway.
  if (session.expiresAt.getTime() <= Date.now()) return null;

  const questions = await db.examQuestion.findMany({
    where: { examId },
    select: { id: true, question: true, options: true },
  });
  const byId = new Map(questions.map((question) => [question.id, question]));

  const order = Array.isArray(session.questionOrder)
    ? (session.questionOrder as string[])
    : [];
  const optionOrder =
    session.optionOrder && typeof session.optionOrder === 'object'
      ? (session.optionOrder as Record<string, number[]>)
      : {};

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  const paper = order.flatMap((questionId) => {
    const question = byId.get(questionId);
    if (!question) return []; // Deleted mid-sitting — skip rather than crash.

    const raw = Array.isArray(question.options) ? question.options.map(String) : [];
    const permutation = optionOrder[questionId] ?? raw.map((_, index) => index);

    return [
      {
        id: question.id,
        question: question.question,
        options: permutation
          .filter((index) => index < raw.length)
          .map((index) => ({
            /* The canonical letter — what the grader compares against. */
            value: LETTERS[index] ?? String(index + 1),
            text: raw[index],
          })),
      },
    ];
  });

  const saved =
    session.savedAnswers && typeof session.savedAnswers === 'object'
      ? (session.savedAnswers as Record<string, string>)
      : {};

  return {
    id: session.id,
    expiresAt: session.expiresAt,
    violations: session.violations,
    questions: paper,
    savedAnswers: saved,
  };
});

/** Every project across this student's programmes. */
export const myProjects = cache(async () => {
  const user = await verifySession();
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    select: { programId: true },
  });

  return db.project.findMany({
    where: { programId: { in: enrollments.map((e) => e.programId) } },
    include: {
      program: { select: { id: true, title: true } },
      rubricItems: { orderBy: { order: 'asc' } },
    },
    orderBy: { title: 'asc' },
  });
});

/** One project with this student's submission history, enrolment-checked. */
export const projectForStudent = cache(async (projectId: string) => {
  const user = await verifySession();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      program: { select: { id: true, title: true } },
      rubricItems: { orderBy: { order: 'asc' } },
    },
  });
  if (!project) return null;
  if (!(await isEnrolled(project.programId))) return null;

  const submissions = await db.projectSubmission.findMany({
    where: { userId: user.id, projectId },
    include: { feedbackThread: { orderBy: { createdAt: 'asc' } } },
    orderBy: { submittedAt: 'desc' },
  });

  return { project, submissions };
});

/**
 * Scheduled sessions for this student's programmes, split at "now".
 *
 * The partition happens here rather than in the page because a Server
 * Component must be pure — reading the clock during render is exactly what
 * `react-hooks/purity` forbids. This module is not a component, and a
 * per-request read of the current time is the intended behaviour.
 */
export const myTimetable = cache(async () => {
  const user = await verifySession();
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    include: { program: { select: { id: true, title: true } } },
  });

  const titles = new Map(enrollments.map((e) => [e.programId, e.program.title]));
  const entries = await db.timetableEntry.findMany({
    where: { programId: { in: [...titles.keys()] } },
    orderBy: { startTime: 'asc' },
  });

  return splitByTime(
    entries.map((entry) => ({
      ...entry,
      programTitle: titles.get(entry.programId) ?? entry.programId,
    })),
  );
});

/** Certificates this student has earned. */
export const myCertificates = cache(async () => {
  const user = await verifySession();
  return db.certificate.findMany({
    where: { userId: user.id },
    include: { program: { select: { id: true, title: true, duration: true } } },
    orderBy: { issuedAt: 'desc' },
  });
});

/* ------------------------------------------------------------------ *
 * Payments
 * ------------------------------------------------------------------ */

/**
 * This student's outstanding payment, if any — the row the payment screen
 * renders. Newest first, so a student who somehow has two sees the current one.
 *
 * The proof blob is deliberately not selected: the screen only needs to know
 * whether something was uploaded and what it was called.
 */
export const myPendingPayment = cache(async () => {
  const user = await verifySession();

  return db.payment.findFirst({
    where: { userId: user.id, status: { in: ['AWAITING_PROOF', 'PENDING', 'REJECTED'] } },
    select: {
      id: true,
      reference: true,
      amountKobo: true,
      status: true,
      reviewNotes: true,
      createdAt: true,
      program: { select: { id: true, title: true, duration: true } },
      proof: { select: { fileName: true, mimeType: true, uploadedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
});

/**
 * Gate for the signed-in student area.
 *
 * Redirects to the payment screen unless at least one enrolment is ACTIVE.
 * This is the *navigational* half of the payment boundary — the enforcing half
 * is `isEnrolled()`, which every write action calls. A layout alone would not
 * be enough, since Server Actions do not run layouts.
 */
export const requireActiveEnrollment = cache(async (): Promise<void> => {
  const user = await verifySession();

  const active = await db.enrollment.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!active) redirect('/payment');
});

/* ------------------------------------------------------------------ *
 * Certificate eligibility
 * ------------------------------------------------------------------ */

export type Eligibility = {
  eligible: boolean;
  lessons: { done: number; total: number };
  exams: { passed: number; total: number };
  projects: { approved: number; total: number };
};

/**
 * The single definition of "finished the programme".
 *
 * Shared deliberately: the student's progress panel and the admin's issue
 * button both call this, so the rule cannot drift into two versions that
 * disagree about whether someone has earned a certificate.
 *
 * All three gates must pass — every lesson complete, every exam passed at its
 * own passingScore, every project approved.
 */
export async function eligibility(
  userId: string,
  programId: string,
): Promise<Eligibility> {
  const [program, completed, attempts, submissions] = await Promise.all([
    db.program.findUnique({
      where: { id: programId },
      include: {
        modules: { include: { lessons: { select: { id: true } } } },
        exams: { select: { id: true, passingScore: true } },
        projects: { select: { id: true } },
      },
    }),
    db.progress.findMany({ where: { userId, completed: true }, select: { lessonId: true } }),
    db.examAttempt.findMany({ where: { userId, passed: true }, select: { examId: true } }),
    db.projectSubmission.findMany({
      where: { userId, status: 'APPROVED' },
      select: { projectId: true },
    }),
  ]);

  if (!program) {
    return {
      eligible: false,
      lessons: { done: 0, total: 0 },
      exams: { passed: 0, total: 0 },
      projects: { approved: 0, total: 0 },
    };
  }

  const lessonIds = program.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedIds = new Set(completed.map((p) => p.lessonId));
  const passedExamIds = new Set(attempts.map((a) => a.examId));
  const approvedProjectIds = new Set(submissions.map((s) => s.projectId));

  const lessons = {
    done: lessonIds.filter((id) => completedIds.has(id)).length,
    total: lessonIds.length,
  };
  const exams = {
    passed: program.exams.filter((e) => passedExamIds.has(e.id)).length,
    total: program.exams.length,
  };
  const projects = {
    approved: program.projects.filter((p) => approvedProjectIds.has(p.id)).length,
    total: program.projects.length,
  };

  return {
    eligible:
      lessons.done === lessons.total &&
      exams.passed === exams.total &&
      projects.approved === projects.total,
    lessons,
    exams,
    projects,
  };
}

/* ------------------------------------------------------------------ *
 * Admin reads
 * ------------------------------------------------------------------ */

export const pendingApplications = cache(async () => {
  await verifyAdmin();
  return db.application.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });
});

export const allApplications = cache(async () => {
  await verifyAdmin();
  return db.application.findMany({ orderBy: { createdAt: 'desc' } });
});

export const allStudents = cache(async () => {
  await verifyAdmin();
  return db.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      enrollments: { include: { program: { select: { id: true, title: true } } } },
      certificates: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
});

export const pendingSubmissions = cache(async () => {
  await verifyAdmin();
  return db.projectSubmission.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, programId: true } },
    },
    orderBy: { submittedAt: 'asc' },
  });
});

/** One application, or null. */
export const applicationById = cache(async (id: string) => {
  await verifyAdmin();
  return db.application.findUnique({ where: { id } });
});

/**
 * One student with everything staff need on a single screen: enrolments,
 * per-programme progress, attempts, submissions and certificates.
 */
export const studentById = cache(async (id: string) => {
  await verifyAdmin();

  const student = await db.user.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: { program: { select: { id: true, title: true, duration: true } } },
        orderBy: { startedAt: 'asc' },
      },
      examAttempts: {
        include: { exam: { select: { id: true, title: true, passingScore: true } } },
        orderBy: { attemptedAt: 'desc' },
      },
      projectSubmissions: {
        include: { project: { select: { id: true, title: true } } },
        orderBy: { submittedAt: 'desc' },
      },
      certificates: {
        include: { program: { select: { id: true, title: true } } },
        orderBy: { issuedAt: 'desc' },
      },
    },
  });
  // Staff pages are for students; an admin ID here is a mistyped URL, not a hit.
  if (!student || student.role !== 'STUDENT') return null;

  const progress = await eligibility_forEnrollments(student.id, student.enrollments);
  return { student, progress };
});

/** Eligibility for each of a student's programmes, keyed by programme ID. */
async function eligibility_forEnrollments(
  userId: string,
  enrollments: readonly { programId: string }[],
): Promise<Map<string, Eligibility>> {
  const entries = await Promise.all(
    enrollments.map(async (e) => [e.programId, await eligibility(userId, e.programId)] as const),
  );
  return new Map(entries);
}

/** Every submission, newest first — the review queue's history view. */
export const allSubmissions = cache(async () => {
  await verifyAdmin();
  return db.projectSubmission.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, programId: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });
});

/** One submission with the full project brief, for the review screen. */
export const submissionById = cache(async (id: string) => {
  await verifyAdmin();
  return db.projectSubmission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: true,
    },
  });
});

/** Every programme with curriculum counts, for the curriculum index. */
export const allPrograms = cache(async () => {
  await verifyAdmin();
  return db.program.findMany({
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { resources: { orderBy: { createdAt: 'asc' } } },
          },
        },
      },
      exams: { include: { questions: { select: { id: true } } } },
      projects: { include: { rubricItems: { orderBy: { order: 'asc' } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { title: 'asc' },
  });
});

/** One programme's full curriculum, for the staff detail view. */
export const programForAdmin = cache(async (programId: string) => {
  await verifyAdmin();
  return db.program.findUnique({
    where: { id: programId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { resources: { orderBy: { createdAt: 'asc' } } },
          },
        },
      },
      exams: { include: { questions: { orderBy: { order: 'asc' } } } },
      projects: { include: { rubricItems: { orderBy: { order: 'asc' } } } },
      _count: { select: { enrollments: true } },
    },
  });
});

/**
 * Every payment, newest first.
 *
 * Deliberately not ordered by status: Postgres sorts an enum by its declaration
 * order, which would put AWAITING_PROOF (nothing uploaded, nothing to do) ahead
 * of PENDING (a receipt waiting on a decision). The page groups them instead,
 * where the intent is explicit.
 *
 * The proof blob is not selected — only its metadata — so listing a hundred
 * payments does not pull a hundred receipts out of Postgres.
 */
export const allPayments = cache(async () => {
  await verifyAdmin();

  return db.payment.findMany({
    select: {
      id: true,
      reference: true,
      amountKobo: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      reviewNotes: true,
      user: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, title: true } },
      proof: { select: { fileName: true, mimeType: true, size: true, uploadedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
});

/** Count of receipts waiting on a decision — drives the admin nav badge. */
export const pendingPaymentCount = cache(async (): Promise<number> => {
  await verifyAdmin();
  return db.payment.count({ where: { status: 'PENDING' } });
});

/** Every issued certificate, newest first. */export const allCertificates = cache(async () => {
  await verifyAdmin();
  return db.certificate.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, title: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });
});

/**
 * Students who have met every gate on a programme but hold no certificate yet
 * — the "ready to issue" queue.
 *
 * Deliberately computed rather than stored: eligibility() is the single
 * definition of finished, so this list can never disagree with the student's
 * own progress panel.
 */
export const certificateCandidates = cache(async () => {
  await verifyAdmin();

  const enrollments = await db.enrollment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, title: true } },
    },
  });
  const issued = await db.certificate.findMany({
    select: { userId: true, programId: true },
  });
  const has = new Set(issued.map((c) => `${c.userId}:${c.programId}`));

  const candidates = await Promise.all(
    enrollments
      .filter((e) => !has.has(`${e.userId}:${e.programId}`))
      .map(async (e) => ({ enrollment: e, status: await eligibility(e.userId, e.programId) })),
  );

  return candidates.filter((c) => c.status.eligible);
});

/** Every scheduled session with its programme title, split at "now". */
export const allTimetableEntries = cache(async () => {
  await verifyAdmin();
  const [entries, programs] = await Promise.all([
    db.timetableEntry.findMany({ orderBy: { startTime: 'asc' } }),
    db.program.findMany({ select: { id: true, title: true } }),
  ]);

  const titles = new Map(programs.map((p) => [p.id, p.title]));
  return splitByTime(
    entries.map((entry) => ({
      ...entry,
      programTitle: titles.get(entry.programId) ?? entry.programId,
    })),
  );
});

/**
 * Partition timetable entries into upcoming and past.
 *
 * A session counts as upcoming until it *ends*, so one in progress right now
 * still shows under "upcoming" rather than vanishing mid-class. Past entries
 * come back newest-first, which is the useful order for a historical list.
 */
function splitByTime<T extends { endTime: Date }>(entries: readonly T[]) {
  const now = Date.now();
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const entry of entries) {
    if (entry.endTime.getTime() >= now) upcoming.push(entry);
    else past.push(entry);
  }

  return { upcoming, past: past.reverse(), total: entries.length };
}

/** Programme id/title pairs for form dropdowns. */
export const programOptions = cache(async () => {
  await verifyAdmin();
  return db.program.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });
});

export const opsOverview = cache(async () => {
  await verifyAdmin();

  const [
    auditLogs,
    notifications,
    users,
    applications,
    enrollments,
    certificates,
    pendingReviews,
    programmes,
  ] = await Promise.all([
    db.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.notification.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.user.count(),
    db.application.count(),
    db.enrollment.count(),
    db.certificate.count(),
    db.projectSubmission.count({ where: { status: 'PENDING' } }),
    db.program.count(),
  ]);

  return {
    auditLogs,
    notifications,
    metrics: { users, applications, enrollments, certificates, pendingReviews, programmes },
    checks: {
      database: true,
      email: Boolean(process.env.RESEND_API_KEY && process.env.LEAD_FROM_EMAIL && process.env.LEAD_NOTIFY_EMAIL),
      backups: Boolean(process.env.BACKUPS_VERIFIED_AT),
      superAdmins: Boolean(process.env.SUPER_ADMIN_EMAILS),
      siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      rootDomain: Boolean(process.env.NEXT_PUBLIC_ROOT_DOMAIN),
      sessionSecret: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET !== 'dev-secret-change-in-production'),
    },
  };
});

/* ------------------------------------------------------------------ *
 * Public
 * ------------------------------------------------------------------ */

/**
 * Certificate lookup for the public verification page. No session required —
 * that is the point — so it returns only what an employer needs to confirm
 * the credential, and nothing else about the holder.
 */
export async function certificateByCode(code: string) {
  const certificate = await db.certificate.findUnique({
    where: { verificationCode: code },
    include: {
      user: { select: { name: true } },
      program: { select: { title: true, duration: true } },
    },
  });
  if (!certificate) return null;

  return {
    holder: certificate.holderName ?? certificate.user?.name ?? 'Certificate holder',
    program: certificate.program.title,
    duration: certificate.program.duration,
    issuedAt: certificate.issuedAt,
    code: certificate.verificationCode,
  };
}

/**
 * Certificate lookup for the public PDF route. Signature artwork is included
 * only for this explicit download path; the verification page and admin lists
 * continue to receive metadata only.
 */
export async function certificateForPdfByCode(code: string) {
  const certificate = await db.certificate.findUnique({
    where: { verificationCode: code },
    include: {
      user: { select: { name: true } },
      program: { select: { title: true, duration: true } },
      signatures: { select: { kind: true, data: true, mimeType: true } },
    },
  });
  if (!certificate) return null;

  return {
    holder: certificate.holderName ?? certificate.user?.name ?? 'Certificate holder',
    program: certificate.program.title,
    duration: certificate.program.duration,
    issuedAt: certificate.issuedAt,
    code: certificate.verificationCode,
    signatures: certificate.signatures.map((signature) => ({
      kind: signature.kind,
      data: new Uint8Array(signature.data),
      mimeType: signature.mimeType as 'image/png' | 'image/jpeg',
    })),
  };
}
