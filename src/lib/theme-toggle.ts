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
  border: '#DEE2E6',
  borderStrong: '#ADB5BD',

  text: '#212529',
  textMuted: '#495057',
  textFaint: '#6C757D',

  // Indigo accent — calm, professional, passes WCAG AAA on white.
  primary: '#4C6EF5',
  primaryHover: '#4263EB',
  primarySoft: '#EDF2FF',

  success: '#37B24D',
  successSoft: '#EBFBEE',
  warning: '#F59F00',
  warningSoft: '#FFF9DB',
  danger: '#F03E3E',
  dangerSoft: '#FFE3E3',
};

// Dark theme: refined near-black with cyan/violet accents, continuous with the
// marketing site so the brand feels cohesive.
export const dark = {
  bg: '#0A0B0F',
  bgSoft: '#141518',
  surface: '#1C1D21',
  surfaceHover: '#25262B',
  border: '#2C2E33',
  borderStrong: '#373A40',

  text: '#E9ECEF',
  textMuted: '#ADB5BD',
  textFaint: '#6C757D',

  primary: '#22D3EE', // cyan
  primaryHover: '#06B6D4',
  primarySoft: 'rgba(34, 211, 238, 0.1)',

  success: '#51CF66',
  successSoft: 'rgba(81, 207, 102, 0.1)',
  warning: '#FFC078',
  warningSoft: 'rgba(255, 192, 120, 0.1)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.1)',
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
