'use client';

/**
 * Why Cyconet — the feature highlights.
 *
 * Deliberately *not* another card grid. This section uses hairline-separated
 * cells with no card chrome, so it reads as a change of pace between the bento
 * programs above it and the agency rows below. Separators are drawn with
 * pseudo-elements because which edges need a rule depends on the breakpoint.
 */

import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import { Icon } from '@/components/ui/Icons';
import { color, ease, font, radius } from '@/lib/theme';
import { features } from '@/lib/content';

export default function WhyCyconet() {
  return (
    <>
      <SectionShell
        id="why"
        eyebrow="Why Cyconet"
        heading="Taught by people who"
        headingAccent="still ship."
        lead="Most schools teach from a syllabus written years ago. Ours is rewritten by the engineers delivering client work in the building next door."
      >
        <ul className="cn-why">
          {features.map((feature, index) => (
            <li key={feature.title} className="cn-why__cell">
              <Reveal delay={index * 90}>
                <span className="cn-why__icon" style={styles.iconWrap}>
                  <Icon name={feature.icon} size={22} />
                </span>
                <h3 style={styles.title}>{feature.title}</h3>
                <p style={styles.body}>{feature.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </SectionShell>

      <style jsx>{`
        .cn-why {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }

        .cn-why__cell {
          position: relative;
          padding: 2rem 0;
        }

        /* Horizontal rule between stacked cells on mobile. */
        .cn-why__cell + .cn-why__cell::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: ${color.border};
        }

        .cn-why__icon {
          transition:
            color 340ms ${ease.out},
            border-color 340ms ${ease.out},
            transform 340ms ${ease.out};
        }

        .cn-why__cell:hover .cn-why__icon {
          color: ${color.cyan};
          border-color: rgba(0, 229, 255, 0.35);
          transform: translateY(-3px);
        }

        @media (min-width: 820px) {
          .cn-why {
            grid-template-columns: repeat(2, 1fr);
            column-gap: 3.5rem;
          }

          .cn-why__cell {
            padding: 2.5rem 0;
          }

          /*
            On a two-column grid the mobile rule is wrong: cells 3 and 4 need a
            top rule, cells 2 and 4 need a left rule. Reset, then redraw.
          */
          .cn-why__cell + .cn-why__cell::before {
            display: none;
          }

          .cn-why__cell:nth-child(n + 3)::before {
            display: block;
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: ${color.border};
          }

          .cn-why__cell:nth-child(even)::after {
            content: '';
            position: absolute;
            top: 2.5rem;
            bottom: 2.5rem;
            left: -1.75rem;
            width: 1px;
            background: ${color.border};
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-why__cell:hover .cn-why__icon {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
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
  title: {
    marginTop: '1.35rem',
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  body: {
    marginTop: '0.8rem',
    maxWidth: '52ch',
    fontSize: '0.97rem',
    lineHeight: 1.72,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
