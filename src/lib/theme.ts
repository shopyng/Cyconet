/**
 * Cyconet design tokens.
 *
 * Every component imports from here so the system stays coherent. Values are
 * plain serializable data, which keeps this module usable from both Server and
 * Client Components.
 *
 * Contrast notes (WCAG 2.1, measured against `color.bg` #0A0B0F):
 *   text        #F5F5F7  →  17.9:1  AAA
 *   textMuted   #8A8F98  →   6.0:1  AA  (safe for body copy)
 *   textFaint   #7E8490  →   5.2:1  AA  (5.0:1 on elevated card surfaces)
 *   cyan        #00E5FF  →  12.8:1  AAA
 *   violet      #7C3AED  →   3.5:1  large text / non-text only — never body copy
 *
 * Because violet fails AA at body sizes, `gradient.brand` is reserved for
 * decoration and oversized display headings, while `gradient.cta` stops at a
 * lighter periwinkle so near-black ink clears 6.6:1 across the whole button.
 */

export const color = {
  bg: '#0A0B0F',
  bgSoft: '#0D0F15',
  bgElevated: '#101218',

  text: '#F5F5F7',
  textMuted: '#8A8F98',
  /*
   * Was #5C616B (≈3.1:1), which axe flagged: it fails AA for the small
   * uppercase labels it is used on — section eyebrows, footer legal text and
   * input placeholders. An intermediate #767C87 still measured 4.45:1 on the
   * elevated card surface, which composites to #111216 rather than the page
   * background, so this value carries real headroom (5.0:1 on cards, 5.2:1 on
   * the page) instead of scraping the threshold.
   *
   * The consequence is that textFaint now sits close to textMuted. That is
   * accepted deliberately: the labels using it are already differentiated by
   * size, weight, letter-spacing and casing, and legibility outranks a wider
   * tonal step between two greys.
   */
  textFaint: '#7E8490',
  ink: '#07080B', // near-black, for text sitting on bright gradients

  cyan: '#00E5FF',
  cyanSoft: '#6EE7F9',
  violet: '#7C3AED',
  violetSoft: '#818CF8',

  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceHover: 'rgba(255, 255, 255, 0.055)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
} as const;

export const gradient = {
  /** Decorative + oversized display headings only. */
  brand: `linear-gradient(120deg, ${color.cyan} 0%, ${color.violet} 100%)`,
  /** Accessible button fill — near-black ink stays ≥6.6:1 across every stop. */
  cta: `linear-gradient(120deg, ${color.cyan} 0%, ${color.cyanSoft} 38%, ${color.violetSoft} 100%)`,
  /** Hairline top-edge highlight used on glass cards. */
  hairline:
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
} as const;

/** Frosted card treatment, spread onto a style object. */
export const glass = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.32)',
  lift: '0 2px 4px rgba(0,0,0,0.4), 0 24px 60px rgba(0,0,0,0.45)',
  glowCyan: `0 0 0 1px rgba(0,229,255,0.24), 0 12px 40px rgba(0,229,255,0.18)`,
  glowCta: '0 8px 30px rgba(0, 229, 255, 0.28), 0 4px 12px rgba(124, 58, 237, 0.24)',
} as const;

/**
 * Fluid type scale. `clamp()` handles the mobile→desktop ramp without media
 * queries, which matters here because inline styles can't express breakpoints.
 */
export const font = {
  display1: 'clamp(2.75rem, 1.6rem + 5.6vw, 5.75rem)',
  display2: 'clamp(2.1rem, 1.35rem + 3.4vw, 3.6rem)',
  h3: 'clamp(1.25rem, 1.1rem + 0.7vw, 1.6rem)',
  bodyLg: 'clamp(1.02rem, 0.97rem + 0.28vw, 1.2rem)',
  body: '1rem',
  small: '0.9rem',
  eyebrow: '0.75rem',
} as const;

export const layout = {
  /** Content width used by every section for a consistent vertical spine. */
  maxWidth: 1200,
  gutter: 'clamp(1.25rem, 0.6rem + 2.6vw, 2.5rem)',
  sectionY: 'clamp(4.5rem, 3rem + 6vw, 8rem)',
} as const;

export const ease = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

/** Shared container style — centers content at `layout.maxWidth`. */
export const container = {
  width: '100%',
  maxWidth: layout.maxWidth,
  marginInline: 'auto',
  paddingInline: layout.gutter,
} as const;

/** Visually hidden, but still announced by screen readers. */
export const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
