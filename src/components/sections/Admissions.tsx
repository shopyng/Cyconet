'use client';

/**
 * Admissions — the numbered "how to apply" timeline.
 *
 * Marked up as an ordered list, so the sequence is conveyed by the semantics
 * rather than only by the drawn numerals. The connecting rail is a
 * pseudo-element on each step and is stopped on the final one, which keeps the
 * line from dangling past the last node.
 */

import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import GlowMesh from '@/components/ui/GlowMesh';
import { ArrowRight } from '@/components/ui/Icons';
import { color, ease, font, radius } from '@/lib/theme';
import { admissionSteps } from '@/lib/content';

export default function Admissions() {
  return (
    <div style={{ position: 'relative' }}>
      <GlowMesh top="15%" />

      <SectionShell
        id="admissions"
        eyebrow="Admissions"
        heading="Four steps from here to"
        headingAccent="day one."
        lead="No degree required, no application fee, and an honest conversation before you commit. The whole process usually takes under two weeks."
      >
        <ol className="cn-steps">
          {admissionSteps.map((step, index) => (
            <li key={step.title} className="cn-step">
              <Reveal delay={index * 90}>
                <div className="cn-step__inner">
                  <span aria-hidden="true" className="cn-step__num">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p style={styles.meta}>{step.meta}</p>
                    <h3 style={styles.title}>{step.title}</h3>
                    <p style={styles.body}>{step.body}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <div style={styles.cta}>
          <div>
            <p style={styles.ctaTitle}>Cohort 07 closes on March 14.</p>
            <p style={styles.ctaBody}>
              Seats are capped at 24 per track, and the cybersecurity cohort fills first.
            </p>
          </div>
          <Button href="/apply" size="lg" trailing={<ArrowRight />}>
            Start your application
          </Button>
        </div>
      </SectionShell>

      <style jsx>{`
        .cn-step {
          position: relative;
          padding-left: 4.25rem;
          padding-bottom: 2.5rem;
        }

        .cn-step:last-child {
          padding-bottom: 0;
        }

        /* The rail: runs from under each numeral down to the next step. */
        .cn-step::before {
          content: '';
          position: absolute;
          left: 1.4rem;
          top: 3.1rem;
          bottom: 0;
          width: 1px;
          background: linear-gradient(
            to bottom,
            ${color.borderStrong},
            ${color.border} 60%,
            transparent
          );
        }

        .cn-step:last-child::before {
          display: none;
        }

        .cn-step__num {
          position: absolute;
          left: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.8rem;
          height: 2.8rem;
          border: 1px solid ${color.border};
          border-radius: 999px;
          background: ${color.bgElevated};
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: ${color.textMuted};
          transition:
            color 340ms ${ease.out},
            border-color 340ms ${ease.out},
            box-shadow 340ms ${ease.out};
        }

        .cn-step:hover .cn-step__num {
          color: ${color.cyan};
          border-color: rgba(0, 229, 255, 0.4);
          box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.08);
        }

        @media (min-width: 900px) {
          .cn-steps {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            column-gap: 3rem;
          }

          /* In two columns the rail would cut across the gap — drop it. */
          .cn-step::before {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  meta: {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: color.cyan,
  },
  title: {
    marginTop: '0.55rem',
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  body: {
    marginTop: '0.7rem',
    maxWidth: '52ch',
    fontSize: '0.95rem',
    lineHeight: 1.72,
    color: color.textMuted,
  },
  cta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    marginTop: 'clamp(2.5rem, 2rem + 2vw, 4rem)',
    padding: 'clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: `linear-gradient(135deg, rgba(0,229,255,0.07) 0%, rgba(124,58,237,0.07) 100%)`,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  ctaTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.bodyLg,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: color.text,
  },
  ctaBody: {
    marginTop: '0.35rem',
    fontSize: '0.92rem',
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
