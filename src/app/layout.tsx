import type { Metadata, Viewport } from 'next';
import StyledJsxRegistry from './registry';
import { SITE_URL, brand } from '@/lib/content';
import { jsonLdScript, keywords } from '@/lib/seo';
import './globals.css';

/**
 * Font stacks are defined in globals.css rather than fetched from Google at
 * build time. That keeps deployment deterministic in restricted/serverless
 * environments where outbound font requests may fail.
 */

/**
 * The title leads with "Cybersecurity Academy" — the highest-intent term — then
 * names the other two arms so the homepage can rank for the agency and the
 * co-working hub without a separate landing page for each.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      'Cyconet — Cybersecurity Academy, Tech School, Solutions Agency & Co-Working Hub',
    template: '%s | Cyconet',
  },
  description: brand.metaDescription,
  keywords,
  applicationName: brand.name,
  authors: [{ name: brand.name, url: SITE_URL }],
  creator: brand.name,
  publisher: brand.name,
  category: 'education',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: brand.name,
    url: '/',
    title: 'Cyconet — Cybersecurity Academy & Tech School in Ibadan',
    description: brand.metaDescription,
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cyconet — Cybersecurity Academy & Tech School in Ibadan',
    description: brand.metaDescription,
    creator: '@cyconet',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/logo.png' }],
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0B0F',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * `data-scroll-behavior="smooth"` is required as of Next 16: the router no
     * longer overrides CSS smooth scrolling during navigation unless this
     * attribute is present, which would otherwise make route changes animate a
     * long scroll instead of jumping to the top.
     */
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
    >
      <head>
        {/*
          Scroll-reveal starts elements at opacity 0 and relies on an
          IntersectionObserver to show them. If scripting is unavailable that
          observer never runs, so this forces every revealed element visible —
          the content must never be hidden by a script that did not execute.
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        {/* Structured data describing all three arms — see src/lib/seo.ts. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript() }}
        />
        {/*
          Only the document shell lives here, so it stays shared by all three
          tenants. The public site's Navbar/Footer are in (marketing)/layout.tsx
          and the dashboards bring their own chrome via Shell — neither inherits
          the other's furniture.
        */}
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
