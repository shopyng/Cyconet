import { allApplications } from '@/lib/dal';
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
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Applications' };

/**
 * Admissions queue.
 *
 * Pending first and separated out, because that is the only part of this page
 * anyone acts on — decided applications are kept for reference, not review.
 */
export default async function ApplicationsPage() {
  const applications = await allApplications();

  const pending = applications.filter((a) => a.status === 'PENDING');
  const decided = applications.filter((a) => a.status !== 'PENDING');

  if (applications.length === 0) {
    return (
      <>
        <PageTitle title="Applications" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No applications"
            body="Submissions from the public application form land here for review."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Applications"
        lede={
          pending.length > 0
            ? `${pending.length} awaiting a decision.`
            : 'Everything has been reviewed.'
        }
      />

      {pending.length > 0 ? (
        <Section title="Awaiting decision">
          <div style={styles.list}>
            {pending.map((application) => (
              <Row key={application.id} application={application} />
            ))}
          </div>
        </Section>
      ) : null}

      {decided.length > 0 ? (
        <Section title="Decided">
          <div style={styles.list}>
            {decided.map((application) => (
              <Row key={application.id} application={application} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}

function Row({
  application,
}: {
  application: {
    id: string;
    name: string;
    email: string;
    track: string;
    experience: string;
    status: string;
    createdAt: Date;
  };
}) {
  return (
    <Card padded={false}>
      <a href={`/admin/applications/${application.id}`} style={styles.row}>
        <div style={styles.rowMain}>
          <strong style={styles.name}>{application.name}</strong>
          <span style={styles.email}>{application.email}</span>
        </div>
        <div style={styles.rowMeta}>
          <span style={styles.track}>{application.track}</span>
          <span style={styles.date}>{formatDate(application.createdAt)}</span>
          <Badge tone={statusTone(application.status)}>{humanStatus(application.status)}</Badge>
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
  rowMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  name: {
    color: color.text,
  },
  email: {
    fontSize: font.small,
    color: color.textMuted,
    overflowWrap: 'anywhere',
  },
  rowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    flexWrap: 'wrap',
  },
  track: {
    fontSize: font.small,
    color: color.textMuted,
  },
  date: {
    fontSize: font.small,
    color: color.textFaint,
  },
} satisfies Record<string, React.CSSProperties>;
