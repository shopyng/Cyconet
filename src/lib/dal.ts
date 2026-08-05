import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { db } from './db';
import { getSession, type SessionUser } from './auth';

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

/** Session or redirect to the tenant's login. */
export const verifySession = cache(
  async (tenant: 'learning' | 'admin' = 'learning'): Promise<SessionUser> => {
    const user = await getSession();
    if (!user) redirect(`/${tenant}/login`);
    return user;
  },
);

/** Session with the ADMIN role, or redirect. */
export const verifyAdmin = cache(async (): Promise<SessionUser> => {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  // A student who somehow reaches an admin URL is bounced to their own hub
  // rather than shown a login form they are already past.
  if (user.role !== 'ADMIN') redirect('/learning');
  return user;
});

/* ------------------------------------------------------------------ *
 * Student reads
 * ------------------------------------------------------------------ */

/** Programs the signed-in student is enrolled in, with curriculum counts. */
export const myEnrollments = cache(async () => {
  const user = await verifySession();

  return db.enrollment.findMany({
    where: { userId: user.id },
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
    holder: certificate.user.name,
    program: certificate.program.title,
    duration: certificate.program.duration,
    issuedAt: certificate.issuedAt,
    code: certificate.verificationCode,
  };
}
