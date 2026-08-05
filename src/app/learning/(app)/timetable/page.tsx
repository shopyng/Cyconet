import { myTimetable } from '@/lib/dal';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  Section,
  formatWhen,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Timetable' };

/**
 * Scheduled sessions for the student's programmes.
 *
 * Split into upcoming and past rather than one long list: the only thing
 * anyone opens a timetable for is "what is next", and a chronological list
 * buries that under everything that already happened. The partition itself
 * lives in the DAL — reading the clock during render would make this
 * component impure.
 */
export default async function TimetablePage() {
  const { upcoming, past, total } = await myTimetable();

  if (total === 0) {
    return (
      <>
        <PageTitle title="Timetable" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="Nothing scheduled"
            body="Workshops, lectures and lab sessions for your programme appear here once staff publish the schedule."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Timetable"
        lede={
          upcoming.length > 0
            ? `${upcoming.length} upcoming ${upcoming.length === 1 ? 'session' : 'sessions'}.`
            : 'No upcoming sessions scheduled.'
        }
      />

      {upcoming.length > 0 ? (
        <Section title="Upcoming">
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
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {past.length > 0 ? (
        <Section title="Past sessions">
          <div style={styles.list}>
            {past.map((entry) => (
              <Card key={entry.id}>
                <div style={styles.head}>
                  <div style={{ minWidth: 0 }}>
                    <span style={styles.eyebrow}>{entry.programTitle}</span>
                    <h3 style={{ ...styles.title, color: color.textMuted }}>{entry.title}</h3>
                  </div>
                  <Badge tone="neutral">{formatWhen(entry.startTime, entry.endTime)}</Badge>
                </div>
                {entry.location ? <p style={styles.meta}>{entry.location}</p> : null}
              </Card>
            ))}
          </div>
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
    color: color.textFaint,
  },
  title: {
    marginTop: '0.15rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.1rem',
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
    marginTop: '0.4rem',
    fontSize: font.small,
    color: color.textFaint,
  },
} satisfies Record<string, React.CSSProperties>;
