import { myExams, myBestAttempts } from '@/lib/dal';
import { PageTitle, Card, EmptyState, Badge } from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Exams' };

/**
 * Exam index across every enrolled programme.
 *
 * Shows the best attempt rather than the most recent: retakes are unlimited,
 * and the highest score is what counts towards the certificate.
 */
export default async function ExamsPage() {
  const [exams, best] = await Promise.all([myExams(), myBestAttempts()]);

  if (exams.length === 0) {
    return (
      <>
        <PageTitle title="Exams" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No exams yet"
            body="Assessments appear here once your instructor publishes them for a programme you are enrolled on."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Exams"
        lede="Retakes are unlimited — your best score is the one that counts."
      />

      <div style={styles.list}>
        {exams.map((exam) => {
          const attempt = best.get(exam.id);

          return (
            <Card key={exam.id}>
              <div style={styles.head}>
                <div style={{ minWidth: 0 }}>
                  <span style={styles.eyebrow}>{exam.program.title}</span>
                  <h2 style={styles.title}>{exam.title}</h2>
                </div>
                {attempt ? (
                  <Badge tone={attempt.passed ? 'positive' : 'warning'}>
                    {attempt.passed ? `Passed · ${attempt.score}%` : `Best ${attempt.score}%`}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Not attempted</Badge>
                )}
              </div>

              <p style={styles.desc}>{exam.description}</p>

              <p style={styles.meta}>
                {exam.questions.length}{' '}
                {exam.questions.length === 1 ? 'question' : 'questions'} · pass mark{' '}
                {exam.passingScore}%
              </p>

              {exam.questions.length === 0 ? (
                <p style={styles.blocked}>This exam has no questions yet.</p>
              ) : (
                <a href={`/exams/${exam.id}`} style={styles.link}>
                  {attempt ? (attempt.passed ? 'Retake exam' : 'Try again') : 'Start exam'} →
                </a>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '1.75rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
  },
  title: {
    marginTop: '0.15rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
  },
  desc: {
    marginTop: '0.5rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: color.textMuted,
  },
  meta: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: color.textFaint,
  },
  blocked: {
    marginTop: '1rem',
    fontSize: font.small,
    color: color.textFaint,
  },
  link: {
    display: 'inline-block',
    marginTop: '1.1rem',
    color: color.cyan,
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
