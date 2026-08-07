/**
 * Theme system: light and dark with a user-controlled toggle.
 *
 * The preference is stored server-side (eventually in the User table; for now,
 * a cookie bridges the gap until the schema is extended). The root layout reads
 * it and applies a data-theme attribute; CSS custom properties switch on that
 * attribute, and the toggle is a form that POSTs to a Server Action.
 *
 * Why server-side? So the first paint is correct — a client-only toggle flashes
 * the wrong theme during hydration, and localStorage cannot be read during SSR.
 */

// Light theme: professional LMS palette inspired by Coursera/Canvas/Moodle.
// Bright neutrals, strong hierarchy, indigo accent, legible at any zoom.
export const light = {
  bg: '#FFFFFF',
  bgSoft: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceHover: '#F1F3F5',
  // A third surface level, for panels sitting on top of a card (nested lists,
  // table headers, code blocks). Without it those all reuse surfaceHover and
  // hover state becomes indistinguishable from resting state.
  surfaceSunken: '#F8F9FA',
  border: '#DEE2E6',
  borderStrong: '#ADB5BD',

  text: '#212529',
  textMuted: '#495057',
  textFaint: '#6C757D',

  // Indigo accent — calm, professional, passes WCAG AAA on white.
  primary: '#4C6EF5',
  primaryHover: '#4263EB',
  primarySoft: '#EDF2FF',
  // Foreground for text sitting *on* a primary fill.
  onPrimary: '#FFFFFF',

  success: '#37B24D',
  successSoft: '#EBFBEE',
  warning: '#F59F00',
  warningSoft: '#FFF9DB',
  danger: '#F03E3E',
  dangerSoft: '#FFE3E3',

  /*
   * Elevation. Light UIs read depth from shadow, so these carry real spread;
   * the dark set below leans on surface lightness instead and keeps shadows
   * tight, because a large soft shadow on near-black is invisible.
   */
  shadowSm: '0 1px 2px rgba(16, 24, 40, 0.06)',
  shadowMd: '0 4px 12px rgba(16, 24, 40, 0.08), 0 1px 3px rgba(16, 24, 40, 0.06)',
  shadowLg: '0 16px 40px rgba(16, 24, 40, 0.12), 0 4px 10px rgba(16, 24, 40, 0.06)',
  ring: 'rgba(76, 110, 245, 0.35)',
  scrim: 'rgba(16, 24, 40, 0.45)',
};

// Dark theme: refined near-black with cyan/violet accents, continuous with the
// marketing site so the brand feels cohesive.
export const dark = {
  bg: '#0A0B0F',
  bgSoft: '#141518',
  surface: '#1C1D21',
  surfaceHover: '#25262B',
  surfaceSunken: '#141518',
  border: '#2C2E33',
  borderStrong: '#373A40',

  text: '#E9ECEF',
  textMuted: '#ADB5BD',
  textFaint: '#6C757D',

  primary: '#22D3EE', // cyan
  primaryHover: '#06B6D4',
  primarySoft: 'rgba(34, 211, 238, 0.1)',
  /*
   * Near-black, not white. Cyan is a light hue — white text on #22D3EE measures
   * about 1.9:1 and is unreadable. Dark ink on the same fill clears 9:1.
   */
  onPrimary: '#07080B',

  success: '#51CF66',
  successSoft: 'rgba(81, 207, 102, 0.1)',
  warning: '#FFC078',
  warningSoft: 'rgba(255, 192, 120, 0.1)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.1)',

  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  shadowMd: '0 4px 12px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 16px 40px rgba(0, 0, 0, 0.55), 0 4px 10px rgba(0, 0, 0, 0.35)',
  ring: 'rgba(34, 211, 238, 0.4)',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export type Theme = 'light' | 'dark';

/**
 * CSS custom properties for a theme, plus `color-scheme`.
 *
 * `color-scheme` is what tells the browser to render its own UI — scrollbars,
 * form control chrome, autofill backgrounds — to match. Without it the global
 * `color-scheme: dark` in globals.css leaves dark scrollbars and near-black
 * autofilled inputs sitting on the light palette.
 */
export function cssVars(theme: Theme): string {
  const palette = theme === 'light' ? light : dark;
  const vars = Object.entries(palette)
    .map(([key, val]) => `--${key}: ${val};`)
    .join(' ');
  return `${vars} color-scheme: ${theme};`;
}
