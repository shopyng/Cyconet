import { allTimetableEntries, programOptions } from '@/lib/dal';
import { createTimetableEntry, deleteTimetableEntry } from '@/lib/admin-actions';
import { TimetableForm, ActionButton } from '@/components/app/ActionForms';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  Section,
  formatWhen,
} from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Timetable' };

/**
 * Schedule management.
 *
 * Entries are split at "now" for the same reason the student view is: the
 * upcoming list is the working set, and past sessions are kept only as a
 * record. The partition lives in the DAL so this component stays pure.
 */
export default async function AdminTimetablePage() {
  const [{ upcoming, past }, programs] = await Promise.all([
    allTimetableEntries(),
    programOptions(),
  ]);

  return (
    <>
      <PageTitle
        title="Timetable"
        lede={
          upcoming.length > 0
            ? `${upcoming.length} upcoming ${upcoming.length === 1 ? 'session' : 'sessions'}.`
            : 'Nothing scheduled ahead.'
        }
      />

      <Section
        title="Add a session"
        description="Students enrolled on the chosen programme see this on their own timetable immediately."
      >
        <Card>
          {programs.length === 0 ? (
            <p style={styles.muted}>
              No programmes exist yet, so there is nothing to schedule against.
            </p>
          ) : (
            <TimetableForm action={createTimetableEntry} programs={programs} />
          )}
        </Card>
      </Section>

      <Section title="Upcoming">
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nothing scheduled"
            body="Sessions you add above appear here and on the timetable of every enrolled student."
          />
        ) : (
          <div style={styles.list}>
            {upcoming.map((entry) => (
              <Card key={entry.id}>
                <div style={styles.head}>
                  <div style={{ minWidth: 0 }}>
                    <span style={styles.eyebrow}>{entry.programTitle}</span>
                    <h3 style={styles.title}>{entry.title}</h3>
                  </div>
                  <Badge tone="accent">{formatWhen(entry.startTime, entry.endTime)}</Badge>
                </div>

                {entry.description ? <p style={styles.desc}>{entry.description}</p> : null}
                {entry.location ? <p style={styles.meta}>{entry.location}</p> : null}

                <div style={{ marginTop: '1rem' }}>
                  <ActionButton
                    action={deleteTimetableEntry}
                    fields={{ id: entry.id }}
                    label="Remove"
                    pendingLabel="Removing…"
                    tone="danger"
                    confirm={`Remove "${entry.title}" from the timetable?`}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {past.length > 0 ? (
        <Section title={`Past (${past.length})`}>
          <Card>
            <ul style={styles.plainList}>
              {past.map((entry) => (
                <li key={entry.id} style={styles.plainItem}>
                  <span style={{ color: 'var(--textMuted)' }}>{entry.title}</span>
                  <span style={styles.faint}>{entry.programTitle}</span>
                  <span style={styles.right}>{formatWhen(entry.startTime, entry.endTime)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}
    </>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  title: {
    marginTop: '0.15rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  desc: {
    marginTop: '0.5rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  meta: {
    marginTop: '0.4rem',
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  muted: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  plainList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  plainItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  faint: {
    color: 'var(--textFaint)',
  },
  right: {
    marginLeft: 'auto',
    color: 'var(--textFaint)',
  },
} satisfies Record<string, React.CSSProperties>;
