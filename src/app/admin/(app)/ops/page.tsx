import { opsOverview } from '@/lib/dal';
import {
  Badge,
  Card,
  PageTitle,
  Section,
  StatGrid,
  StatTile,
  formatDateTime,
} from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Operations' };

export default async function OpsPage() {
  const { auditLogs, notifications, metrics, checks } = await opsOverview();
  const checkEntries = Object.entries(checks);

  return (
    <>
      <PageTitle
        title="Operations"
        lede="System health, production readiness, notifications and audit trail."
      />

      <div style={{ marginTop: '1.75rem' }}>
        <StatGrid>
          <StatTile label="Users" value={metrics.users} />
          <StatTile label="Applications" value={metrics.applications} />
          <StatTile label="Enrollments" value={metrics.enrollments} />
          <StatTile label="Certificates" value={metrics.certificates} />
          <StatTile label="Pending reviews" value={metrics.pendingReviews} />
          <StatTile label="Programmes" value={metrics.programmes} />
        </StatGrid>
      </div>

      <Section title="Deployment health" description="Backups are marked healthy by setting BACKUPS_VERIFIED_AT after confirming Supabase backups.">
        <Card>
          <ul style={styles.checks}>
            {checkEntries.map(([name, ok]) => (
              <li key={name} style={styles.check}>
                <span style={styles.checkName}>{label(name)}</span>
                <Badge tone={ok ? 'positive' : 'warning'}>{ok ? 'Ready' : 'Needs setup'}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Notifications">
        <Card>
          {notifications.length === 0 ? (
            <p style={styles.muted}>No notifications have been created yet.</p>
          ) : (
            <ul style={styles.list}>
              {notifications.map((notification) => (
                <li key={notification.id} style={styles.item}>
                  <strong style={styles.title}>{notification.title}</strong>
                  <span style={styles.meta}>
                    {notification.user.name} · {notification.user.email} ·{' '}
                    {formatDateTime(notification.createdAt)}
                  </span>
                  <p style={styles.body}>{notification.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>

      <Section title="Audit log">
        <Card>
          {auditLogs.length === 0 ? (
            <p style={styles.muted}>No audit events have been recorded yet.</p>
          ) : (
            <ul style={styles.list}>
              {auditLogs.map((entry) => (
                <li key={entry.id} style={styles.item}>
                  <strong style={styles.title}>{entry.action}</strong>
                  <span style={styles.meta}>
                    {entry.entity}
                    {entry.entityId ? ` · ${entry.entityId}` : ''} ·{' '}
                    {entry.actor?.email ?? 'system'} · {formatDateTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>
    </>
  );
}

function label(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

const styles = {
  checks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    gap: '0.75rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  check: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.75rem',
    border: '1px solid var(--border)',
    borderRadius: 8,
  },
  checkName: {
    color: 'var(--text)',
    fontSize: font.small,
    fontWeight: 600,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  item: {
    paddingBottom: '0.9rem',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    color: 'var(--text)',
    fontSize: font.small,
  },
  meta: {
    display: 'block',
    marginTop: '0.2rem',
    color: 'var(--textFaint)',
    fontSize: font.small,
    overflowWrap: 'anywhere',
  },
  body: {
    marginTop: '0.45rem',
    color: 'var(--textMuted)',
    fontSize: font.small,
    lineHeight: 1.6,
  },
  muted: {
    color: 'var(--textMuted)',
    fontSize: font.small,
  },
} satisfies Record<string, React.CSSProperties>;
