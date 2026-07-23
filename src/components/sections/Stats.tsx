'use client';

/**
 * Stats bar with numbers that count up the first time they scroll into view.
 *
 * Two details that are easy to get wrong:
 *
 *  - **Screen readers.** An animating number would be announced dozens of times
 *    as it ticks. The animated figure is `aria-hidden` and the final value is
 *    exposed once, in visually hidden text.
 *  - **Reduced motion.** The count-up is skipped entirely rather than sped up,
 *    so the final figure is simply there.
 */

import { useEffect, useRef, useState } from 'react';
import { color, container, ease, font, radius, srOnly } from '@/lib/theme';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { stats, type Stat } from '@/lib/content';

/** Ease-out cubic — fast start, gentle settle. Feels like a counter landing. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const DURATION = 1600;

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    /* No count-up when motion is reduced — the final figure is simply there. */
    if (reducedMotion) return;

    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let start: number | null = null;

    const step = (timestamp: number) => {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / DURATION, 1);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setDone(true);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, reducedMotion]);

  /* Derived, so the reduced-motion path needs no state write at all. */
  return { ref, value: reducedMotion || done ? target : value };
}

function StatCell({ stat }: { stat: Stat }) {
  const { ref, value: shown } = useCountUp(stat.value);

  return (
    <div ref={ref} className="cn-stat" style={styles.cell}>
      <p style={styles.value}>
        <span aria-hidden="true">
          {shown.toLocaleString('en-US')}
          {stat.suffix}
        </span>
        <span style={srOnly}>
          {stat.value.toLocaleString('en-US')}
          {stat.suffix}
        </span>
      </p>
      <p style={styles.label}>{stat.label}</p>
      <p style={styles.detail}>{stat.detail}</p>

      {/*
        These rules live here rather than in <Stats> because styled-jsx scopes
        to the component that authors the element. Every StatCell instance
        shares one scope hash, so the sibling combinator below still matches
        across cells.
      */}
      <style jsx>{`
        .cn-stat {
          transition: transform 320ms ${ease.out};
        }

        .cn-stat:hover {
          transform: translateY(-3px);
        }

        /* Hairline dividers, skipped at the start of each row. */
        .cn-stat + .cn-stat::before {
          content: '';
          position: absolute;
          left: 0;
          top: 12%;
          bottom: 12%;
          width: 1px;
          background: ${color.border};
        }

        .cn-stat:nth-child(3)::before {
          display: none;
        }

        @media (min-width: 760px) {
          .cn-stat:nth-child(3)::before {
            display: block;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-stat:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function Stats() {
  return (
    <section aria-label="Cyconet by the numbers" style={styles.section}>
      <div style={styles.inner}>
        <div className="cn-stats" style={styles.bar}>
          {stats.map((stat) => (
            <StatCell key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .cn-stats {
          /* Two-up on phones, four-up from tablet width. */
          grid-template-columns: repeat(2, 1fr);
        }

        @media (min-width: 760px) {
          .cn-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  section: {
    position: 'relative',
    zIndex: 1,
  },
  inner: container,
  bar: {
    display: 'grid',
    gap: '2rem 1rem',
    padding: 'clamp(2rem, 1.4rem + 2vw, 3rem) clamp(1rem, 0.5rem + 2vw, 2rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.xl,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  cell: {
    position: 'relative',
    textAlign: 'center',
    paddingInline: '0.75rem',
  },
  value: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: 'clamp(2rem, 1.4rem + 2.6vw, 3.1rem)',
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    color: color.text,
    /* Numerals stay the same width as they tick, so the layout never jitters. */
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    marginTop: '0.7rem',
    fontSize: font.body,
    fontWeight: 600,
    color: color.text,
  },
  detail: {
    marginTop: '0.2rem',
    fontSize: '0.85rem',
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
