'use server';

/**
 * Server Actions for the student hub.
 *
 * Every action re-derives the session with `verifySession()` and re-checks
 * enrolment against the database. Nothing trusts an ID arriving in the
 * FormData: Server Actions are reachable by direct POST, so a hand-crafted
 * request could otherwise mark another programme's lessons complete or submit
 * work to a project the sender is not on.
 *
 * Actions return `FormState` so forms can drive them with `useActionState` and
 * still work without JavaScript, matching the pattern in actions.ts.
 */

import { revalidatePath } from 'next/cache';
import { db } from './db';
import { verifySession, isEnrolled } from './dal';
import { VIOLATION_LIMIT, SUBMIT_GRACE_MS } from './exam-rules';
import type { FormState } from './form-state';

/* ------------------------------------------------------------------ *
 * Lessons
 * ------------------------------------------------------------------ */

/**
 * Mark a lesson complete or incomplete.
 *
 * Upserts rather than creates: Progress is unique on (userId, lessonId), so a
 * student toggling a lesson twice would otherwise hit a constraint violation
 * on the second press.
 */
export async function setLessonProgress(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await verifySession();
  const lessonId = String(formData.get('lessonId') ?? '');
  const completed = String(formData.get('completed') ?? '') === 'true';

  if (!lessonId) {
    return { status: 'error', message: 'Missing lesson.' };
  }

  // Walk lesson → module → programme so enrolment is checked against the
  // lesson's real owner rather than a programme ID supplied by the caller.
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { programId: true } } },
  });
  if (!lesson) {
    return { status: 'error', message: 'That lesson does not exist.' };
  }
  if (!(await isEnrolled(lesson.module.programId))) {
    return { status: 'error', message: 'You are not enrolled on that programme.' };
  }

  await db.progress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: { completed, completedAt: completed ? new Date() : null },
  });

  revalidatePath('/learning', 'layout');

  return {
    status: 'success',
    message: completed ? 'Lesson marked complete.' : 'Lesson marked incomplete.',
  };
}

/* ------------------------------------------------------------------ *
 * Exams
 * ------------------------------------------------------------------ */

/**
 * Fisher-Yates, seeded from the caller.
 *
 * Deterministic given a seed so the same permutation can be recomputed if
 * needed, and — more importantly — computed once on the server and then stored,
 * rather than re-derived per render where a reload would deal a new hand.
 */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    // xorshift32 — small, fast, and good enough to scramble a question order.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const j = Math.abs(state) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Open a sitting.
 *
 * This is where the clock starts and the paper is dealt. Both are recorded on
 * the ExamSession so neither can be renegotiated later: the deadline is a
 * stored timestamp rather than a duration the client counts down, and the
 * question order is frozen so reloading cannot reshuffle into a fresh paper.
 *
 * Returns the existing session if one is already open, which makes the action
 * idempotent — a double-click or a browser retry resumes rather than restarting
 * the clock.
 */
export async function startExamSession(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await verifySession();
  const examId = String(formData.get('examId') ?? '');

  if (!examId) return { status: 'error', message: 'Missing exam.' };

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { order: 'asc' }, select: { id: true, options: true } } },
  });

  if (!exam) return { status: 'error', message: 'That exam does not exist.' };
  if (!(await isEnrolled(exam.programId))) {
    return { status: 'error', message: 'You are not enrolled on that programme.' };
  }
  if (exam.questions.length === 0) {
    return { status: 'error', message: 'This exam has no questions yet.' };
  }

  const now = new Date();

  // Resume an open sitting rather than starting a second one.
  const open = await db.examSession.findFirst({
    where: { userId: user.id, examId, status: 'ACTIVE' },
    select: { id: true, expiresAt: true },
  });
  if (open) {
    if (open.expiresAt > now) {
      revalidatePath('/exams');
      return { status: 'success', message: 'Resuming your sitting.' };
    }
    // Expired while nobody was looking — close it out so a new one can start.
    await db.examSession.update({
      where: { id: open.id },
      data: { status: 'EXPIRED' },
    });
  }

  if (exam.maxAttempts > 0) {
    const used = await db.examAttempt.count({ where: { userId: user.id, examId } });
    if (used >= exam.maxAttempts) {
      return {
        status: 'error',
        message: `You have used all ${exam.maxAttempts} attempts at this exam.`,
      };
    }
  }

  const seed = Math.floor(Math.random() * 2 ** 31) || 1;
  const questionIds = exam.questions.map((question) => question.id);
  const questionOrder = exam.shuffleQuestions ? shuffled(questionIds, seed) : questionIds;

  /*
   * Option order is stored as index permutations, not reordered text. The
   * grader compares answer letters against ExamQuestion.correct, so the
   * mapping from what the student saw back to the canonical letter has to be
   * recoverable — storing the shuffled strings would lose it.
   */
  const optionOrder: Record<string, number[]> = {};
  for (const question of exam.questions) {
    const count = Array.isArray(question.options) ? question.options.length : 0;
    const indices = Array.from({ length: count }, (_, i) => i);
    optionOrder[question.id] = exam.shuffleQuestions
      ? shuffled(indices, seed + question.id.charCodeAt(0))
      : indices;
  }

  await db.examSession.create({
    data: {
      userId: user.id,
      examId,
      expiresAt: new Date(now.getTime() + exam.durationMinutes * 60_000),
      questionOrder,
      optionOrder,
      status: 'ACTIVE',
    },
  });

  revalidatePath('/exams');
  return { status: 'success', message: 'Your sitting has started.' };
}

/**
 * Record an integrity event (focus loss, paste attempt, tab switch).
 *
 * Counted server-side rather than in the client's state, because the client is
 * exactly the thing being watched: a student who opens devtools can reset a
 * React counter, but not a column in Postgres.
 *
 * Returns the running total so the paper can show how many strikes remain.
 */
export async function recordExamViolation(
  sessionId: string,
  kind: string,
): Promise<{ violations: number; locked: boolean }> {
  const user = await verifySession();

  const session = await db.examSession.findFirst({
    where: { id: sessionId, userId: user.id, status: 'ACTIVE' },
    select: { id: true, violations: true, violationLog: true },
  });

  // Nothing to record against — an already-submitted sitting, or someone
  // else's. Report it as locked so a stray event cannot reopen a paper.
  if (!session) return { violations: VIOLATION_LIMIT, locked: true };

  const log = Array.isArray(session.violationLog) ? session.violationLog : [];
  const violations = session.violations + 1;

  await db.examSession.update({
    where: { id: session.id },
    data: {
      violations,
      violationLog: [
        ...log,
        { kind: kind.slice(0, 40), at: new Date().toISOString() },
      ],
    },
  });

  return { violations, locked: violations >= VIOLATION_LIMIT };
}

/** Persist answers mid-sitting so a forced submit still grades real work. */
export async function saveExamAnswers(
  sessionId: string,
  answers: Record<string, string>,
): Promise<void> {
  const user = await verifySession();

  await db.examSession.updateMany({
    where: { id: sessionId, userId: user.id, status: 'ACTIVE' },
    data: { savedAnswers: answers },
  });
}

/**
 * Grade and record an exam attempt.
 *
 * Grading reads the correct answers here, server-side, and the questions are
 * re-fetched from the database rather than taken from the submission. The
 * client is told which questions exist but never which answers are right, so
 * a forged POST cannot claim a pass it did not earn.
 *
 * A valid session is now required. That is what makes the timer and the attempt
 * limit real: without it, a student could skip the paper entirely and POST
 * answers directly, which is precisely what the old unlimited-attempts version
 * allowed by design.
 */
export async function submitExam(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await verifySession();
  const sessionId = String(formData.get('sessionId') ?? '');
  // Set by the client when the deadline or the violation limit ended the
  // sitting, rather than the student pressing submit.
  const auto = String(formData.get('auto') ?? '') === 'true';

  if (!sessionId) {
    return { status: 'error', message: 'Missing sitting. Start the exam again.' };
  }

  const session = await db.examSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      exam: {
        include: { questions: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!session) {
    return { status: 'error', message: 'That sitting does not exist.' };
  }
  if (session.status !== 'ACTIVE') {
    return { status: 'error', message: 'This sitting has already been submitted.' };
  }
  if (!(await isEnrolled(session.exam.programId))) {
    return { status: 'error', message: 'You are not enrolled on that programme.' };
  }

  const now = Date.now();
  if (now > session.expiresAt.getTime() + SUBMIT_GRACE_MS) {
    await db.examSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
    return {
      status: 'error',
      message: 'Time ran out before this reached us. Start a new sitting to try again.',
    };
  }

  const questions = session.exam.questions;

  /*
   * Answers come from the form when the student submitted, and fall back to
   * what was saved during the sitting. The fallback is what makes a forced
   * submit — deadline hit, or three violations — grade the work actually done
   * rather than scoring zero.
   */
  const saved =
    session.savedAnswers && typeof session.savedAnswers === 'object'
      ? (session.savedAnswers as Record<string, string>)
      : {};

  const answers: Record<string, string> = {};
  for (const question of questions) {
    const posted = String(formData.get(`q_${question.id}`) ?? '');
    answers[question.id] = posted || saved[question.id] || '';
  }

  const answered = Object.values(answers).filter(Boolean).length;

  // Only a deliberate submit has to be complete. An auto-submit is graded on
  // whatever was done — refusing it would mean the student loses the attempt
  // and the work both.
  if (!auto && answered < questions.length) {
    return {
      status: 'error',
      message: `Answer every question before submitting — ${
        questions.length - answered
      } left.`,
    };
  }

  const correct = questions.filter((q) => answers[q.id] === q.correct).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= session.exam.passingScore;

  await db.$transaction(async (tx) => {
    await tx.examAttempt.create({
      data: {
        userId: user.id,
        examId: session.examId,
        sessionId: session.id,
        score,
        answers,
        passed,
        autoSubmitted: auto,
        violations: session.violations,
      },
    });
    await tx.examSession.update({
      where: { id: session.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  });

  revalidatePath('/learning', 'layout');

  if (passed) {
    return {
      status: 'success',
      message: `Passed with ${score}% (${correct} of ${questions.length} correct).`,
    };
  }

  const remaining =
    session.exam.maxAttempts > 0
      ? session.exam.maxAttempts -
        (await db.examAttempt.count({ where: { userId: user.id, examId: session.examId } }))
      : null;

  return {
    status: 'error',
    message:
      `Scored ${score}% — ${session.exam.passingScore}% is needed to pass.` +
      (remaining === null
        ? ' You can retake this exam.'
        : remaining > 0
          ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : ' You have no attempts remaining.'),
  };
}

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

/** Loose URL check — the reviewer opens these by hand, so only shape matters. */
const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/;

/**
 * Submit work for a project.
 *
 * A new row per submission rather than an update: the history is the point.
 * When a reviewer asks for changes, both the original and the revision stay on
 * record, and `mySubmissions` surfaces the latest.
 */
export async function submitProject(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await verifySession();
  const projectId = String(formData.get('projectId') ?? '');
  const repoUrl = String(formData.get('repoUrl') ?? '').trim();
  const demoUrl = String(formData.get('demoUrl') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  const values = { repoUrl, demoUrl, description };

  if (!projectId) {
    return { status: 'error', message: 'Missing project.', values };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, programId: true },
  });
  if (!project) {
    return { status: 'error', message: 'That project does not exist.', values };
  }
  if (!(await isEnrolled(project.programId))) {
    return { status: 'error', message: 'You are not enrolled on that programme.', values };
  }

  const errors: Record<string, string> = {};
  if (description.length < 30) {
    errors.description = 'Describe your work in at least 30 characters.';
  } else if (description.length > 2000) {
    errors.description = 'Keep the description under 2000 characters.';
  }
  if (!repoUrl) {
    errors.repoUrl = 'A repository URL is required.';
  } else if (!URL_RE.test(repoUrl)) {
    errors.repoUrl = 'Enter a full URL, e.g. https://github.com/you/project.';
  }
  if (demoUrl && !URL_RE.test(demoUrl)) {
    errors.demoUrl = 'Enter a full URL, or leave this blank.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      errors,
      values,
    };
  }

  await db.projectSubmission.create({
    data: {
      userId: user.id,
      projectId,
      repoUrl,
      demoUrl: demoUrl || null,
      description,
      status: 'PENDING',
    },
  });

  revalidatePath('/learning', 'layout');

  return {
    status: 'success',
    message: 'Submitted for review. You will see the outcome on this page.',
  };
}
