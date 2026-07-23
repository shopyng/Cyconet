'use client';

/**
 * Co-Working Tech Hub — arm 03.
 *
 * Split layout: amenities on the left as a checklist, membership plans on the
 * right as a small pricing stack. The featured plan carries the gradient edge
 * treatment used for the flagship card in <Pillars>, so "this is the one we
 * recommend" reads consistently across the page.
 */

import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import { ArrowRight, Check } from '@/components/ui/Icons';
import { color, ease, font, gradient, radius } from '@/lib/theme';
import { hubAmenities, hubPlans } from '@/lib/content';

export default function Hub() {
  return (
    <>
      <SectionShell
        id="hub"
        eyebrow="Co-Working Tech Hub"
        heading="A desk among people who"
        headingAccent="build things."
        lead="Fibre, backup power and 24/7 access — surrounded by the engineers, founders and graduates already working in the building. Day passes through to private team suites."
      >
        <div className="cn-hub">
          <Reveal>
            <div style={styles.amenitiesCard}>
              <h3 style={styles.amenitiesTitle}>What&rsquo;s included</h3>
              <ul style={styles.amenities}>
                {hubAmenities.map((amenity) => (
                  <li key={amenity} style={styles.amenity}>
                    <span style={styles.check} aria-hidden="true">
                      <Check />
                    </span>
                    {amenity}
                  </li>
                ))}
              </ul>

              <div style={styles.tourRow}>
                <Button href="/co-working-hub#tour" variant="secondary" trailing={<ArrowRight />}>
                  Book a tour
                </Button>
              </div>
            </div>
          </Reveal>

          <ul className="cn-plans">
            {hubPlans.map((plan, index) => (
              <li key={plan.name} className="cn-plan-cell">
                <Reveal delay={100 + index * 90}>
                  <article
                    className={`cn-plan${plan.featured ? ' cn-plan--featured' : ''}`}
                    style={styles.plan}
                    aria-labelledby={`plan-${plan.name.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div style={styles.planHead}>
                      <h3
                        id={`plan-${plan.name.replace(/\s+/g, '-').toLowerCase()}`}
                        style={styles.planName}
                      >
                        {plan.name}
                      </h3>
                      {plan.featured ? (
                        <span style={styles.popular}>Most popular</span>
                      ) : null}
                    </div>

                    <p style={styles.price}>
                      {plan.price}
                      <span style={styles.cadence}> {plan.cadence}</span>
                    </p>

                    <p style={styles.planBody}>{plan.body}</p>

                    <ul style={styles.perks}>
                      {plan.perks.map((perk) => (
                        <li key={perk} style={styles.perk}>
                          <span style={styles.check} aria-hidden="true">
                            <Check size={13} />
                          </span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>

      <style jsx>{`
        .cn-hub {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        .cn-plans {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .cn-plan {
          transition:
            transform 360ms ${ease.out},
            background 360ms ${ease.out},
            border-color 360ms ${ease.out};
        }

        .cn-plan:hover {
          transform: translateY(-4px);
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
        }

        /* Same masked gradient edge as the flagship pillar card. */
        .cn-plan--featured::before {
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
          opacity: 0.8;
          pointer-events: none;
        }

        @media (min-width: 980px) {
          .cn-hub {
            grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
            gap: 1.5rem;
            align-items: start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-plan:hover {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  amenitiesCard: {
    padding: 'clamp(1.5rem, 1.1rem + 1.4vw, 2.25rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  amenitiesTitle: {
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  amenities: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    marginTop: '1.5rem',
  },
  amenity: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    fontSize: '0.95rem',
    lineHeight: 1.55,
    color: color.text,
  },
  check: {
    display: 'inline-flex',
    marginTop: 3,
    color: color.cyan,
    flexShrink: 0,
  },
  tourRow: {
    marginTop: '2rem',
  },
  plan: {
    position: 'relative',
    padding: 'clamp(1.35rem, 1.1rem + 0.9vw, 1.75rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  planHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  planName: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: color.text,
  },
  popular: {
    padding: '0.28rem 0.6rem',
    borderRadius: radius.pill,
    background: 'rgba(0, 229, 255, 0.12)',
    border: '1px solid rgba(0, 229, 255, 0.28)',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: color.cyan,
    whiteSpace: 'nowrap',
  },
  price: {
    marginTop: '0.85rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: 'clamp(1.6rem, 1.3rem + 1.2vw, 2.1rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: color.text,
  },
  cadence: {
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: '0.88rem',
    fontWeight: 500,
    letterSpacing: 0,
    color: color.textMuted,
  },
  planBody: {
    marginTop: '0.6rem',
    fontSize: '0.92rem',
    lineHeight: 1.65,
    color: color.textMuted,
  },
  perks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem 1.25rem',
    marginTop: '1.25rem',
  },
  perk: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: '0.86rem',
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
