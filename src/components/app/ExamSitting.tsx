'use client';

/**
 * A proctored exam sitting.
 *
 * Three things make this more than a form:
 *
 *   1. A countdown driven from the server's absolute `expiresAt`, not from a
 *      duration counted here. Client clocks drift and can be set; the server
 *      refuses a late submission regardless of what this component believes.
 *   2. Integrity monitoring — leaving the tab, copying, pasting and the context
 *      menu are all reported to the server, which owns the strike count.
 *   3. Answers saved as they change, so a forced submit still grades work the
 *      student actually did.
 *
 * None of this is a security boundary on its own. A determined student can
 * disable JavaScript and defeat every listener here. What cannot be defeated is
 * the server-side deadline, the attempt limit and the frozen question order —
 * this component makes cheating obvious and inconvenient; the server makes the
 * result trustworthy.
 */

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  submitExam,
  recordExamViolation,
  saveExamAnswers,
} from '@/lib/learning-actions';
import { VIOLATION_LIMIT } from '@/lib/exam-rules';
import { IDLE_STATE, type FormState } from '@/lib/form-state';
import { FormStatus } from '@/components/forms/Field';
import { ease, font, radius } from '@/lib/theme';

export type SittingQuestion = {
  id: string;
  question: string;
  /** Already permuted; `value` is the canonical letter the grader expects. */
  options: { value: string; text: string }[];
};

export default function ExamSitting({
  sessionId,
  questions,
  passingScore,
  expiresAt,
  initialViolations,
  savedAnswers,
}: {
  sessionId: string;
  questions: readonly SittingQuestion[];
  passingScore: number;
  /** ISO string — the server's deadline, not a duration. */
  expiresAt: string;
  initialViolations: number;
  savedAnswers: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    submitExam,
    IDLE_STATE,
  );
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [remaining, setRemaining] = useState(() => msLeft(expiresAt));
  const [violations, setViolations] = useState(initialViolations);
  const [locked, setLocked] = useState(false);
  /*
   * Mirrors `submittedRef` as state. The ref is what the callbacks read to
   * avoid double-submitting, but a ref mutation does not re-render — so the
   * disabled state of the paper has to come from state or the inputs would
   * stay live after an auto-submit.
   */
  const [submitting, setSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const autoRef = useRef<HTMLInputElement>(null);
  // Guards against firing submit twice — the timer and a violation can both
  // trip in the same tick. A ref, not state, because the guard must take effect
  // synchronously within one tick rather than after a re-render.
  const submittedRef = useRef(false);

  const forceSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    if (autoRef.current) autoRef.current.value = 'true';
    formRef.current?.requestSubmit();
  }, []);

  /* ---------------- Countdown ---------------- */

  useEffect(() => {
    // Recomputed from the deadline each tick rather than decremented, so a
    // backgrounded tab (where timers are throttled) still shows the truth.
    const id = setInterval(() => {
      const left = msLeft(expiresAt);
      setRemaining(left);
      if (left <= 0) forceSubmit();
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, forceSubmit]);

  /* ---------------- Integrity monitoring ---------------- */

  const report = useCallback(
    async (kind: string) => {
      if (submittedRef.current) return;
      try {
        const result = await recordExamViolation(sessionId, kind);
        setViolations(result.violations);
        if (result.locked) {
          setLocked(true);
          forceSubmit();
        }
      } catch {
        // A failed report must not break the paper — the student would be
        // penalised for our network problem.
      }
    },
    [sessionId, forceSubmit],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') report('tab-hidden');
    };
    const onBlur = () => report('window-blur');
    const block = (event: Event) => {
      event.preventDefault();
      report(event.type);
    };

    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('contextmenu', block);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('contextmenu', block);
    };
  }, [report]);

  /* ---------------- Answer persistence ---------------- */

  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    // Debounced: a student clicking through ten questions should not mean ten
    // round trips.
    const id = setTimeout(() => {
      saveExamAnswers(sessionId, answers).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [answers, sessionId]);

  const answered = Object.values(answers).filter(Boolean).length;
  const settled = state.status === 'success' || locked || submitting;
  const urgent = remaining <= 60_000;

  if (state.status === 'success' || (state.status === 'error' && submitting)) {
    return (
      <div style={styles.result}>
        <FormStatus status={state.status} message={state.message} />
        <Link href="/exams" style={styles.link}>
          ← Back to exams
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} ref={formRef} style={styles.form}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="auto" value="false" ref={autoRef} />

      {/*
        Sticky so the clock and the strike count stay visible however far down
        the paper the student has scrolled.
      */}
      <div className="bar" data-urgent={urgent}>
        <div>
          <span className="bar-label">Time remaining</span>
          <span className="clock">{formatClock(remaining)}</span>
        </div>
        <div className="bar-right">
          <span className="bar-label">
            {answered}/{questions.length} answered
          </span>
          <span className="strikes" data-warn={violations > 0}>
            {violations > 0
              ? `${VIOLATION_LIMIT - violations} warning${
                  VIOLATION_LIMIT - violations === 1 ? '' : 's'
                } left`
              : 'Monitored'}
          </span>
        </div>
      </div>

      <FormStatus status={state.status} message={state.message} />

      {violations > 0 && !locked ? (
        <p role="alert" className="warn">
          Leaving this page, copying or pasting is recorded. After {VIOLATION_LIMIT} such
          events your paper is submitted automatically — {VIOLATION_LIMIT - violations}{' '}
          remaining.
        </p>
      ) : null}

      {locked ? (
        <p role="alert" className="warn">
          This sitting was ended automatically and your answers have been submitted.
        </p>
      ) : null}

      <ol style={styles.list}>
        {questions.map((question, qIndex) => (
          <li key={question.id} style={styles.question}>
            {/*
              A fieldset per question, with the prompt as its legend: screen
              readers then announce the question text when focus enters the
              first radio, rather than reading four bare options.
            */}
            <fieldset style={styles.fieldset} disabled={settled}>
              <legend style={styles.legend}>
                <span style={styles.qNumber}>Question {qIndex + 1}</span>
                <span style={styles.qText}>{question.question}</span>
              </legend>

              <div style={styles.options}>
                {question.options.map((option) => {
                  const id = `${question.id}_${option.value}`;
                  return (
                    <label key={id} htmlFor={id} className="opt">
                      <input
                        id={id}
                        type="radio"
                        name={`q_${question.id}`}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option.value }))
                        }
                      />
                      <span className="opt-letter" aria-hidden="true">
                        {option.value}
                      </span>
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div style={styles.footer}>
        <button type="submit" className="submit" disabled={pending || settled}>
          {pending ? 'Marking…' : 'Submit answers'}
        </button>
        <p style={styles.footNote}>
          {passingScore}% is needed to pass. Every question must be answered before you can
          submit; if the clock runs out, whatever you have answered is marked.
        </p>
      </div>

      <style jsx>{`
        .bar {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 0.8rem 1.1rem;
          border: 1px solid var(--border);
          border-radius: ${radius.md}px;
          background: var(--bgSoft);
          box-shadow: var(--shadowMd);
        }

        .bar[data-urgent='true'] {
          border-color: var(--danger);
          background: var(--dangerSoft);
        }

        .bar-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--textFaint);
        }

        .bar-right {
          text-align: right;
        }

        .clock {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 1.5rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
          color: var(--text);
        }

        .bar[data-urgent='true'] .clock {
          color: var(--danger);
        }

        .strikes {
          font-size: 0.85rem;
          color: var(--textMuted);
        }

        .strikes[data-warn='true'] {
          color: var(--danger);
          font-weight: 600;
        }

        .warn {
          padding: 0.85rem 1rem;
          border-left: 3px solid var(--danger);
          border-radius: ${radius.sm}px;
          background: var(--dangerSoft);
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--text);
        }

        .opt {
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
          padding: 0.75rem 0.9rem;
          border: 1px solid var(--border);
          border-radius: ${radius.md}px;
          background: var(--surface);
          color: var(--textMuted);
          font-size: 0.94rem;
          line-height: 1.5;
          cursor: pointer;
          /* Selecting option text is the first step to pasting it into a
             search engine, so the paper is not selectable. */
          user-select: none;
          transition:
            border-color 180ms ${ease.out},
            background 180ms ${ease.out},
            color 180ms ${ease.out};
        }

        .opt:hover {
          border-color: var(--borderStrong);
          background: var(--surfaceHover);
          color: var(--text);
        }

        /* :has() lets the whole row respond to its radio — no JS state needed. */
        .opt:has(input:checked) {
          border-color: var(--primary);
          background: var(--primarySoft);
          color: var(--text);
        }

        .opt:has(input:focus-visible) {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        fieldset:disabled .opt {
          opacity: 0.6;
          cursor: default;
        }

        .opt input {
          margin: 0.2rem 0 0;
          accent-color: var(--primary);
        }

        .opt-letter {
          flex: none;
          min-width: 1.1rem;
          color: var(--textFaint);
          font-weight: 600;
        }

        .opt:has(input:checked) .opt-letter {
          color: var(--primary);
        }

        .submit {
          padding: 0.75rem 1.4rem;
          border: 1px solid var(--primary);
          border-radius: ${radius.md}px;
          background: var(--primary);
          color: var(--onPrimary);
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 200ms ${ease.out},
            border-color 200ms ${ease.out};
        }

        .submit:hover:not(:disabled) {
          background: var(--primaryHover);
          border-color: var(--primaryHover);
        }

        .submit:disabled {
          opacity: 0.55;
          cursor: progress;
        }
      `}</style>
    </form>
  );
}

function msLeft(expiresAt: string): number {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxWidth: 720,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  question: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '1.25rem',
    borderRadius: radius.md,
  },
  fieldset: {
    border: 0,
    margin: 0,
    padding: 0,
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    marginBottom: '0.9rem',
    padding: 0,
  },
  qNumber: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  qText: {
    color: 'var(--text)',
    fontSize: font.bodyLg,
    lineHeight: 1.5,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    alignItems: 'flex-start',
  },
  footNote: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textFaint)',
  },
  result: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'flex-start',
    maxWidth: 720,
  },
  link: {
    color: 'var(--primary)',
    fontSize: font.small,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
