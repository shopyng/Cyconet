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
 * Grade and record an exam attempt.
 *
 * Grading reads the correct answers here, server-side, and the questions are
 * re-fetched from the database rather than taken from the submission. The
 * client is told which questions exist but never which answers are right, so
 * a forged POST cannot claim a pass it did not earn.
 *
 * Attempts are unlimited by design — the passing score is the bar, not the
 * number of tries. `myBestAttempts` surfaces the highest score.
 */
export async function submitExam(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await verifySession();
  const examId = String(formData.get('examId') ?? '');

  if (!examId) {
    return { status: 'error', message: 'Missing exam.' };
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!exam) {
    return { status: 'error', message: 'That exam does not exist.' };
  }
  if (!(await isEnrolled(exam.programId))) {
    return { status: 'error', message: 'You are not enrolled on that programme.' };
  }
  if (exam.questions.length === 0) {
    return { status: 'error', message: 'This exam has no questions yet.' };
  }

  const answers: Record<string, string> = {};
  const missing: string[] = [];
  for (const question of exam.questions) {
    const answer = String(formData.get(`q_${question.id}`) ?? '');
    if (!answer) missing.push(question.id);
    answers[question.id] = answer;
  }

  if (missing.length > 0) {
    return {
      status: 'error',
      message: `Answer every question before submitting — ${missing.length} left.`,
    };
  }

  const correct = exam.questions.filter((q) => answers[q.id] === q.correct).length;
  const score = Math.round((correct / exam.questions.length) * 100);
  const passed = score >= exam.passingScore;

  await db.examAttempt.create({
    data: { userId: user.id, examId, score, answers, passed },
  });

  revalidatePath('/learning', 'layout');

  return {
    status: passed ? 'success' : 'error',
    message: passed
      ? `Passed with ${score}% (${correct} of ${exam.questions.length} correct).`
      : `Scored ${score}% — ${exam.passingScore}% is needed to pass. You can retake this exam.`,
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
