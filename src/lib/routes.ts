/**
 * Route map.
 *
 * Centralised so links, the navbar, breadcrumbs and the sitemap cannot drift
 * apart — a broken internal link is an SEO problem, not just a UX one.
 *
 * Note that `/programs/cybersecurity` deliberately does not exist. The
 * cybersecurity track lives at `/cybersecurity-academy`, which is both the
 * flagship brand term and the stronger URL; a second page covering the same
 * course would compete with it for the same queries. next.config.ts issues a
 * permanent redirect from the /programs path so any inbound link still lands.
 */

import { programs } from './content';

export const routes = {
  home: '/',
  academy: '/cybersecurity-academy',
  solutions: '/solutions',
  hub: '/co-working-hub',
  apply: '/apply',
  program: (slug: string) => `/programs/${slug}`,
} as const;

/** The flagship track, which owns /cybersecurity-academy rather than /programs/*. */
export const FLAGSHIP_SLUG = 'cybersecurity';

/** Tracks that get a page under /programs/[slug]. */
export const programSlugs = programs
  .map((program) => program.id)
  .filter((id) => id !== FLAGSHIP_SLUG);

/** Canonical path for any track, flagship included. */
export function programHref(slug: string): string {
  return slug === FLAGSHIP_SLUG ? routes.academy : routes.program(slug);
}

/**
 * Primary navigation. Anchors are absolute (`/#programs`) so they still resolve
 * when the user is on a sub-page rather than the homepage.
 */
export const navLinks = [
  { label: 'Academy', href: routes.academy },
  { label: 'Programs', href: '/#programs' },
  { label: 'Solutions', href: routes.solutions },
  { label: 'Hub', href: routes.hub },
  { label: 'Contact', href: '/#contact' },
] as const;
