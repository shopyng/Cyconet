import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/content';
import { routes, programSlugs } from '@/lib/routes';

/**
 * Sitemap, derived from the route map so it cannot fall out of step with the
 * pages that actually exist.
 *
 * Priorities are relative, not absolute: the homepage and the flagship
 * cybersecurity page lead, the other arms follow, then individual tracks.
 * `/programs/cybersecurity` is absent by design — it permanently redirects to
 * /cybersecurity-academy, and listing a redirect wastes crawl budget.
 *
 * Section anchors are also omitted: a fragment is not a separate document.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-07-23');

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}${routes.academy}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${routes.solutions}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${routes.hub}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${routes.register}`,
      lastModified,
      changeFrequency: 'monthly',
      // Ranked above /apply: this is now the primary way a student enrols.
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${routes.apply}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...programSlugs.map((slug) => ({
      url: `${SITE_URL}${routes.program(slug)}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
