'use client';

/**
 * The three arms of Cyconet: the Cybersecurity Academy, the tech solutions
 * agency and the co-working tech hub.
 *
 * This section does the heavy SEO lifting. Each arm's name is a real <h3>
 * inside a section with its own <h2>, which gives crawlers a clean heading
 * hierarchy for all three business lines on a single page — and gives readers
 * the answer to "what actually is this place?" immediately after the hero.
 *
 * The academy card is marked `flagship` and carries a gradient border, so the
 * visual hierarchy matches the commercial priority.
 */

import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import GlowMesh from '@/components/ui/GlowMesh';
import { ArrowRight, Check, Icon } from '@/components/ui/Icons';
import { color, ease, font, gradient, radius } from '@/lib/theme';
import { pillars } from '@/lib/content';

export default function Pillars() {
  return (
    <div style={{ position: 'relative' }}>
      <GlowMesh top="0%" />

      <SectionShell
        id="pillars"
        eyebrow="What Cyconet is"
        heading="One campus."
        headingAccent="Three arms."
        lead="A school that teaches it, an agency that ships it, and a hub where both happen in the same building. Each arm makes the other two better."
        align="center"
      >
        <ul style={styles.grid}>
          {pillars.map((pillar, index) => (
            <Reveal
              as="li"
              key={pillar.id}
              delay={index * 110}
              style={styles.cell}
            >
              <article
                className={`cn-pillar${pillar.flagship ? ' cn-pillar--flagship' : ''}`}
                style={styles.card}
              >
                {pillar.flagship ? (
                  <span style={styles.flagshipTag}>Flagship</span>
                ) : null}

                <span style={styles.eyebrow}>{pillar.eyebrow}</span>

                <span className="cn-pillar__icon" style={styles.iconWrap}>
                  <Icon name={pillar.icon} size={24} />
                </span>

                <h3 style={styles.title}>{pillar.title}</h3>
                <p style={styles.body}>{pillar.body}</p>

                <ul style={styles.points}>
                  {pillar.points.map((point) => (
                    <li key={point} style={styles.point}>
                      <span style={styles.check} aria-hidden="true">
                        <Check />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

                <a href={pillar.cta.href} className="cn-pillar__cta">
                  {pillar.cta.label}
                  <span className="cn-pillar__arrow">
                    <ArrowRight size={15} />
                  </span>
                </a>
              </article>
            </Reveal>
          ))}
        </ul>
      </SectionShell>

      <style jsx>{`
        .cn-pillar {
          transition:
            transform 380ms ${ease.out},
            border-color 380ms ${ease.out},
            background 380ms ${ease.out},
            box-shadow 380ms ${ease.out};
        }

        .cn-pillar:hover {
          transform: translateY(-6px);
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
          box-shadow:
            0 2px 4px rgba(0, 0, 0, 0.4),
            0 24px 60px rgba(0, 0, 0, 0.45);
        }

        /*
          The flagship card gets a gradient edge drawn as a masked pseudo-element
          rather than a border-image, so the 20px radius stays smooth.
        */
        .cn-pillar--flagship::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: ${gradient.brand};
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.75;
          pointer-events: none;
        }

        .cn-pillar--flagship:hover::before {
          opacity: 1;
        }

        .cn-pillar__icon {
          transition:
            transform 380ms ${ease.out},
            color 380ms ${ease.out};
        }

        .cn-pillar:hover .cn-pillar__icon {
          transform: translateY(-2px) scale(1.06);
          color: ${color.cyan};
        }

        .cn-pillar__cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          padding-top: 1.5rem;
          color: ${color.text};
          font-size: 0.92rem;
          font-weight: 600;
          transition: color 240ms ${ease.out};
        }

        .cn-pillar__cta:hover {
          color: ${color.cyan};
        }

        .cn-pillar__arrow {
          display: inline-flex;
          transition: transform 240ms ${ease.out};
        }

        .cn-pillar__cta:hover .cn-pillar__arrow {
          transform: translateX(4px);
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-pillar:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    /* Collapses to one column on phones without a media query. */
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1.25rem',
    textAlign: 'left',
  },
  cell: { display: 'flex' },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: 'clamp(1.5rem, 1.1rem + 1.2vw, 2.1rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  flagshipTag: {
    position: 'absolute',
    top: 'clamp(1.5rem, 1.1rem + 1.2vw, 2.1rem)',
    right: 'clamp(1.5rem, 1.1rem + 1.2vw, 2.1rem)',
    padding: '0.3rem 0.6rem',
    borderRadius: radius.pill,
    background: 'rgba(0, 229, 255, 0.12)',
    border: '1px solid rgba(0, 229, 255, 0.28)',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: color.cyan,
  },
  eyebrow: {
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: color.textFaint,
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginTop: '1.35rem',
    borderRadius: radius.md,
    border: `1px solid ${color.border}`,
    background: 'rgba(255, 255, 255, 0.04)',
    color: color.text,
  },
  title: {
    marginTop: '1.35rem',
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  body: {
    marginTop: '0.85rem',
    fontSize: '0.97rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
  points: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginTop: '1.5rem',
  },
  point: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: '0.9rem',
    color: color.text,
  },
  check: {
    display: 'inline-flex',
    marginTop: 3,
    color: color.cyan,
    flexShrink: 0,
  },
} satisfies Record<string, React.CSSProperties>;
