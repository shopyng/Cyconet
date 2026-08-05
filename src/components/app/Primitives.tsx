/**
 * Layout and display primitives shared by the learning and admin pages.
 *
 * Server Components with no interactivity, so they add nothing to the client
 * bundle. Anything needing state (forms, toggles) lives in its own 'use client'
 * file instead.
 *
 * Styling follows the house split: geometry in the `styles` object, and the
 * few hover states that exist in styled-jsx, because an inline style can never
 * be overridden by a stylesheet `:hover` rule.
 */

import { color, font, glass, radius } from '@/lib/theme';

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

const TONES: Record<BadgeTone, React.CSSProperties> = {
  neutral: { background: 'rgba(255,255,255,0.06)', color: color.textMuted },
  positive: { background: 'rgba(0,229,255,0.10)', color: color.cyan },
  // #FCD34D rather than a saturated amber: mid-tone yellows fall under 4.5:1
  // on this background and fail AA for the small text a badge uses.
  warning: { background: 'rgba(252,211,77,0.10)', color: '#FCD34D' },
  critical: { background: 'rgba(252,165,165,0.10)', color: '#FCA5A5' },
  accent: { background: 'rgba(129,140,248,0.12)', color: color.violetSoft },
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
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: color.text,
  },
  lede: {
    marginTop: '0.4rem',
    color: color.textMuted,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  backLink: {
    color: color.textMuted,
    fontSize: font.small,
    textDecoration: 'none',
  },
  section: {
    marginTop: '2rem',
  },
  h2: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
  },
  sectionDesc: {
    marginTop: '0.3rem',
    marginBottom: '0.9rem',
    fontSize: font.small,
    color: color.textMuted,
  },
  card: {
    ...glass,
    borderRadius: radius.lg,
  },
  cardPadded: {
    padding: '1.25rem',
  },
  empty: {
    ...glass,
    padding: '2rem 1.5rem',
    borderRadius: radius.lg,
    textAlign: 'center',
  },
  emptyTitle: {
    display: 'block',
    color: color.text,
    fontSize: font.bodyLg,
  },
  emptyBody: {
    maxWidth: 460,
    margin: '0.5rem auto 0',
    color: color.textMuted,
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
    height: 6,
    marginTop: '1rem',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    background: `linear-gradient(90deg, ${color.cyan}, ${color.violetSoft})`,
  },
  pct: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: color.textMuted,
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
    color: color.textFaint,
  },
  detailValue: {
    margin: 0,
    color: color.text,
    fontSize: font.small,
    lineHeight: 1.6,
    overflowWrap: 'anywhere',
  },
} satisfies Record<string, React.CSSProperties>;
