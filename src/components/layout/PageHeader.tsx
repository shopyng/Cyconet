/**
 * Header block for sub-pages: breadcrumbs, the page <h1>, a lead paragraph and
 * optional stat chips.
 *
 * Every sub-page uses this so the <h1> is unambiguous and singular per route —
 * the single most basic on-page SEO signal, and the one most often broken by
 * reusing a homepage hero.
 *
 * Server Component: no hooks, no styled-jsx.
 */

import Breadcrumbs, { type Crumb } from '@/components/ui/Breadcrumbs';
import GlowMesh from '@/components/ui/GlowMesh';
import { color, container, font, gradient, radius } from '@/lib/theme';

export default function PageHeader({
  trail,
  eyebrow,
  title,
  titleAccent,
  lead,
  meta,
  children,
}: {
  trail: Crumb[];
  eyebrow: string;
  title: string;
  /** Trailing phrase rendered in the brand gradient — display size only. */
  titleAccent?: string;
  lead: string;
  /** Short factual chips: duration, level, format. */
  meta?: string[];
  /** Call-to-action row. */
  children?: React.ReactNode;
}) {
  return (
    <header style={styles.header}>
      <GlowMesh variant="hero" />

      <div style={styles.crumbWrap}>
        <Breadcrumbs trail={trail} />
      </div>

      <div style={styles.inner}>
        <p style={styles.eyebrow}>
          <span aria-hidden="true" style={styles.dot} />
          {eyebrow}
        </p>

        <h1 style={styles.title}>
          {title}
          {titleAccent ? (
            <>
              {' '}
              <span style={styles.accent}>{titleAccent}</span>
            </>
          ) : null}
        </h1>

        <p style={styles.lead}>{lead}</p>

        {meta?.length ? (
          <ul style={styles.meta}>
            {meta.map((item) => (
              <li key={item} style={styles.chip}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {children ? <div style={styles.actions}>{children}</div> : null}
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 'clamp(2.5rem, 2rem + 3vw, 4.5rem)',
  },
  crumbWrap: {
    position: 'relative',
    zIndex: 2,
  },
  inner: {
    ...container,
    position: 'relative',
    zIndex: 2,
    paddingTop: 'clamp(2rem, 1.5rem + 3vw, 3.5rem)',
    maxWidth: 900,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    marginBottom: '1.1rem',
    fontSize: font.eyebrow,
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: color.textMuted,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    background: gradient.brand,
    boxShadow: '0 0 12px rgba(0, 229, 255, 0.7)',
  },
  title: {
    fontSize: font.display2,
    fontWeight: 800,
    color: color.text,
  },
  accent: {
    backgroundImage: gradient.brand,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  },
  lead: {
    marginTop: '1.35rem',
    maxWidth: '62ch',
    fontSize: font.bodyLg,
    lineHeight: 1.7,
    color: color.textMuted,
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1.75rem',
  },
  chip: {
    padding: '0.4rem 0.85rem',
    borderRadius: radius.pill,
    border: `1px solid ${color.border}`,
    background: color.surface,
    fontSize: '0.82rem',
    fontWeight: 500,
    color: color.textMuted,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.85rem',
    marginTop: '2rem',
  },
} satisfies Record<string, React.CSSProperties>;
