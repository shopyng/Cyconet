'use client';

/**
 * Programs, laid out as a bento grid.
 *
 * Card spans are declared per-program rather than derived, so the composition
 * stays intentional: the two flagship tracks (Cybersecurity, AI/ML) take the
 * wide cells, and Cloud closes the grid as a full-width banner. On a 6-column
 * desktop grid the rows read 4+2 / 2+4 / 6.
 *
 * Spans live in styled-jsx because they are breakpoint-dependent — an inline
 * `gridColumn` would outrank the media query and the mobile stack would break.
 */

import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import { ArrowRight, Icon } from '@/components/ui/Icons';
import { color, ease, font, radius } from '@/lib/theme';
import { programs } from '@/lib/content';
import { programHref } from '@/lib/routes';

export default function Programs() {
  return (
    <>
      <SectionShell
        id="programs"
        eyebrow="Programs"
        heading="Five tracks. One"
        headingAccent="standard."
        lead="Every track is full-time, project-based and taught by engineers still working in the field. Cybersecurity is our flagship — the rest of the curriculum grew out of it."
      >
        {/*
          The bento spans must sit on <li> elements written here, not on
          <Reveal>. styled-jsx only attaches its scope class to JSX authored
          inside this component — a class handed to a child component lands on
          DOM that the scope class never reaches, and the rule silently fails to
          match. Reveal therefore goes *inside* the cell it animates.
        */}
        <ul className="cn-bento">
          {programs.map((program, index) => (
            <li
              key={program.id}
              className={`cn-bento__cell cn-bento__cell--${program.id}`}
            >
            <Reveal delay={index * 80} style={styles.revealFill}>
              <article
                className={`cn-card${program.feature ? ' cn-card--feature' : ''}`}
                style={styles.card}
                aria-labelledby={`program-${program.id}`}
              >
                {/*
                  Split into main/foot so the full-width cell can lay the two
                  halves side by side instead of leaving a dead right margin.
                */}
                <div className="cn-card__main">
                  <div style={styles.cardHead}>
                    <span className="cn-card__icon" style={styles.iconWrap}>
                      <Icon name={program.icon} size={22} />
                    </span>
                    <span style={styles.duration}>{program.duration}</span>
                  </div>

                  <h3 id={`program-${program.id}`} style={styles.title}>
                    {program.title}
                  </h3>
                  <p style={styles.level}>{program.level}</p>
                  <p style={styles.description}>{program.description}</p>
                </div>

                <div className="cn-card__foot">
                  <ul style={styles.skills}>
                    {program.skills.map((skill) => (
                      <li key={skill} style={styles.skill}>
                        {skill}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={programHref(program.id)}
                    className="cn-card__link"
                    aria-label={`See the full ${program.title} curriculum`}
                  >
                    See the curriculum
                    <span className="cn-card__arrow">
                      <ArrowRight size={15} />
                    </span>
                  </a>
                </div>
              </article>
            </Reveal>
            </li>
          ))}
        </ul>
      </SectionShell>

      <style jsx>{`
        .cn-bento {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.15rem;
        }

        .cn-bento__cell {
          display: flex;
        }

        /*
          The card's own layout lives here, not inline: the full-width cell
          below switches it to a grid, and an inline display property would
          outrank that media query while stray grid rules still leaked through.
        */
        .cn-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          transition:
            transform 400ms ${ease.out},
            background 400ms ${ease.out},
            border-color 400ms ${ease.out},
            box-shadow 400ms ${ease.out};
        }

        .cn-card:hover {
          transform: translateY(-6px);
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
          box-shadow:
            0 2px 4px rgba(0, 0, 0, 0.4),
            0 24px 60px rgba(0, 0, 0, 0.45);
        }

        /* Gradient wash that fades in behind the feature cards on hover. */
        .cn-card--feature::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            120% 100% at 100% 0%,
            rgba(124, 58, 237, 0.16) 0%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 400ms ${ease.out};
          pointer-events: none;
        }

        .cn-card--feature:hover::after {
          opacity: 1;
        }

        .cn-card__icon {
          transition:
            color 400ms ${ease.out},
            border-color 400ms ${ease.out},
            transform 400ms ${ease.out};
        }

        .cn-card:hover .cn-card__icon {
          color: ${color.cyan};
          border-color: rgba(0, 229, 255, 0.35);
          transform: scale(1.06);
        }

        .cn-card__main {
          position: relative;
          z-index: 1;
        }

        /* Pushed to the bottom so cards in a row align their CTAs. */
        .cn-card__foot {
          position: relative;
          z-index: 1;
          margin-top: auto;
          padding-top: 1.4rem;
        }

        .cn-card__link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 1.3rem;
          color: ${color.textMuted};
          font-size: 0.9rem;
          font-weight: 600;
          transition: color 260ms ${ease.out};
        }

        .cn-card:hover .cn-card__link {
          color: ${color.text};
        }

        .cn-card__link:hover {
          color: ${color.cyan};
        }

        .cn-card__arrow {
          display: inline-flex;
          transition: transform 260ms ${ease.out};
        }

        .cn-card__link:hover .cn-card__arrow {
          transform: translateX(4px);
        }

        /* — Bento composition — */
        @media (min-width: 780px) {
          .cn-bento {
            grid-template-columns: repeat(6, 1fr);
          }

          .cn-bento__cell--cybersecurity {
            grid-column: span 4;
          }
          .cn-bento__cell--software-engineering {
            grid-column: span 2;
          }
          .cn-bento__cell--data-science {
            grid-column: span 2;
          }
          .cn-bento__cell--ai-ml {
            grid-column: span 4;
          }
          .cn-bento__cell--cloud-computing {
            grid-column: span 6;
          }

          /*
            The full-width cell would otherwise stretch one column of text
            across 1120px and leave the right half empty. Two columns instead:
            copy on the left, skills and CTA on the right.
          */
          .cn-bento__cell--cloud-computing .cn-card {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
            column-gap: clamp(2rem, 1rem + 4vw, 4.5rem);
            align-items: center;
          }

          .cn-bento__cell--cloud-computing .cn-card__foot {
            margin-top: 0;
            padding-top: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-card:hover {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  /* Lets the Reveal wrapper stretch so cards in a row match height. */
  revealFill: {
    display: 'flex',
    width: '100%',
  },
  /* Layout (display/flex-direction/width) is in styled-jsx — see note there. */
  card: {
    position: 'relative',
    padding: 'clamp(1.4rem, 1.1rem + 1.1vw, 2rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    overflow: 'hidden',
  },
  cardHead: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    borderRadius: radius.md,
    border: `1px solid ${color.border}`,
    background: 'rgba(255, 255, 255, 0.04)',
    color: color.text,
  },
  duration: {
    padding: '0.32rem 0.7rem',
    borderRadius: radius.pill,
    border: `1px solid ${color.border}`,
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: color.textMuted,
    whiteSpace: 'nowrap',
  },
  title: {
    position: 'relative',
    zIndex: 1,
    marginTop: '1.5rem',
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  level: {
    position: 'relative',
    zIndex: 1,
    marginTop: '0.4rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    /*
      Solid cyan (12.8:1), not the brand gradient. At 12.8px this is small text,
      so it needs the full 4.5:1 — the violet end of the gradient only reaches
      3.45:1 and would fail here. Gradient text is reserved for display sizes.
    */
    color: color.cyan,
  },
  description: {
    position: 'relative',
    zIndex: 1,
    marginTop: '0.9rem',
    maxWidth: '58ch',
    fontSize: '0.96rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
  skills: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1.4rem',
  },
  skill: {
    padding: '0.32rem 0.7rem',
    borderRadius: radius.sm,
    border: `1px solid ${color.border}`,
    background: 'rgba(255, 255, 255, 0.03)',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
