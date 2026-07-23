/**
 * Section wrapper providing the vertical rhythm and heading hierarchy every
 * section shares — the thing that makes the page read as designed rather than
 * assembled.
 *
 * No hooks and no styled-jsx, so this stays a Server Component and only the
 * interactive children it wraps ship JavaScript.
 */

import { color, container, font, gradient, layout, radius } from '@/lib/theme';

type SectionShellProps = {
  /** Doubles as the anchor target for the navbar. */
  id: string;
  /** Small mono label above the heading, e.g. "Programs". */
  eyebrow: string;
  /** Plain part of the heading. */
  heading: string;
  /** Optional trailing phrase rendered in the brand gradient. */
  headingAccent?: string;
  lead?: string;
  children: React.ReactNode;
  /** Centres the heading block — used on the wider, more editorial sections. */
  align?: 'left' | 'center';
  style?: React.CSSProperties;
};

export default function SectionShell({
  id,
  eyebrow,
  heading,
  headingAccent,
  lead,
  children,
  align = 'left',
  style,
}: SectionShellProps) {
  const headingId = `${id}-heading`;
  const centered = align === 'center';

  return (
    <section id={id} aria-labelledby={headingId} style={{ ...styles.section, ...style }}>
      <div style={styles.inner}>
        <header
          style={{
            ...styles.header,
            ...(centered ? styles.headerCentered : null),
          }}
        >
          <p style={styles.eyebrow}>
            <span aria-hidden="true" style={styles.eyebrowDot} />
            {eyebrow}
          </p>

          <h2 id={headingId} style={styles.heading}>
            {heading}
            {headingAccent ? (
              <>
                {' '}
                {/*
                  Gradient text is applied only to oversized display headings.
                  At this size WCAG's large-text threshold (3:1) applies, and the
                  violet end of the gradient measures 3.45:1 — body copy in the
                  same gradient would fail.
                */}
                <span style={styles.headingAccent}>{headingAccent}</span>
              </>
            ) : null}
          </h2>

          {lead ? (
            <p
              style={{
                ...styles.lead,
                ...(centered ? { marginInline: 'auto' } : null),
              }}
            >
              {lead}
            </p>
          ) : null}
        </header>

        {children}
      </div>
    </section>
  );
}

const styles = {
  section: {
    position: 'relative',
    paddingBlock: layout.sectionY,
  },
  inner: {
    ...container,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    maxWidth: 760,
    marginBottom: 'clamp(2.5rem, 1.8rem + 2.4vw, 4rem)',
  },
  headerCentered: {
    marginInline: 'auto',
    textAlign: 'center',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    marginBottom: '1.1rem',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: font.eyebrow,
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: color.textMuted,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    background: gradient.brand,
    boxShadow: '0 0 12px rgba(0, 229, 255, 0.7)',
  },
  heading: {
    fontSize: font.display2,
    fontWeight: 700,
    color: color.text,
  },
  headingAccent: {
    backgroundImage: gradient.brand,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  },
  lead: {
    maxWidth: 620,
    marginTop: '1.25rem',
    fontSize: font.bodyLg,
    lineHeight: 1.65,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
