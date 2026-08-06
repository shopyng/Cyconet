import { allSubmissions } from '@/lib/dal';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  Section,
  statusTone,
  humanStatus,
  formatDate,
} from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Project review' };

/**
 * Project review queue. Pending first — it is the only part that needs action.
 */
export default async function SubmissionsPage() {
  const submissions = await allSubmissions();

  const pending = submissions.filter((s) => s.status === 'PENDING');
  const reviewed = submissions.filter((s) => s.status !== 'PENDING');

  if (submissions.length === 0) {
    return (
      <>
        <PageTitle title="Project review" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="Nothing submitted yet"
            body="When students submit work against a project brief, it queues here for review."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Project review"
        lede={
          pending.length > 0
            ? `${pending.length} awaiting review.`
            : 'Everything has been reviewed.'
        }
      />

      {pending.length > 0 ? (
        <Section title="Awaiting review">
          <div style={styles.list}>
            {pending.map((submission) => (
              <Row key={submission.id} submission={submission} />
            ))}
          </div>
        </Section>
      ) : null}

      {reviewed.length > 0 ? (
        <Section title="Reviewed">
          <div style={styles.list}>
            {reviewed.map((submission) => (
              <Row key={submission.id} submission={submission} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}

function Row({
  submission,
}: {
  submission: {
    id: string;
    status: string;
    submittedAt: Date;
    user: { name: string; email: string };
    project: { title: string };
  };
}) {
  return (
    <Card padded={false}>
      <a href={`/submissions/${submission.id}`} style={styles.row}>
        <div style={styles.main}>
          <strong style={styles.title}>{submission.project.title}</strong>
          <span style={styles.who}>
            {submission.user.name} · {submission.user.email}
          </span>
        </div>
        <div style={styles.meta}>
          <span style={styles.date}>{formatDate(submission.submittedAt)}</span>
          <Badge tone={statusTone(submission.status)}>{humanStatus(submission.status)}</Badge>
        </div>
      </a>
    </Card>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    padding: '1rem 1.15rem',
    color: 'inherit',
    textDecoration: 'none',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  title: {
    color: 'var(--text)',
  },
  who: {
    fontSize: font.small,
    color: 'var(--textMuted)',
    overflowWrap: 'anywhere',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    flexWrap: 'wrap',
  },
  date: {
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
} satisfies Record<string, React.CSSProperties>;
