/**
 * Exam integrity rules shared by the server actions and the paper UI.
 *
 * Separate from learning-actions.ts because that file is `'use server'`, where
 * every export must be an async function — a plain constant there is a build
 * error. Separate from theme/config because these are behavioural limits the
 * client genuinely needs to know to render honest warnings.
 */

/**
 * Integrity events tolerated before a sitting is ended for the student.
 *
 * Three rather than one: a stray notification, an accidental alt-tab or a
 * misfired keyboard shortcut should not void a paper. Three deliberate
 * departures is a pattern.
 */
export const VIOLATION_LIMIT = 3;

/**
 * How long past the deadline a submission is still accepted, in milliseconds.
 *
 * The client auto-submits at zero, but that request still has to travel.
 * Without slack, a student on a slow connection would be timed out by their own
 * network rather than by the clock.
 */
export const SUBMIT_GRACE_MS = 30_000;
