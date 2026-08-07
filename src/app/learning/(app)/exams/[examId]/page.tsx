import { notFound } from 'next/navigation';
import { examForStudent, myAttemptsForExam, myActiveExamSession } from '@/lib/dal';
import { startExamSession } from '@/lib/learning-actions';
import { VIOLATION_LIMIT } from '@/lib/exam-rules';
import ExamSitting, { type SittingQuestion } from '@/components/app/ExamSitting';
import { ActionButton } from '@/components/app/ActionForms';
import {
  BackLink,
  Badge,
  Card,
  Alert,
  EmptyState,
  Section,
  formatDateTime,
} from '@/components/app/Primitives';
import { font, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Exam' };

/**
 * Exam briefing, or the sitting itself.
 *
 * The paper is no longer rendered straight onto the page. A sitting has to be
 * started explicitly, because starting it is what fixes the deadline and freezes
 * the question order server-side — rendering the questions before that point
 * would mean a student could read the paper without the clock running.
 */
export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const exam = await examForStudent(examId);
  if (!exam) notFound();

  const [attempts, session] = await Promise.all([
    myAttemptsForExam(examId),
    myActiveExamSession(examId),
  ]);

  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const hasPassed = attempts.some((a) => a.passed);
  const attemptsLeft =
    exam.maxAttempts > 0 ? Math.max(0, exam.maxAttempts - attempts.length) : null;

  return (
    <div style={{ maxWidth: 760 }}>
      <BackLink href="/exams" label="All exams" />

      <header style={styles.header}>
        <span style={styles.eyebrow}>{exam.program.title}</span>
        <h1 style={styles.h1}>{exam.title}</h1>
        <p style={styles.desc}>{exam.description}</p>

        <div style={styles.meta}>
          {hasPassed ? (
            <Badge tone="positive">Passed</Badge>
          ) : bestScore !== null ? (
            <Badge tone="warning">Best {bestScore}%</Badge>
          ) : (
            <Badge tone="neutral">Not attempted</Badge>
          )}
          <span style={styles.metaText}>
            {exam.questions.length}{' '}
            {exam.questions.length === 1 ? 'question' : 'questions'} · {exam.durationMinutes}{' '}
            minutes · pass mark {exam.passingScore}%
          </span>
        </div>
      </header>

      {exam.questions.length === 0 ? (
        <div style={{ marginTop: '1.75rem' }}>
          <EmptyState
            title="No questions yet"
            body="This exam has been created but no questions have been added. Your instructor will publish them before the assessment window opens."
          />
        </div>
      ) : session ? (
        /* A sitting is open — render the paper and let the clock run. */
        <div style={{ marginTop: '1.75rem' }}>
          <ExamSitting
            sessionId={session.id}
            questions={session.questions as SittingQuestion[]}
            passingScore={exam.passingScore}
            expiresAt={session.expiresAt.toISOString()}
            initialViolations={session.violations}
            savedAnswers={session.savedAnswers}
          />
        </div>
      ) : (
        <div style={{ marginTop: '1.75rem' }}>
          <Card title="Before you start">
            <ul style={styles.rules}>
              <Rule>
                You have <strong>{exam.durationMinutes} minutes</strong> from the moment you
                start. The clock runs on our server, so closing the tab does not pause it.
              </Rule>
              <Rule>
                The paper submits itself when the time runs out. Whatever you have answered by
                then is marked.
              </Rule>
              <Rule>
                Questions and answer options are shuffled, so no two sittings are laid out the
                same way.
              </Rule>
              <Rule>
                Leaving the tab, copying and pasting are recorded. After{' '}
                <strong>{VIOLATION_LIMIT} such events</strong> your paper is submitted
                automatically.
              </Rule>
              <Rule>
                {exam.maxAttempts > 0
                  ? `You get ${exam.maxAttempts} attempts at this exam in total.`
                  : 'You may retake this exam as many times as you need.'}
              </Rule>
            </ul>

            <div style={styles.startRow}>
              {attemptsLeft === 0 && !hasPassed ? (
                <Alert tone="critical" title="No attempts remaining">
                  You have used all {exam.maxAttempts} attempts. Speak to your instructor if you
                  need another.
                </Alert>
              ) : hasPassed ? (
                <Alert tone="success" title="You have already passed this exam">
                  Your best score was {bestScore}%. There is nothing further to do here.
                </Alert>
              ) : (
                <>
                  <ActionButton
                    action={startExamSession}
                    fields={{ examId: exam.id }}
                    label="Start exam"
                    pendingLabel="Starting…"
                    tone="primary"
                  />
                  <p style={styles.startNote}>
                    {attemptsLeft === null
                      ? 'The timer starts as soon as you press this.'
                      : `The timer starts as soon as you press this. ${attemptsLeft} attempt${
                          attemptsLeft === 1 ? '' : 's'
                        } remaining.`}
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {attempts.length > 0 ? (
        <Section title="Your attempts">
          <ul style={styles.attempts}>
            {attempts.map((attempt) => (
              <li key={attempt.id} style={styles.attempt}>
                <span style={{ color: 'var(--text)' }}>{attempt.score}%</span>
                <Badge tone={attempt.passed ? 'positive' : 'critical'}>
                  {attempt.passed ? 'Pass' : 'Fail'}
                </Badge>
                {attempt.autoSubmitted ? (
                  <Badge tone="warning">Auto-submitted</Badge>
                ) : null}
                {attempt.violations > 0 ? (
                  <span style={styles.violations}>
                    {attempt.violations} flag{attempt.violations === 1 ? '' : 's'}
                  </span>
                ) : null}
                <span style={styles.attemptDate}>{formatDateTime(attempt.attemptedAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li style={styles.rule}>
      <span aria-hidden="true" style={styles.ruleDot} />
      <span>{children}</span>
    </li>
  );
}

const styles = {
  header: {
    marginTop: '1rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  h1: {
    marginTop: '0.3rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    color: 'var(--text)',
  },
  desc: {
    marginTop: '0.6rem',
    color: 'var(--textMuted)',
    lineHeight: 1.6,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.9rem',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  rules: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  rule: {
    display: 'flex',
    gap: '0.7rem',
    fontSize: font.small,
    lineHeight: 1.65,
    color: 'var(--textMuted)',
  },
  ruleDot: {
    flex: 'none',
    width: 6,
    height: 6,
    marginTop: '0.5rem',
    borderRadius: 999,
    background: 'var(--primary)',
  },
  startRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
    alignItems: 'flex-start',
    marginTop: '1.5rem',
    paddingTop: '1.35rem',
    borderTop: '1px solid var(--border)',
  },
  startNote: {
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  attempts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  attempt: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    padding: '0.6rem 0',
    borderBottom: '1px solid var(--border)',
    fontSize: font.small,
  },
  violations: {
    padding: '0.1rem 0.5rem',
    borderRadius: radius.pill,
    background: 'var(--dangerSoft)',
    color: 'var(--danger)',
    fontSize: font.eyebrow,
    fontWeight: 600,
  },
  attemptDate: {
    marginLeft: 'auto',
    color: 'var(--textFaint)',
  },
} satisfies Record<string, React.CSSProperties>;
