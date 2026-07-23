'use client';

/**
 * FAQ accordion.
 *
 * Built on native <details>/<summary>. That is not laziness — the native
 * element already gives keyboard operation, correct expanded/collapsed state
 * for screen readers, and in-page find-on-page expansion, all of which a
 * hand-rolled div accordion has to reimplement and usually gets wrong.
 *
 * These answers are also emitted as FAQPage structured data (see src/lib/seo.ts),
 * which is what makes them eligible to appear as expandable results in search.
 * The visible copy and the schema read from the same array, so they cannot
 * drift apart — mismatched FAQ markup is a manual-action risk.
 */

import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import { color, ease, radius } from '@/lib/theme';
import { faqs } from '@/lib/content';

export default function Faq() {
  return (
    <>
      <SectionShell
        id="faq"
        eyebrow="Questions"
        heading="Things people ask"
        headingAccent="before applying."
        lead="Still unsure? Admissions answers email within one working day."
        align="center"
      >
        <div style={styles.list}>
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={index * 70}>
              <details className="cn-faq" name="cyconet-faq">
                <summary className="cn-faq__q">
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="cn-faq__sign" />
                </summary>
                <div className="cn-faq__a">
                  <p style={styles.answer}>{faq.answer}</p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <style jsx>{`
        .cn-faq {
          border: 1px solid ${color.border};
          border-radius: ${radius.md}px;
          background: ${color.surface};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition:
            border-color 280ms ${ease.out},
            background 280ms ${ease.out};
        }

        .cn-faq:hover,
        .cn-faq[open] {
          border-color: ${color.borderStrong};
          background: ${color.surfaceHover};
        }

        .cn-faq__q {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          padding: 1.15rem 1.35rem;
          cursor: pointer;
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: clamp(1rem, 0.95rem + 0.25vw, 1.12rem);
          font-weight: 600;
          letter-spacing: -0.015em;
          color: ${color.text};
          list-style: none;
        }

        /* Hide the default disclosure triangle in both engines. */
        .cn-faq__q::-webkit-details-marker {
          display: none;
        }

        /* Plus sign that rotates into a minus when the panel opens. */
        .cn-faq__sign {
          position: relative;
          flex-shrink: 0;
          width: 18px;
          height: 18px;
        }

        .cn-faq__sign::before,
        .cn-faq__sign::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 1.8px;
          border-radius: 2px;
          background: ${color.cyan};
          transition: transform 320ms ${ease.out};
        }

        .cn-faq__sign::after {
          transform: rotate(90deg);
        }

        .cn-faq[open] .cn-faq__sign::after {
          transform: rotate(0deg);
        }

        .cn-faq__a {
          padding: 0 1.35rem 1.3rem;
        }

        @media (prefers-reduced-motion: no-preference) {
          .cn-faq[open] .cn-faq__a {
            animation: cn-faq-in 320ms ${ease.out};
          }
        }

        @keyframes cn-faq-in {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: 820,
    marginInline: 'auto',
    textAlign: 'left',
  },
  answer: {
    maxWidth: '68ch',
    fontSize: '0.96rem',
    lineHeight: 1.72,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
