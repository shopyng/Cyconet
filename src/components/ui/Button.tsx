'use client';

/**
 * Button / CTA link.
 *
 * Renders an <a> when `href` is given and a real <button> otherwise, so the
 * element always matches its semantics — links navigate, buttons act.
 *
 * ── Why the styling is split ────────────────────────────────────────────────
 * Inline styles win over any stylesheet rule that lacks `!important`. So a
 * property set inline can never be changed by a styled-jsx `:hover` rule — the
 * hover just silently does nothing.
 *
 * The split this file uses (and the rest of the codebase follows):
 *   • `styles` object below  → geometry and typography; things that never move.
 *   • styled-jsx `<style jsx>` → the *skin*: background, border and shadow,
 *     declared with their hover state right beside them.
 *
 * ── Why the primary fill is not the full brand gradient ─────────────────────
 * Near-black ink on #7C3AED measures 3.45:1, which fails AA for a button label.
 * The fill therefore lands on periwinkle #818CF8, holding 6.6:1 across every
 * stop. True violet still appears in the hover glow, where no text sits.
 */

import { color, gradient, radius, ease } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  type?: 'button' | 'submit';
  onClick?: () => void;
  /** Rendered after the label, e.g. an arrow that slides on hover. */
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  ariaLabel?: string;
};

export default function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  trailing,
  fullWidth = false,
  ariaLabel,
}: ButtonProps) {
  const composed: React.CSSProperties = {
    ...styles.base,
    ...styles[size],
    ...(variant === 'ghost' ? styles.ghostLayout : null),
    ...(fullWidth ? { width: '100%' } : null),
  };

  const className = `cn-btn cn-btn--${variant}`;

  const inner = (
    <>
      <span>{children}</span>
      {trailing ? (
        <span className="cn-btn__trail" style={styles.trail}>
          {trailing}
        </span>
      ) : null}
    </>
  );

  return (
    <>
      {href ? (
        <a href={href} className={className} style={composed} aria-label={ariaLabel}>
          {inner}
        </a>
      ) : (
        <button
          type={type}
          onClick={onClick}
          className={className}
          style={composed}
          aria-label={ariaLabel}
        >
          {inner}
        </button>
      )}

      <style jsx>{`
        .cn-btn {
          position: relative;
          isolation: isolate;
          transition:
            transform 260ms ${ease.out},
            background 260ms ${ease.out},
            border-color 260ms ${ease.out},
            box-shadow 320ms ${ease.out},
            color 200ms ${ease.out};
        }

        .cn-btn__trail {
          transition: transform 260ms ${ease.out};
        }

        .cn-btn:hover .cn-btn__trail {
          transform: translateX(4px);
        }

        /* — Primary: gradient fill, violet bloom on hover — */
        .cn-btn--primary {
          background: ${gradient.cta};
          color: ${color.ink};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }

        .cn-btn--primary::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: ${gradient.brand};
          filter: blur(18px);
          opacity: 0;
          transition: opacity 320ms ${ease.out};
          z-index: -1;
        }

        .cn-btn--primary:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 30px rgba(0, 229, 255, 0.28),
            0 4px 12px rgba(124, 58, 237, 0.24);
        }

        .cn-btn--primary:hover::after {
          opacity: 0.55;
        }

        /* — Secondary: glass outline — */
        .cn-btn--secondary {
          background: ${color.surface};
          color: ${color.text};
          border-color: ${color.border};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .cn-btn--secondary:hover {
          transform: translateY(-2px);
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
        }

        /* — Ghost: text only — */
        .cn-btn--ghost {
          background: transparent;
          color: ${color.textMuted};
        }

        .cn-btn--ghost:hover {
          color: ${color.text};
        }

        .cn-btn:active {
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-btn:hover,
          .cn-btn:active {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

/* Geometry and typography only — see the note at the top of the file. */
const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: radius.pill,
    border: '1px solid transparent',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  trail: { display: 'inline-flex', alignItems: 'center' },
  ghostLayout: { paddingInline: 0 },

  md: { fontSize: '0.94rem', padding: '0.78rem 1.35rem' },
  lg: { fontSize: '1rem', padding: '1rem 1.75rem' },
} satisfies Record<string, React.CSSProperties>;
