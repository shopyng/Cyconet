'use client';

/**
 * Hero.
 *
 * The <h1> stays short and brand-led; the paragraph directly beneath it carries
 * the keyword load ("cybersecurity academy", "tech school", "solutions agency",
 * "co-working tech hub"). That ordering matters — the first paragraph after the
 * h1 is weighted heavily, and it lets the headline stay a headline instead of
 * turning into a keyword list.
 *
 * The floating motifs are decorative and hidden below 1100px, where they would
 * otherwise collide with the text column.
 */

import Button from '@/components/ui/Button';
import GlowMesh from '@/components/ui/GlowMesh';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight, Icon } from '@/components/ui/Icons';
import { color, container, ease, font, gradient, radius } from '@/lib/theme';
import { hero } from '@/lib/content';

/** Decorative glass chips that drift around the headline on wide screens. */
const MOTIFS = [
  { icon: 'shield', label: 'Threat detected', side: 'left', top: '20%', delay: '0s' },
  { icon: 'cloud', label: 'Deploy · passing', side: 'right', top: '28%', delay: '1.4s' },
  { icon: 'code', label: 'PR #482 merged', side: 'left', top: '68%', delay: '2.6s' },
  { icon: 'spark', label: 'Model eval · 0.94', side: 'right', top: '72%', delay: '0.8s' },
] as const;

export default function Hero() {
  return (
    <section id="top" style={styles.section} aria-labelledby="hero-heading">
      <GlowMesh variant="hero" />

      {MOTIFS.map((motif) => (
        <span
          key={motif.label}
          aria-hidden="true"
          className={`cn-motif cn-motif--${motif.side}`}
          style={{ top: motif.top, animationDelay: motif.delay }}
        >
          <span className="cn-motif__icon">
            <Icon name={motif.icon} size={16} />
          </span>
          {motif.label}
        </span>
      ))}

      <div style={styles.inner}>
        <Reveal>
          <p style={styles.badge}>
            <span aria-hidden="true" className="cn-pulse" />
            {hero.badge}
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 id="hero-heading" style={styles.headline}>
            {hero.headlinePlain}{' '}
            <span style={styles.headlineAccent}>{hero.headlineAccent}</span>
          </h1>
        </Reveal>

        <Reveal delay={170}>
          <p style={styles.sub}>{hero.sub}</p>
        </Reveal>

        <Reveal delay={250}>
          <div style={styles.ctaRow}>
            <Button href={hero.primaryCta.href} size="lg" trailing={<ArrowRight />}>
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} variant="secondary" size="lg">
              {hero.secondaryCta.label}
            </Button>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <div style={styles.partners}>
            <p style={styles.partnersLabel}>Our graduates work at</p>
            <ul style={styles.partnersList}>
              {hero.partners.map((partner) => (
                <li key={partner} className="cn-partner">
                  {partner}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        .cn-pulse {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: ${color.cyan};
          box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.7);
          animation: cn-pulse 2.4s ${ease.out} infinite;
        }

        @keyframes cn-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.55);
          }
          70% {
            box-shadow: 0 0 0 9px rgba(0, 229, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 229, 255, 0);
          }
        }

        .cn-partner {
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: clamp(0.95rem, 0.85rem + 0.4vw, 1.15rem);
          font-weight: 600;
          letter-spacing: -0.01em;
          color: ${color.textFaint};
          transition: color 260ms ${ease.out};
        }

        .cn-partner:hover {
          color: ${color.textMuted};
        }

        /* — Floating motifs — */
        .cn-motif {
          display: none;
          position: absolute;
          z-index: 1;
          align-items: center;
          gap: 8px;
          padding: 0.55rem 0.9rem;
          border: 1px solid ${color.border};
          border-radius: ${radius.pill}px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
          color: ${color.textMuted};
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
          animation: cn-float 9s ease-in-out infinite;
        }

        .cn-motif__icon {
          display: inline-flex;
          color: ${color.cyan};
        }

        .cn-motif--left {
          left: clamp(1rem, 4vw, 5rem);
        }

        .cn-motif--right {
          right: clamp(1rem, 4vw, 5rem);
        }

        @keyframes cn-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        @media (min-width: 1100px) {
          .cn-motif {
            display: inline-flex;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-motif,
          .cn-pulse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  section: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 'clamp(4.5rem, 2rem + 9vw, 8.5rem)',
    paddingBottom: 'clamp(4rem, 2rem + 7vw, 7rem)',
  },
  inner: {
    ...container,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '0.45rem 0.95rem 0.45rem 0.75rem',
    border: `1px solid ${color.border}`,
    borderRadius: radius.pill,
    background: color.surface,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: color.textMuted,
  },
  headline: {
    /* Holds the headline to roughly two lines on desktop. */
    maxWidth: 980,
    marginTop: '1.75rem',
    fontSize: font.display1,
    fontWeight: 800,
    color: color.text,
  },
  headlineAccent: {
    backgroundImage: gradient.brand,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  },
  sub: {
    maxWidth: 660,
    marginTop: '1.6rem',
    fontSize: font.bodyLg,
    lineHeight: 1.7,
    color: color.textMuted,
  },
  ctaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.85rem',
    marginTop: '2.5rem',
  },
  partners: {
    marginTop: 'clamp(3.5rem, 2rem + 5vw, 6rem)',
  },
  partnersLabel: {
    marginBottom: '1.35rem',
    fontSize: font.eyebrow,
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: color.textFaint,
  },
  partnersList: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 'clamp(1.5rem, 0.5rem + 4vw, 3.5rem)',
  },
} satisfies Record<string, React.CSSProperties>;
