/**
 * Layout and display primitives shared by the learning and admin pages.
 *
 * Server Components with no interactivity, so they add nothing to the client
 * bundle. Anything needing state (forms, toggles) lives in its own 'use client'
 * file instead.
 *
 * Colours are CSS custom properties, set per-request by the tenant layout from
 * the user's theme cookie — so one set of components serves both light and dark
 * rather than two parallel style objects that can drift apart.
 */

import { font, radius } from '@/lib/theme';

/* ------------------------------------------------------------------ *
 * Page furniture
 * ------------------------------------------------------------------ */

export function PageTitle({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  /** Actions aligned to the right of the heading, e.g. a "back" link. */
  children?: React.ReactNode;
}) {
  return (
    <header style={styles.header}>
      <div style={{ minWidth: 0 }}>
        <h1 style={styles.h1}>{title}</h1>
        {lede ? <p style={styles.lede}>{lede}</p> : null}
      </div>
      {children ? <div style={styles.headerActions}>{children}</div> : null}
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={styles.backLink}>
      ← {label}
    </a>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {description ? <p style={styles.sectionDesc}>{description}</p> : null}
      {children}
    </section>
  );
}

export function Card({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div style={{ ...styles.card, ...(padded ? styles.cardPadded : null) }}>{children}</div>
  );
}

/**
 * Empty state.
 *
 * Every list page has one. They say what will appear here and what causes it
 * to appear, because "No results" alone leaves someone unsure whether the page
 * is broken or simply waiting.
 */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div style={styles.empty}>
      <strong style={styles.emptyTitle}>{title}</strong>
      <p style={styles.emptyBody}>{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Status display
 * ------------------------------------------------------------------ */

export type BadgeTone = 'neutral' | 'positive' | 'warning' | 'critical' | 'accent';

/**
 * Badge skins. Each pairs a tinted background with its own foreground from the
 * theme, so the same tone stays legible whether the surface behind it is white
 * or near-black.
 */
const TONES: Record<BadgeTone, React.CSSProperties> = {
  neutral: { background: 'var(--surfaceHover)', color: 'var(--textMuted)' },
  positive: { background: 'var(--successSoft)', color: 'var(--success)' },
  warning: { background: 'var(--warningSoft)', color: 'var(--warning)' },
  critical: { background: 'var(--dangerSoft)', color: 'var(--danger)' },
  accent: { background: 'var(--primarySoft)', color: 'var(--primary)' },
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return <span style={{ ...styles.badge, ...TONES[tone] }}>{children}</span>;
}

/** Maps the three submission states and three application states onto tones. */
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'APPROVED':
    case 'ACCEPTED':
      return 'positive';
    case 'NEEDS_REVISION':
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'critical';
    default:
      return 'neutral';
  }
}

/** "NEEDS_REVISION" → "Needs revision". */
export function humanStatus(status: string): string {
  const lower = status.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function ProgressBar({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <>
      <div
        style={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div style={{ ...styles.fill, width: `${pct}%` }} />
      </div>
      <p style={styles.pct}>
        {done} of {total} · {pct}%
      </p>
    </>
  );
}

/** Label/value pair used across the detail screens. */
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.detailRow}>
      <dt style={styles.detailLabel}>{label}</dt>
      <dd style={styles.detailValue}>{children}</dd>
    </div>
  );
}

export function DetailList({ children }: { children: React.ReactNode }) {
  return <dl style={styles.detailList}>{children}</dl>;
}

/* ------------------------------------------------------------------ *
 * Dashboard stats
 * ------------------------------------------------------------------ */

/** Responsive row of stat tiles — wraps rather than scrolling on narrow screens. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div style={styles.statGrid}>{children}</div>;
}

/**
 * A single headline number.
 *
 * Renders as a link when `href` is given, so the tile itself is the target
 * rather than a separate "view" affordance next to it. The label comes before
 * the value in the DOM so a screen reader hears what the number means first.
 */
export function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: React.ReactNode;
  /** Optional context under the number, e.g. "3 awaiting review". */
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
      {hint ? <span style={styles.statHint}>{hint}</span> : null}
    </>
  );

  return href ? (
    /*
     * `stat-tile-link` carries the hover skin from globals.css rather than
     * styled-jsx: this is a Server Component, and styled-jsx needs a client
     * boundary. An inline style could not express `:hover` either way.
     */
    <a href={href} style={styles.statTile} className="stat-tile-link">
      {body}
    </a>
  ) : (
    <div style={styles.statTile}>{body}</div>
  );
}

/* ------------------------------------------------------------------ *
 * Dates
 * ------------------------------------------------------------------ */

/**
 * en-GB throughout: the school is in Nigeria, where day-month-year is the
 * convention. Left explicit rather than relying on the server's locale, which
 * would render US-style dates on most hosts.
 */
export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: Date | string): string {
  const date = new Date(value);
  return `${formatDate(date)}, ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** "Thu 7 Aug, 09:00–12:00" — the timetable's compact range form. */
export function formatWhen(start: Date | string, end: Date | string): string {
  const from = new Date(start);
  const to = new Date(end);
  const day = from.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time(from)}–${time(to)}`;
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  backLink: {
    color: 'var(--textMuted)',
    fontSize: font.small,
    textDecoration: 'none',
  },
  section: {
    marginTop: '2rem',
  },
  h2: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  sectionDesc: {
    marginTop: '0.3rem',
    marginBottom: '0.9rem',
    fontSize: font.small,
    color: 'var(--textMuted)',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: radius.md,
  },
  cardPadded: {
    padding: '1.25rem',
  },
  empty: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '2.5rem 1.5rem',
    borderRadius: radius.md,
    textAlign: 'center',
  },
  emptyTitle: {
    display: 'block',
    color: 'var(--text)',
    fontSize: font.bodyLg,
    fontWeight: 600,
  },
  emptyBody: {
    maxWidth: 460,
    margin: '0.5rem auto 0',
    color: 'var(--textMuted)',
    fontSize: font.small,
    lineHeight: 1.6,
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: radius.pill,
    fontSize: font.eyebrow,
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  track: {
    height: 8,
    marginTop: '1rem',
    borderRadius: 999,
    background: 'var(--surfaceHover)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    background: 'var(--primary)',
  },
  pct: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: 'var(--textMuted)',
  },
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    margin: 0,
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  detailLabel: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  detailValue: {
    margin: 0,
    color: 'var(--text)',
    fontSize: font.small,
    lineHeight: 1.6,
    overflowWrap: 'anywhere',
  },
  statGrid: {
    display: 'grid',
    gap: '0.85rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  },
  statTile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    padding: '1.1rem 1.15rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: radius.md,
    textDecoration: 'none',
  },
  statLabel: {
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  statValue: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.9rem',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  statHint: {
    fontSize: font.small,
    color: 'var(--textMuted)',
  },
} satisfies Record<string, React.CSSProperties>;
