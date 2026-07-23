'use client';

/**
 * Scroll-reveal wrapper.
 *
 * Fades and lifts its children into place the first time they enter the
 * viewport, then disconnects the observer — the animation never replays, so
 * scrolling back up stays still rather than flickering.
 *
 * Two failure modes are handled deliberately:
 *
 *  - **Reduced motion.** If the OS asks for less motion we mark the content
 *    shown immediately and skip the transform entirely.
 *  - **No JavaScript.** The hidden state is expressed with `data-reveal`, and
 *    the root layout ships a <noscript> rule that forces those elements
 *    visible. Content is never permanently hidden by a script that failed.
 *
 * Only `opacity` and `transform` are animated, both compositor-friendly, so
 * long lists of revealing cards do not cause layout thrash.
 */

import { useEffect, useRef, useState } from 'react';
import { ease } from '@/lib/theme';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

type RevealProps = {
  children: React.ReactNode;
  /** Stagger, in milliseconds — use small increments across a grid. */
  delay?: number;
  /** Travel distance in px. Set 0 for a pure fade. */
  y?: number;
  as?: 'div' | 'li' | 'section' | 'article' | 'span';
  style?: React.CSSProperties;
  className?: string;
};

export default function Reveal({
  children,
  delay = 0,
  y = 20,
  as: Tag = 'div',
  style,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  /*
   * When motion is reduced there is nothing to observe — the content is shown
   * outright. Deriving `shown` below rather than pushing `true` into state from
   * the effect keeps this to a single render pass.
   */
  const shown = reducedMotion || inView;

  useEffect(() => {
    if (reducedMotion) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      // Fires slightly before the element is fully on screen, so the animation
      // is already underway by the time the user's eye reaches it.
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <Tag
      // One ref type covers every allowed tag; the cast keeps the union simple.
      ref={ref as React.Ref<never>}
      data-reveal={shown ? 'shown' : 'hidden'}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 720ms ${ease.out} ${delay}ms, transform 720ms ${ease.out} ${delay}ms`,
        willChange: shown ? undefined : 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
