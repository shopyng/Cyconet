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
  eyebrow,
  children,
}: {
  title: string;
  lede?: string;
  /** Small uppercase kicker above the heading, e.g. the parent section. */
  eyebrow?: string;
  /** Actions aligned to the right of the heading, e.g. a "back" link. */
  children?: React.ReactNode;
}) {
  return (
    <header style={styles.header}>
      <div style={{ minWidth: 0 }}>
        {eyebrow ? <p style={styles.pageEyebrow}>{eyebrow}</p> : null}
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
  actions,
  children,
}: {
  title: string;
  description?: string;
  /** Controls aligned right of the section heading. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div style={{ minWidth: 0 }}>
          <h2 style={styles.h2}>{title}</h2>
          {description ? <p style={styles.sectionDesc}>{description}</p> : null}
        </div>
        {actions ? <div style={styles.headerActions}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Content container.
 *
 * `tone` tints the border and adds a coloured top rule — used to mark a card as
 * carrying a warning or a failure without wrapping it in an Alert as well.
 */
export function Card({
  children,
  padded = true,
  tone,
  title,
  actions,
  /** Adds a hover lift. Only pass this when the whole card is clickable. */
  interactive = false,
}: {
  children: React.ReactNode;
  padded?: boolean;
  tone?: 'accent' | 'positive' | 'warning' | 'critical';
  title?: string;
  actions?: React.ReactNode;
  interactive?: boolean;
}) {
  const toneStyle = tone ? CARD_TONES[tone] : null;
  return (
    <div
      className={interactive ? 'card-interactive' : undefined}
      style={{
        ...styles.card,
        ...toneStyle,
        ...(padded ? styles.cardPadded : null),
      }}
    >
      {title || actions ? (
        <div style={{ ...styles.cardHead, ...(padded ? null : styles.cardHeadInset) }}>
          {title ? <h3 style={styles.cardTitle}>{title}</h3> : <span />}
          {actions ? <div style={styles.headerActions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

const CARD_TONES: Record<string, React.CSSProperties> = {
  accent: { borderColor: 'var(--primary)' },
  positive: { borderColor: 'var(--success)' },
  warning: { borderColor: 'var(--warning)' },
  critical: { borderColor: 'var(--danger)' },
};

/**
 * Inline message about the state of the page or a form.
 *
 * `role` is chosen by tone rather than passed in: a failure must interrupt a
 * screen reader, anything else should wait its turn. Getting that backwards is
 * the common mistake, so the component decides instead of the caller.
 */
export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'critical';
  title?: string;
  children?: React.ReactNode;
}) {
  const skin = ALERT_TONES[tone];
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      aria-live={tone === 'critical' ? 'assertive' : 'polite'}
      style={{ ...styles.alert, ...skin }}
    >
      {title ? <strong style={styles.alertTitle}>{title}</strong> : null}
      {children ? <div style={styles.alertBody}>{children}</div> : null}
    </div>
  );
}

const ALERT_TONES: Record<string, React.CSSProperties> = {
  info: {
    background: 'var(--primarySoft)',
    borderColor: 'var(--primary)',
    color: 'var(--text)',
  },
  success: {
    background: 'var(--successSoft)',
    borderColor: 'var(--success)',
    color: 'var(--text)',
  },
  warning: {
    background: 'var(--warningSoft)',
    borderColor: 'var(--warning)',
    color: 'var(--text)',
  },
  critical: {
    background: 'var(--dangerSoft)',
    borderColor: 'var(--danger)',
    color: 'var(--text)',
  },
};

/** Row of controls above a list or table. Wraps rather than overflowing. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div style={styles.toolbar}>{children}</div>;
}

/**
 * Circular progress indicator.
 *
 * Drawn with two SVG circles and `stroke-dasharray` rather than a conic
 * gradient, because a gradient cannot express a rounded cap and reads as a pie
 * chart at small sizes.
 */
export function ProgressRing({
  done,
  total,
  label,
  size = 132,
}: {
  done: number;
  total: number;
  label: string;
  size?: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const stroke = Math.max(6, Math.round(size * 0.075));
  const radiusPx = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radiusPx;

  return (
    <div style={{ ...styles.ringWrap, width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        /* The arc starts at 12 o'clock rather than 3, which is where people
           expect a progress dial to begin. */
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          fill="none"
          stroke="var(--surfaceHover)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
        />
      </svg>
      <div style={styles.ringLabel}>
        <span style={{ ...styles.ringPct, fontSize: size * 0.24 }}>{pct}%</span>
        <span style={styles.ringCount}>
          {done}/{total}
        </span>
      </div>
    </div>
  );
}

/** Initials bubble. Sized in px so it stays circular whatever the font scale. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0
      ? '?'
      : parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{
        ...styles.avatar,
        width: size,
        height: size,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </span>
  );
}

/**
 * Numbered progress through a fixed sequence.
 *
 * An ordered list, so the sequence survives without the drawn numerals — the
 * same reasoning as the marketing site's admissions timeline.
 */
export function Stepper({
  steps,
  current,
}: {
  steps: readonly string[];
  /** Zero-based index of the active step. */
  current: number;
}) {
  return (
    <ol style={styles.stepper}>
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={step} style={styles.step}>
            <span
              aria-hidden="true"
              style={{ ...styles.stepDot, ...STEP_DOTS[state] }}
            >
              {state === 'done' ? '✓' : index + 1}
            </span>
            <span style={{ ...styles.stepLabel, ...(state === 'todo' ? styles.stepTodo : null) }}>
              {step}
            </span>
            {state === 'current' ? <span style={srOnlyStyle}>(current step)</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

const STEP_DOTS: Record<string, React.CSSProperties> = {
  done: { background: 'var(--success)', color: '#fff', borderColor: 'var(--success)' },
  current: {
    background: 'var(--primary)',
    color: 'var(--onPrimary)',
    borderColor: 'var(--primary)',
  },
  todo: { background: 'transparent', color: 'var(--textFaint)', borderColor: 'var(--border)' },
};

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
};

/** Placeholder block for streamed content. Animation lives in globals.css. */
export function Skeleton({ height = 16, width = '100%' }: { height?: number | string; width?: number | string }) {
  return <span aria-hidden="true" className="skeleton" style={{ height, width }} />;
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

/**
 * Responsive table.
 *
 * Below 720px each row collapses into a stacked card and every cell shows its
 * column name — see `.data-table` in globals.css. That is why `columns` is a
 * prop rather than left to the caller's `<th>`s: the labels have to be
 * available to the cells too, and duplicating them by hand is how they drift.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: readonly {
    key: string;
    label: string;
    /** Cell renderer. Return null for an empty cell. */
    cell: (row: T) => React.ReactNode;
    /** Omits the stacked-view label — use for action columns. */
    unlabelled?: boolean;
  }[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Shown in place of the table when there are no rows. */
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty ?? null}</>;

  return (
    <div style={styles.tableWrap}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.unlabelled ? undefined : column.label}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  pageEyebrow: {
    marginBottom: '0.4rem',
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--primary)',
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
  sectionHead: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '0.9rem',
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
    boxShadow: 'var(--shadowSm)',
  },
  cardPadded: {
    padding: '1.25rem',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '0.9rem',
  },
  cardHeadInset: {
    padding: '1.1rem 1.25rem 0',
    marginBottom: '0.75rem',
  },
  cardTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  alert: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    padding: '0.9rem 1.05rem',
    // A left rule rather than a full border: the tint already reads as a block,
    // and a 1px ring all the way round competes with the cards beside it.
    borderLeft: '3px solid',
    borderRadius: radius.sm,
    fontSize: font.small,
    lineHeight: 1.6,
  },
  alertTitle: {
    fontWeight: 600,
    color: 'inherit',
  },
  alertBody: {
    color: 'var(--textMuted)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  ringWrap: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    flex: 'none',
  },
  ringLabel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.1rem',
  },
  ringPct: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  ringCount: {
    fontSize: font.eyebrow,
    color: 'var(--textFaint)',
  },
  avatar: {
    display: 'grid',
    placeItems: 'center',
    flex: 'none',
    borderRadius: 999,
    background: 'var(--primarySoft)',
    color: 'var(--primary)',
    fontWeight: 700,
    lineHeight: 1,
  },
  stepper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    position: 'relative',
  },
  stepDot: {
    display: 'grid',
    placeItems: 'center',
    width: 26,
    height: 26,
    flex: 'none',
    border: '1px solid',
    borderRadius: 999,
    fontSize: '0.78rem',
    fontWeight: 700,
    lineHeight: 1,
  },
  stepLabel: {
    fontSize: font.small,
    color: 'var(--text)',
  },
  stepTodo: {
    color: 'var(--textFaint)',
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
  tableWrap: {
    /*
     * Clips the header's tinted background to the rounded corner. Without it
     * the grey band squares off the top of the card it sits in.
     */
    overflow: 'hidden',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: radius.md,
    boxShadow: 'var(--shadowSm)',
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
