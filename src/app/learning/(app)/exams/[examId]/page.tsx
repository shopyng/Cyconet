import { notFound } from 'next/navigation';
import { examForStudent, myAttemptsForExam } from '@/lib/dal';
import { submitExam } from '@/lib/learning-actions';
import ExamPaper, { type PaperQuestion } from '@/components/app/ExamPaper';
import { BackLink, Badge, EmptyState, Section, formatDateTime } from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Exam' };

/**
 * `options` is a Json column, so Prisma types it as JsonValue. Normalising here
 * keeps the coercion in one place and hands the paper a plain string[].
 */
function toOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((option) => String(option));
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const exam = await examForStudent(examId);
  if (!exam) notFound();

  const attempts = await myAttemptsForExam(examId);
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const hasPassed = attempts.some((a) => a.passed);

  const questions: PaperQuestion[] = exam.questions.map((question) => ({
    id: question.id,
    question: question.question,
    options: toOptions(question.options),
  }));

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
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} · pass mark{' '}
            {exam.passingScore}%
          </span>
        </div>
      </header>

      {questions.length === 0 ? (
        <div style={{ marginTop: '1.75rem' }}>
          <EmptyState
            title="No questions yet"
            body="This exam has been created but no questions have been added. Your instructor will publish them before the assessment window opens."
          />
        </div>
      ) : (
        <div style={{ marginTop: '1.75rem' }}>
          <ExamPaper
            action={submitExam}
            examId={exam.id}
            questions={questions}
            passingScore={exam.passingScore}
          />
        </div>
      )}

      {attempts.length > 0 ? (
        <Section title="Your attempts">
          <ul style={styles.attempts}>
            {attempts.map((attempt) => (
              <li key={attempt.id} style={styles.attempt}>
                <span style={{ color: color.text }}>{attempt.score}%</span>
                <Badge tone={attempt.passed ? 'positive' : 'critical'}>
                  {attempt.passed ? 'Pass' : 'Fail'}
                </Badge>
                <span style={styles.attemptDate}>{formatDateTime(attempt.attemptedAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
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
    color: color.textFaint,
  },
  h1: {
    marginTop: '0.3rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    color: color.text,
  },
  desc: {
    marginTop: '0.6rem',
    color: color.textMuted,
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
    color: color.textFaint,
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
    padding: '0.6rem 0',
    borderBottom: `1px solid ${color.border}`,
    fontSize: font.small,
  },
  attemptDate: {
    marginLeft: 'auto',
    color: color.textFaint,
  },
} satisfies Record<string, React.CSSProperties>;
