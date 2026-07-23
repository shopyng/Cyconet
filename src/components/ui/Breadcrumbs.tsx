/**
 * Breadcrumb trail for sub-pages.
 *
 * Renders as an ordered list inside a labelled <nav>, with the current page
 * marked `aria-current="page"` and *not* linked — a link to where you already
 * are is noise for keyboard and screen-reader users.
 *
 * The matching BreadcrumbList structured data is emitted by the page itself
 * (see `breadcrumbJsonLd` in src/lib/seo.ts), which is what lets search results
 * show the trail instead of a bare URL.
 *
 * No hooks or styled-jsx, so this stays a Server Component.
 */

import { color, container, radius } from '@/lib/theme';

export type Crumb = { name: string; path: string };

export default function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={styles.wrap}>
      <ol style={styles.list}>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} style={styles.item}>
              {isLast ? (
                <span aria-current="page" style={styles.current}>
                  {crumb.name}
                </span>
              ) : (
                <>
                  <a href={crumb.path} style={styles.link}>
                    {crumb.name}
                  </a>
                  <span aria-hidden="true" style={styles.sep}>
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const styles = {
  wrap: {
    ...container,
    paddingTop: '1.75rem',
  },
  list: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
  },
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  link: {
    color: color.textMuted,
    borderRadius: radius.sm,
    textDecoration: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.18)',
    textUnderlineOffset: 3,
  },
  sep: {
    color: color.textFaint,
  },
  current: {
    color: color.text,
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>;
