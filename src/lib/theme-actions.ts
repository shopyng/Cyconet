'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Theme } from './theme-toggle';

const COOKIE_NAME = 'theme';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/**
 * Read the user's theme preference from the cookie.
 *
 * Defaults to 'light' — professional LMS convention. The marketing site stays
 * dark (its own palette in theme.ts), but the dashboards default to the bright
 * clean look users expect from Canvas/Coursera/Moodle.
 */
export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return value === 'dark' ? 'dark' : 'light';
}

/**
 * Toggle the theme and return the user to the page they were on.
 *
 * A Server Action rather than client state: the tenant layout reads this cookie
 * during SSR, so a client-only toggle would render the previous theme on the
 * server and repaint after hydration — a visible flash on every navigation.
 *
 * `revalidatePath('/', 'layout')` re-renders the tree in place, which keeps the
 * user on the current page. A redirect would work too but would throw away the
 * scroll position and any open UI state.
 */
export async function toggleTheme(): Promise<void> {
  const current = await getTheme();
  const next: Theme = current === 'light' ? 'dark' : 'light';

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, next, {
    // Readable by the server only — nothing on the client needs it, and the
    // layout is what applies the palette.
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  revalidatePath('/', 'layout');
}
