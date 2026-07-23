'use client';

/**
 * Decorative gradient mesh — the soft cyan/violet blooms that sit behind
 * sections and keep the near-black background from reading as flat.
 *
 * Purely presentational: `aria-hidden` and `pointer-events: none` keep it out
 * of the accessibility tree and out of the way of clicks. The drift animation
 * runs on `transform` alone so it never triggers layout, and is disabled under
 * `prefers-reduced-motion`.
 */

import { color } from '@/lib/theme';

type GlowMeshProps = {
  /**
   * `hero`    — two large blooms plus a grid wash, for the top of the page
   * `section` — a single subtle bloom to break up long scroll stretches
   */
  variant?: 'hero' | 'section';
  /** Vertical placement of the section bloom, as a CSS length or percentage. */
  top?: string;
};

export default function GlowMesh({ variant = 'section', top = '10%' }: GlowMeshProps) {
  if (variant === 'hero') {
    return (
      <div aria-hidden="true" className="cn-mesh" style={styles.root}>
        <span className="cn-orb cn-orb--cyan" style={styles.orbCyan} />
        <span className="cn-orb cn-orb--violet" style={styles.orbViolet} />
        <span style={styles.grid} />
        <span style={styles.vignette} />

        <style jsx>{`
          .cn-orb {
            animation: cn-drift 22s ${'ease-in-out'} infinite alternate;
          }

          .cn-orb--violet {
            animation-duration: 28s;
            animation-direction: alternate-reverse;
          }

          @keyframes cn-drift {
            from {
              transform: translate3d(0, 0, 0) scale(1);
            }
            to {
              transform: translate3d(4%, -5%, 0) scale(1.12);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .cn-orb {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div aria-hidden="true" style={styles.root}>
      <span style={{ ...styles.orbSection, top }} />
    </div>
  );
}

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  orbCyan: {
    position: 'absolute',
    top: '-18%',
    left: '-8%',
    width: 'min(760px, 85vw)',
    aspectRatio: '1',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color.cyan} 0%, transparent 68%)`,
    opacity: 0.16,
    filter: 'blur(70px)',
  },
  orbViolet: {
    position: 'absolute',
    top: '4%',
    right: '-14%',
    width: 'min(680px, 80vw)',
    aspectRatio: '1',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color.violet} 0%, transparent 68%)`,
    opacity: 0.24,
    filter: 'blur(80px)',
  },
  orbSection: {
    position: 'absolute',
    left: '50%',
    width: 'min(900px, 92vw)',
    aspectRatio: '2 / 1',
    transform: 'translateX(-50%)',
    background: `radial-gradient(ellipse, ${color.violet} 0%, transparent 70%)`,
    opacity: 0.1,
    filter: 'blur(90px)',
  },
  /** Faint technical grid — reads as blueprint paper rather than decoration. */
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(${color.border} 1px, transparent 1px), linear-gradient(90deg, ${color.border} 1px, transparent 1px)`,
    backgroundSize: '64px 64px',
    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 20%, transparent 75%)',
    WebkitMaskImage:
      'radial-gradient(ellipse 80% 60% at 50% 30%, #000 20%, transparent 75%)',
    opacity: 0.55,
  },
  /** Fades the mesh into the page background at the bottom edge. */
  vignette: {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(to bottom, transparent 55%, ${color.bg} 100%)`,
  },
} satisfies Record<string, React.CSSProperties>;
