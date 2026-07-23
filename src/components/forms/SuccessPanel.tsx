'use client';

/**
 * Confirmation panel shown in place of a form once it submits successfully.
 *
 * It takes focus on mount: someone submitting from the bottom of a long form
 * with a keyboard or screen reader would otherwise get no signal that anything
 * happened, since the thing that changed is above where their focus sits.
 */

import { useEffect, useRef } from 'react';
import { Check } from '@/components/ui/Icons';
import { color, radius } from '@/lib/theme';

export default function SuccessPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div ref={ref} tabIndex={-1} style={styles.root}>
      <span style={styles.icon} aria-hidden="true">
        <Check size={20} />
      </span>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.body}>{message}</p>
    </div>
  );
}

const styles = {
  root: {
    padding: 'clamp(1.75rem, 1.3rem + 2vw, 2.75rem)',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    borderRadius: radius.lg,
    background: 'rgba(0, 229, 255, 0.07)',
    outline: 'none',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    background: 'rgba(0, 229, 255, 0.16)',
    color: color.cyan,
  },
  title: {
    marginTop: '1.1rem',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: color.text,
  },
  body: {
    marginTop: '0.6rem',
    maxWidth: '52ch',
    fontSize: '0.97rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
