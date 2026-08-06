import {
  pendingApplications,
  allStudents,
  pendingSubmissions,
  certificateCandidates,
  verifyAdmin,
} from '@/lib/dal';
import { db } from '@/lib/db';
import { StatGrid, StatTile, formatWhen, formatDate } from '@/components/app/Primitives';
import { font, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Overview' };

export default async function AdminDashboard() {
  await verifyAdmin();

  const [applications, students, submissions, candidates, upcomingClasses] =
    await Promise.all([
      pendingApplications(),
      allStudents(),
      pendingSubmissions(),
      certificateCandidates(),
      db.timetableEntry.findMany({
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
    ]);

  const withCerts = students.filter((s) => s.certificates.length > 0).length;

  return (
    <div>
      <h1 style={styles.h1}>Overview</h1>
      <p style={styles.lede}>Platform activity at a glance.</p>

      <div style={styles.stats}>
        <StatGrid>
          <StatTile
            label="Applications"
            value={applications.length}
            hint={applications.length ? 'Awaiting a decision' : 'Nothing to review'}
            href="/applications"
          />
          <StatTile
            label="Students"
            value={students.length}
            hint={`${withCerts} certified`}
            href="/students"
          />
          <StatTile
            label="Project reviews"
            value={submissions.length}
            hint={submissions.length ? 'Awaiting grading' : 'Queue is clear'}
            href="/submissions"
          />
          <StatTile
            label="Ready to certify"
            value={candidates.length}
            hint={candidates.length ? 'Met every requirement' : 'None ready yet'}
            href="/certificates"
          />
        </StatGrid>
      </div>

      {applications.length > 0 ? (
        <Queue
          title="Recent applications"
          href="/applications"
          more={applications.length - 5}
          items={applications.slice(0, 5).map((app) => ({
            id: app.id,
            href: `/applications/${app.id}`,
            title: app.name,
            meta: `${app.track} · ${formatDate(app.createdAt)}`,
          }))}
        />
      ) : null}

      {submissions.length > 0 ? (
        <Queue
          title="Pending project reviews"
          href="/submissions"
          more={submissions.length - 5}
          items={submissions.slice(0, 5).map((sub) => ({
            id: sub.id,
            href: `/submissions/${sub.id}`,
            title: `${sub.user.name} · ${sub.project.title}`,
            meta: formatDate(sub.submittedAt),
          }))}
        />
      ) : null}

      {upcomingClasses.length > 0 ? (
        <Queue
          title="Upcoming sessions"
          href="/timetable"
          items={upcomingClasses.map((entry) => ({
            id: entry.id,
            title: entry.title,
            meta:
              formatWhen(entry.startTime, entry.endTime) +
              (entry.location ? ` · ${entry.location}` : ''),
          }))}
        />
      ) : null}
    </div>
  );
}

type QueueItem = {
  id: string;
  title: string;
  meta: string;
  /** Omitted for read-only rows such as timetable entries. */
  href?: string;
};

/**
 * A short list of things needing attention, with a link through to the full
 * screen. Capped at five rows here — the count in the stat tile above already
 * says how many there are in total.
 */
function Queue({
  title,
  href,
  items,
  more = 0,
}: {
  title: string;
  href: string;
  items: readonly QueueItem[];
  /** How many rows were cut; rendered as a "view all" affordance when positive. */
  more?: number;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <h2 style={styles.h2}>{title}</h2>
        <a href={href} style={styles.viewAll}>
          View all →
        </a>
      </div>

      <ul style={styles.list}>
        {items.map((item) => {
          const body = (
            <>
              <strong style={styles.itemTitle}>{item.title}</strong>
              <span style={styles.itemMeta}>{item.meta}</span>
            </>
          );

          return (
            <li key={item.id} style={styles.item}>
              {item.href ? (
                <a href={item.href} style={styles.itemLink} className="stat-tile-link">
                  {body}
                </a>
              ) : (
                <div style={styles.itemLink}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {more > 0 ? (
        <p style={styles.more}>
          and {more} more — <a href={href} style={styles.moreLink}>see the full list</a>
        </p>
      ) : null}
    </section>
  );
}

const styles = {
  h1: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: 'clamp(1.5rem, 1.3rem + 0.9vw, 2rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  lede: {
    marginTop: '0.4rem',
    color: 'var(--textMuted)',
  },
  stats: {
    marginTop: '1.75rem',
  },
  section: {
    marginTop: '2rem',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.75rem',
  },
  h2: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  viewAll: {
    flex: 'none',
    fontSize: font.small,
    fontWeight: 600,
    color: 'var(--primary)',
    textDecoration: 'none',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: radius.sm,
  },
  itemLink: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    padding: '0.85rem 1rem',
    color: 'inherit',
    textDecoration: 'none',
  },
  itemTitle: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  itemMeta: {
    color: 'var(--textMuted)',
    fontSize: font.small,
  },
  more: {
    marginTop: '0.6rem',
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  moreLink: {
    color: 'var(--primary)',
    fontWeight: 600,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
