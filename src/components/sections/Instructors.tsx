'use client';

/**
 * Instructor profile cards.
 *
 * Portraits are rendered as gradient monogram tiles rather than photographs.
 * That is a deliberate choice, not a placeholder: stock headshots on an
 * education site read as fake, and real staff photos should be supplied by the
 * client. Swapping a tile for <Image> later is a contained change.
 */

import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import { color, ease, gradient, radius } from '@/lib/theme';
import { instructors } from '@/lib/content';

export default function Instructors() {
  return (
    <>
      <SectionShell
        id="instructors"
        eyebrow="Instructors"
        heading="The people who will"
        headingAccent="review your code."
        lead="Every instructor splits their week between teaching and live client work in our solutions agency. You are learning from someone whose code shipped this month."
      >
        <ul className="cn-team">
          {instructors.map((person, index) => (
            <li key={person.name} className="cn-team__cell">
              <Reveal delay={index * 80} style={styles.revealFill}>
                <article className="cn-person" style={styles.card}>
                  <div style={styles.head}>
                    {/*
                      Decorative: the name sits in the heading right beside it,
                      so announcing the initials again would just be noise.
                    */}
                    <span aria-hidden="true" style={styles.monogram}>
                      {person.initials}
                    </span>
                    <div>
                      <h3 style={styles.name}>{person.name}</h3>
                      <p style={styles.role}>{person.role}</p>
                    </div>
                  </div>

                  <p style={styles.track}>{person.track}</p>
                  <p style={styles.bio}>{person.bio}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </SectionShell>

      <style jsx>{`
        .cn-team {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
          gap: 1.15rem;
        }

        .cn-team__cell {
          display: flex;
        }

        .cn-person {
          transition:
            transform 380ms ${ease.out},
            background 380ms ${ease.out},
            border-color 380ms ${ease.out},
            box-shadow 380ms ${ease.out};
        }

        .cn-person:hover {
          transform: translateY(-6px);
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
          box-shadow:
            0 2px 4px rgba(0, 0, 0, 0.4),
            0 24px 60px rgba(0, 0, 0, 0.45);
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-person:hover {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  revealFill: { display: 'flex', width: '100%' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: 'clamp(1.35rem, 1.1rem + 0.9vw, 1.75rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
  },
  monogram: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    flexShrink: 0,
    borderRadius: radius.md,
    background: gradient.brand,
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    /* Near-black on the gradient tile: 12.8:1 at the cyan end, 3.5:1 at the
       violet end — acceptable here because the monogram is decorative and
       aria-hidden, with the real name in the adjacent heading. */
    color: color.ink,
  },
  name: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: color.text,
  },
  role: {
    marginTop: '0.15rem',
    fontSize: '0.85rem',
    color: color.textMuted,
  },
  track: {
    marginTop: '1.35rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: color.cyan,
  },
  bio: {
    marginTop: '0.7rem',
    fontSize: '0.93rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
