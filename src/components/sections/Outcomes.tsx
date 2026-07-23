'use client';

/**
 * Student outcomes — testimonial carousel.
 *
 * Carousels are the easiest component to make inaccessible, so this one follows
 * the APG carousel pattern fairly closely:
 *
 *  - The region is labelled with `aria-roledescription="carousel"`, and each
 *    slide with `aria-roledescription="slide"` plus an "N of M" label.
 *  - Off-screen slides are `aria-hidden`, so a screen reader never reads four
 *    quotes as one run-on paragraph.
 *  - Auto-advance pauses on hover **and** on focus-within, and there is an
 *    explicit pause/play control — auto-rotating content that cannot be stopped
 *    fails WCAG 2.2.1.
 *  - `aria-live` is "off" while rotating (announcing every 6s would be hostile)
 *    and switches to "polite" once the user takes control.
 *  - Left/Right arrow keys work when focus is inside the carousel.
 *  - Auto-advance never starts under `prefers-reduced-motion`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import SectionShell from '@/components/ui/SectionShell';
import { Chevron, Quote } from '@/components/ui/Icons';
import { color, ease, gradient, radius } from '@/lib/theme';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { testimonials } from '@/lib/content';

const ROTATE_MS = 6500;

export default function Outcomes() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const regionRef = useRef<HTMLDivElement>(null);
  const count = testimonials.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  /* Auto-advance, suspended whenever the user is interacting or has opted out. */
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, count]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    }
  };

  const rotating = !paused && !reducedMotion;

  return (
    <>
      <SectionShell
        id="outcomes"
        eyebrow="Student outcomes"
        heading="Where our graduates"
        headingAccent="ended up."
        lead="Four thousand people have come through Cyconet. These are four of them, in their own words."
      >
        <div
          ref={regionRef}
          className="cn-carousel"
          role="group"
          aria-roledescription="carousel"
          aria-label="Student testimonials"
          onKeyDown={onKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setPaused(false);
            }
          }}
          style={styles.carousel}
        >
          <div
            style={styles.viewport}
            aria-live={rotating ? 'off' : 'polite'}
            aria-atomic="false"
          >
            <div
              style={{
                ...styles.track,
                transform: `translate3d(-${index * 100}%, 0, 0)`,
              }}
            >
              {testimonials.map((item, i) => (
                <div
                  key={item.name}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={i !== index}
                  style={styles.slide}
                >
                  <figure style={styles.figure}>
                    <span aria-hidden="true" style={styles.quoteMark}>
                      <Quote />
                    </span>

                    <blockquote style={styles.quote}>{item.quote}</blockquote>

                    <figcaption style={styles.caption}>
                      <span aria-hidden="true" style={styles.avatar}>
                        {item.initials}
                      </span>
                      <span>
                        <span style={styles.name}>{item.name}</span>
                        <span style={styles.role}>{item.role}</span>
                      </span>
                      <span style={styles.outcome}>{item.outcome}</span>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.controls}>
            <div style={styles.dots}>
              {testimonials.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  className={`cn-dot${i === index ? ' cn-dot--active' : ''}`}
                  aria-label={`Show testimonial ${i + 1} of ${count}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                />
              ))}
            </div>

            <div style={styles.arrows}>
              <button
                type="button"
                className="cn-arrow"
                aria-label={rotating ? 'Pause testimonials' : 'Play testimonials'}
                aria-pressed={paused}
                onClick={() => setPaused((p) => !p)}
              >
                {rotating ? <PauseGlyph /> : <PlayGlyph />}
              </button>
              <button
                type="button"
                className="cn-arrow"
                aria-label="Previous testimonial"
                onClick={() => go(index - 1)}
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                className="cn-arrow"
                aria-label="Next testimonial"
                onClick={() => go(index + 1)}
              >
                <Chevron dir="right" />
              </button>
            </div>
          </div>
        </div>
      </SectionShell>

      <style jsx>{`
        .cn-dot {
          width: 28px;
          height: 6px;
          border-radius: 999px;
          background: ${color.border};
          transition:
            background 300ms ${ease.out},
            width 300ms ${ease.out};
        }

        .cn-dot:hover {
          background: ${color.borderStrong};
        }

        .cn-dot--active {
          width: 44px;
          background: ${gradient.brand};
        }

        .cn-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 1px solid ${color.border};
          border-radius: 999px;
          background: ${color.surface};
          color: ${color.text};
          transition:
            background 260ms ${ease.out},
            border-color 260ms ${ease.out},
            transform 260ms ${ease.out};
        }

        .cn-arrow:hover {
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-arrow:hover {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

function PauseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1.4" />
      <rect x="13.5" y="5" width="4" height="14" rx="1.4" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
    </svg>
  );
}

const styles = {
  carousel: {
    position: 'relative',
  },
  viewport: {
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  track: {
    display: 'flex',
    /* Only transform animates — no layout, no repaint of the slide contents. */
    transition: `transform 620ms ${ease.inOut}`,
  },
  slide: {
    flex: '0 0 100%',
    minWidth: 0,
  },
  figure: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 'clamp(1.75rem, 1.2rem + 2.4vw, 3.25rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.xl,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  quoteMark: {
    color: color.violetSoft,
    opacity: 0.55,
  },
  quote: {
    marginTop: '1.25rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: 'clamp(1.15rem, 0.95rem + 1.1vw, 1.7rem)',
    fontWeight: 600,
    lineHeight: 1.45,
    letterSpacing: '-0.02em',
    color: color.text,
  },
  caption: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.9rem',
    marginTop: 'auto',
    paddingTop: '2rem',
  },
  avatar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    flexShrink: 0,
    borderRadius: radius.pill,
    background: gradient.brand,
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '0.9rem',
    fontWeight: 800,
    color: color.ink,
  },
  name: {
    display: 'block',
    fontSize: '0.98rem',
    fontWeight: 700,
    color: color.text,
  },
  role: {
    display: 'block',
    fontSize: '0.85rem',
    color: color.textMuted,
  },
  outcome: {
    marginLeft: 'auto',
    padding: '0.4rem 0.8rem',
    borderRadius: radius.pill,
    border: '1px solid rgba(0, 229, 255, 0.28)',
    background: 'rgba(0, 229, 255, 0.1)',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: color.cyan,
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginTop: '1.75rem',
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  arrows: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
} satisfies Record<string, React.CSSProperties>;
