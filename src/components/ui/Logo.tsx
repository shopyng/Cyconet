'use client';

/**
 * The Cyconet mark: an open "C" ring enclosing a hub-and-spoke network —
 * literally *cyco* + *net*.
 *
 * Redrawn as vector rather than shipped as a raster so it stays crisp at every
 * size, costs no network request, and can carry the brand gradient on the dark
 * theme. The source logo is flat teal (#1B6E8C); that value is kept in
 * `public/cyconet-logo.svg` for favicons, OG images and anywhere the mark needs
 * to appear on a light background.
 *
 * `useId` scopes the gradient's id per instance — the mark renders in both the
 * navbar and the footer, and duplicate SVG ids would otherwise collide.
 */

import { useId } from 'react';

/** Hub-and-spoke node ring: 8 nodes at 45° intervals, radius 28 from centre. */
const NODES = [
  { cx: 88, cy: 60, r: 8 }, // E
  { cx: 79.8, cy: 40.2, r: 6.4 }, // NE
  { cx: 60, cy: 32, r: 8 }, // N
  { cx: 40.2, cy: 40.2, r: 6.4 }, // NW
  { cx: 32, cy: 60, r: 8 }, // W
  { cx: 40.2, cy: 79.8, r: 6.4 }, // SW
  { cx: 60, cy: 88, r: 8 }, // S
  { cx: 79.8, cy: 79.8, r: 6.4 }, // SE
] as const;

export default function Logo({
  size = 34,
  title,
}: {
  size?: number;
  /** Set only when the mark stands alone; omit when adjacent text names the brand. */
  title?: string;
}) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <g stroke={`url(#${gradientId})`} fill={`url(#${gradientId})`}>
        {/* Outer ring, broken on the right to form the C. */}
        <path
          d="M 110.75 41.53 A 54 54 0 1 1 110.75 78.47"
          fill="none"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {/* Inner hairline ring. */}
        <circle cx="60" cy="60" r="44" fill="none" strokeWidth={3} />

        {/* Spokes, drawn first so the nodes sit on top of the line ends. */}
        {NODES.map((node) => (
          <line
            key={`spoke-${node.cx}-${node.cy}`}
            x1="60"
            y1="60"
            x2={node.cx}
            y2={node.cy}
            strokeWidth={1.6}
          />
        ))}

        {NODES.map((node) => (
          <circle
            key={`node-${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            stroke="none"
          />
        ))}

        {/* Central hub. */}
        <circle cx="60" cy="60" r="12.5" stroke="none" />
      </g>
    </svg>
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
