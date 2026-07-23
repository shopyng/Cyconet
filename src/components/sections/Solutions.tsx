'use client';

/**
 * Tech Solutions Agency — arm 02.
 *
 * Laid out as wide horizontal rows rather than cards, both for visual variety
 * and because each service has a list of deliverables that reads better beside
 * the description than stacked under it.
 */

import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import SectionShell from '@/components/ui/SectionShell';
import GlowMesh from '@/components/ui/GlowMesh';
import { ArrowRight, Icon } from '@/components/ui/Icons';
import { color, ease, font, radius } from '@/lib/theme';
import { services } from '@/lib/content';

export default function Solutions() {
  return (
    <div style={{ position: 'relative' }}>
      <GlowMesh top="20%" />

      <SectionShell
        id="solutions"
        eyebrow="Tech Solutions Agency"
        heading="Hire the team that"
        headingAccent="teaches it."
        lead="From our base on Akala Expressway in Ibadan, our agency takes on security, software, cloud and data engagements for clients across Nigeria and West Africa — senior-led, documented, and handed over without lock-in."
      >
        <ul className="cn-svc">
          {services.map((service, index) => (
            <li key={service.title} className="cn-svc__row">
              <Reveal delay={index * 80}>
                <div className="cn-svc__grid">
                  <div className="cn-svc__lead">
                    <span className="cn-svc__icon" style={styles.iconWrap}>
                      <Icon name={service.icon} size={22} />
                    </span>
                    <h3 style={styles.title}>{service.title}</h3>
                  </div>

                  <p style={styles.body}>{service.body}</p>

                  <ul style={styles.tags}>
                    {service.deliverables.map((item) => (
                      <li key={item} style={styles.tag}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        <div style={styles.cta}>
          <p style={styles.ctaText}>
            Have something that needs building, securing or migrating?
          </p>
          <Button href="/solutions#enquiry" size="lg" trailing={<ArrowRight />}>
            Start a project
          </Button>
        </div>
      </SectionShell>

      <style jsx>{`
        .cn-svc {
          border-top: 1px solid ${color.border};
        }

        .cn-svc__row {
          position: relative;
          border-bottom: 1px solid ${color.border};
          transition: background 340ms ${ease.out};
        }

        .cn-svc__row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .cn-svc__grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          padding: 2rem 0;
        }

        .cn-svc__lead {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cn-svc__icon {
          flex-shrink: 0;
          transition:
            color 340ms ${ease.out},
            border-color 340ms ${ease.out},
            transform 340ms ${ease.out};
        }

        .cn-svc__row:hover .cn-svc__icon {
          color: ${color.cyan};
          border-color: rgba(0, 229, 255, 0.35);
          transform: scale(1.06);
        }

        @media (min-width: 900px) {
          .cn-svc__grid {
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.15fr) minmax(0, 0.8fr);
            align-items: center;
            gap: 2.5rem;
            padding: 2.25rem 0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-svc__row:hover .cn-svc__icon {
            transform: none;
          }
        }
      `}</style>
    </div>
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
    fontSize: 'clamp(1.1rem, 1rem + 0.5vw, 1.3rem)',
    fontWeight: 700,
    color: color.text,
  },
  body: {
    fontSize: '0.96rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
  },
  tag: {
    padding: '0.3rem 0.65rem',
    borderRadius: radius.sm,
    border: `1px solid ${color.border}`,
    background: 'rgba(255, 255, 255, 0.03)',
    fontSize: '0.76rem',
    fontWeight: 500,
    color: color.textMuted,
  },
  cta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    marginTop: '3rem',
    padding: 'clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  ctaText: {
    fontSize: font.bodyLg,
    fontWeight: 600,
    color: color.text,
  },
} satisfies Record<string, React.CSSProperties>;
