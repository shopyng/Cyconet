import {
  pendingApplications,
  allStudents,
  pendingSubmissions,
  verifyAdmin,
} from '@/lib/dal';
import { db } from '@/lib/db';
import { color, font, glass, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Overview' };

export default async function AdminDashboard() {
  await verifyAdmin();

  const [applications, students, submissions, upcomingClasses] = await Promise.all([
    pendingApplications(),
    allStudents(),
    pendingSubmissions(),
    db.timetableEntry.findMany({
      where: { startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
  ]);

  const enrolled = students.length;
  const withCerts = students.filter((s) => s.certificates.length > 0).length;

  return (
    <div>
      <h1 style={styles.h1}>Admin Overview</h1>
      <p style={styles.lede}>Platform activity at a glance.</p>

      <div style={styles.grid}>
        <Stat label="Pending applications" value={applications.length} href="/admin/applications" />
        <Stat label="Enrolled students" value={enrolled} href="/admin/students" />
        <Stat label="Project submissions" value={submissions.length} href="/admin/submissions" />
        <Stat label="Certificates issued" value={withCerts} href="/admin/certificates" />
      </div>

      {applications.length > 0 ? (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={styles.h2}>Recent applications</h2>
          <ul style={styles.list}>
            {applications.slice(0, 5).map((app) => (
              <li key={app.id} style={styles.item}>
                <a href={`/admin/applications/${app.id}`} style={styles.itemLink}>
                  <strong style={{ color: color.text }}>{app.name}</strong>
                  <span style={{ color: color.textMuted, fontSize: font.small }}>
                    {app.track} · {new Date(app.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {submissions.length > 0 ? (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={styles.h2}>Pending project reviews</h2>
          <ul style={styles.list}>
            {submissions.slice(0, 5).map((sub) => (
              <li key={sub.id} style={styles.item}>
                <a href={`/admin/submissions/${sub.id}`} style={styles.itemLink}>
                  <strong style={{ color: color.text }}>
                    {sub.user.name} · {sub.project.title}
                  </strong>
                  <span style={{ color: color.textMuted, fontSize: font.small }}>
                    {new Date(sub.submittedAt).toLocaleDateString('en-GB')}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {upcomingClasses.length > 0 ? (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={styles.h2}>Upcoming sessions</h2>
          <ul style={styles.list}>
            {upcomingClasses.map((entry) => (
              <li key={entry.id} style={styles.item}>
                <div style={styles.itemLink}>
                  <strong style={{ color: color.text }}>{entry.title}</strong>
                  <span style={{ color: color.textMuted, fontSize: font.small }}>
                    {formatWhen(entry.startTime, entry.endTime)}
                    {entry.location ? ` · ${entry.location}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <a href={href} style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </a>
  );
}

function formatWhen(start: Date, end: Date): string {
  const day = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = (d: Date) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time(start)}–${time(end)}`;
}

const styles = {
  h1: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: color.text,
  },
  lede: {
    marginTop: '0.4rem',
    color: color.textMuted,
  },
  h2: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
    marginBottom: '0.75rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  stat: {
    ...glass,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    padding: '1.25rem',
    borderRadius: radius.md,
    textDecoration: 'none',
    transition: `background 200ms ease-out`,
  },
  statLabel: {
    fontSize: font.small,
    color: color.textFaint,
  },
  statValue: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '2rem',
    fontWeight: 700,
    color: color.cyan,
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
    ...glass,
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
} satisfies Record<string, React.CSSProperties>;
