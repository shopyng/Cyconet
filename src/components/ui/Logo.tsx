'use client';

/**
 * The Cyconet mark, loaded from public/logo.png so the visible site, metadata
 * and public assets all point at the same brand file.
 */

import Image from 'next/image';

export default function Logo({
  size = 34,
  title,
}: {
  size?: number;
  /** Set only when the mark stands alone; omit when adjacent text names the brand. */
  title?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt={title ?? ''}
      width={size}
      height={size}
      aria-hidden={title ? undefined : true}
      priority={size >= 34}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 8,
        objectFit: 'cover',
      }}
    />
  );
}

/** Mark plus wordmark, used in the navbar and footer. */
export function Lockup({ size = 34 }: { size?: number }) {
  return (
    <span style={lockupStyles.root}>
      <Logo size={size} />
      <span style={lockupStyles.word}>Cyconet</span>
    </span>
  );
}

const lockupStyles = {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
  },
  word: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.3rem',
    fontWeight: 700,
    letterSpacing: '-0.035em',
    color: '#F5F5F7',
  },
} as const;
