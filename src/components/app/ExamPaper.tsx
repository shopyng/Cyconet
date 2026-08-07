'use client';

/**
 * Exam paper.
 *
 * Options arrive as A/B/C/D letters because that is what `ExamQuestion.correct`
 * stores — the grader compares letters, not option text, so reordering an
 * exam's wording never invalidates past attempts.
 *
 * There is no client-side scoring and no answer key in the payload: the server
 * re-reads the questions and grades them. This component only collects input.
 */

import Link from 'next/link';
import { useActionState } from 'react';
import { IDLE_STATE, type FormState } from '@/lib/form-state';
import { FormStatus } from '@/components/forms/Field';
import { ease, font, radius } from '@/lib/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export type PaperQuestion = {
  id: string;
  question: string;
  /** Prisma Json column — normalised to a string[] by the page before it gets here. */
  options: string[];
};

export default function ExamPaper({
  action,
  examId,
  questions,
  passingScore,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  examId: string;
  questions: readonly PaperQuestion[];
  passingScore: number;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  // A pass ends the paper; a fail leaves it up so the student can adjust and
  // resubmit without losing what they already selected.
  const passed = state.status === 'success';

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="examId" value={examId} />

      <FormStatus status={state.status} message={state.message} />

      {passed ? (
        <div style={styles.afterPass}>
          <Link href="/learning/exams" style={styles.link}>
            ← Back to exams
          </Link>
        </div>
      ) : (
        <>
          <ol style={styles.list}>
            {questions.map((question, qIndex) => (
              <li key={question.id} style={styles.question}>
                {/*
                  A fieldset per question, with the prompt as its legend: screen
                  readers then announce the question text when focus enters the
                  first radio, rather than reading four bare options.
                */}
                <fieldset style={styles.fieldset}>
                  <legend style={styles.legend}>
                    <span style={styles.qNumber}>Question {qIndex + 1}</span>
                    <span style={styles.qText}>{question.question}</span>
                  </legend>

                  <div style={styles.options}>
                    {question.options.map((option, oIndex) => {
                      const letter = LETTERS[oIndex] ?? String(oIndex + 1);
                      const id = `${question.id}_${letter}`;
                      return (
                        <label key={id} htmlFor={id} className="opt">
                          <input
                            id={id}
                            type="radio"
                            name={`q_${question.id}`}
                            value={letter}
                            required
                          />
                          <span className="opt-letter" aria-hidden="true">
                            {letter}
                          </span>
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>

          <div style={styles.footer}>
            <button type="submit" className="submit" disabled={pending}>
              {pending ? 'Marking…' : 'Submit answers'}
            </button>
            <p style={styles.footNote}>
              {passingScore}% is needed to pass. You can retake this exam as many times as
              you need.
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        .opt {
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
          padding: 0.75rem 0.9rem;
          border: 1px solid var(--border);
          border-radius: ${radius.md}px;
          background: var(--surface);
          color: ${'var(--textMuted)'};
          font-size: 0.94rem;
          line-height: 1.5;
          cursor: pointer;
          transition:
            border-color 180ms ${ease.out},
            background 180ms ${ease.out},
            color 180ms ${ease.out};
        }

        .opt:hover {
          border-color: var(--borderStrong);
          background: var(--surfaceHover);
          color: ${'var(--text)'};
        }

        /* :has() lets the whole row respond to its radio — no JS state needed. */
        .opt:has(input:checked) {
          border-color: var(--primary);
          background: var(--primarySoft);
          color: ${'var(--text)'};
        }

        .opt:has(input:focus-visible) {
          outline: 2px solid ${'var(--primary)'};
          outline-offset: 2px;
        }

        .opt input {
          margin: 0.2rem 0 0;
          accent-color: ${'var(--primary)'};
        }

        .opt-letter {
          flex: none;
          min-width: 1.1rem;
          color: ${'var(--textFaint)'};
          font-weight: 600;
        }

        .opt:has(input:checked) .opt-letter {
          color: ${'var(--primary)'};
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
    color: 'var(--textFaint)',
  },
  afterPass: {
    marginTop: '0.5rem',
  },
  link: {
    color: 'var(--primary)',
    fontSize: font.small,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
