/**
 * Inline SVG icon set.
 *
 * Hand-drawn on a 24×24 grid with a consistent 1.6 stroke so the whole set
 * reads as one family. Every icon inherits `currentColor`, which lets callers
 * tint them by setting `color` on a wrapper. Icons here are decorative — the
 * surrounding text always carries the meaning — so they are hidden from
 * assistive tech at the point of use.
 *
 * No hooks, so this module stays usable from Server Components.
 */

export type IconName =
  | 'shield'
  | 'code'
  | 'chart'
  | 'spark'
  | 'cloud'
  | 'build'
  | 'mentor'
  | 'career'
  | 'cohort'
  | 'hub';

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

const PATHS: Record<IconName, React.ReactNode> = {
  /* Cybersecurity — shield with a keyhole. */
  shield: (
    <>
      <path d="M12 3 4.5 6v5.6c0 4.4 3 8.1 7.5 9.4 4.5-1.3 7.5-5 7.5-9.4V6L12 3Z" />
      <circle cx="12" cy="11" r="1.9" />
      <path d="M12 12.9V15.5" />
    </>
  ),
  /* Software engineering — angle brackets. */
  code: (
    <>
      <path d="m8.5 8.5-4 3.5 4 3.5" />
      <path d="m15.5 8.5 4 3.5-4 3.5" />
      <path d="m13.5 5-3 14" />
    </>
  ),
  /* Data science — bar chart with a trend line. */
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M6.5 20v-5.5" />
      <path d="M11 20v-9" />
      <path d="M15.5 20v-3.5" />
      <path d="M20 20V8" />
      <path d="m5 10 4.5-4 4 3L20 3.5" />
    </>
  ),
  /* AI / ML — four-point spark. */
  spark: (
    <>
      <path d="M12 3c.6 4.2 2.2 5.8 6.4 6.4-4.2.6-5.8 2.2-6.4 6.4-.6-4.2-2.2-5.8-6.4-6.4C9.8 8.8 11.4 7.2 12 3Z" />
      <path d="M18 16c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z" />
    </>
  ),
  /* Cloud computing — cloud with a sync arrow. */
  cloud: (
    <>
      <path d="M7 18h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.2A3.9 3.9 0 0 0 7 18Z" />
      <path d="M12 15.5v-4" />
      <path d="m10 13.5 2-2 2 2" />
    </>
  ),
  /* Project-based learning — layered blocks. */
  build: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </>
  ),
  /* Mentorship — two figures. */
  mentor: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.2a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
  /* Careers — briefcase. */
  career: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 12.5h17" />
      <path d="M11 12.5h2" />
    </>
  ),
  /* Cohort — group of nodes. */
  cohort: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="5.5" cy="17" r="2.5" />
      <circle cx="18.5" cy="17" r="2.5" />
      <path d="M10.2 7.8 7.3 14.9" />
      <path d="m13.8 7.8 2.9 7.1" />
      <path d="M8 17h8" />
    </>
  ),
  /* Co-working hub — building with a signal. */
  hub: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20V9.5l6-3.5 6 3.5V20" />
      <path d="M10 20v-4h4v4" />
      <path d="M10 12h.01M14 12h.01" />
    </>
  ),
};

export function Icon({ name, size = 22, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Standalone UI glyphs
 * ------------------------------------------------------------------ */

export function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h13" />
      <path d="m12.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function Check({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function Chevron({ dir = 'right', size = 18 }: { dir?: 'left' | 'right'; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function Quote({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.4 5.5C6.2 6.9 4 10 4 13.6 4 16.6 5.8 18.5 8.2 18.5c2 0 3.6-1.5 3.6-3.5 0-1.9-1.4-3.3-3.2-3.3-.4 0-.8.1-1 .2.5-1.9 2-3.5 3.8-4.4l-2-2ZM19 5.5c-3.2 1.4-5.4 4.5-5.4 8.1 0 3 1.8 4.9 4.2 4.9 2 0 3.6-1.5 3.6-3.5 0-1.9-1.4-3.3-3.2-3.3-.4 0-.8.1-1 .2.5-1.9 2-3.5 3.8-4.4l-2-2Z" />
    </svg>
  );
}

export function MenuIcon({ open, size = 22 }: { open: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {open ? (
        <>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Social glyphs — filled, drawn from each brand's official outline
 * ------------------------------------------------------------------ */

export type SocialName = 'x' | 'linkedin' | 'github' | 'youtube';

const SOCIAL_PATHS: Record<SocialName, string> = {
  x: 'M18.9 2H22l-7.1 8.1L23.2 22h-6.5l-5.1-6.7L5.8 22H2.7l7.6-8.7L1.3 2h6.7l4.6 6.1L18.9 2Zm-1.1 18.1h1.7L7.3 3.8H5.5l12.3 16.3Z',
  linkedin:
    'M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6.5 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C21.2 8.75 22 11 22 14.1V21h-4v-6.1c0-1.45-.03-3.3-2.02-3.3-2.02 0-2.33 1.57-2.33 3.2V21h-4V9Z',
  github:
    'M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5.01 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.06 10.06 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z',
  youtube:
    'M21.6 7.2a2.5 2.5 0 0 0-1.76-1.78C18.28 5 12 5 12 5s-6.28 0-7.84.42A2.5 2.5 0 0 0 2.4 7.2C2 8.78 2 12 2 12s0 3.22.4 4.8a2.5 2.5 0 0 0 1.76 1.78C5.72 19 12 19 12 19s6.28 0 7.84-.42a2.5 2.5 0 0 0 1.76-1.78C22 15.22 22 12 22 12s0-3.22-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z',
};

export function SocialIcon({ name, size = 18 }: { name: SocialName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={SOCIAL_PATHS[name]} />
    </svg>
  );
}
