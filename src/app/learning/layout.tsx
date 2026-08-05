import type { Metadata } from 'next';

/**
 * Tenant shell for learning.cyconet.ng.
 *
 * Deliberately does NOT check the session. The gated pages live under the
 * `(app)` route group, which has its own layout doing that work — because this
 * layout also wraps /learning/login, and gating here would redirect the login
 * page to itself forever.
 *
 * The marketing Navbar/Footer are suppressed for this tenant in the root
 * layout, which reads the tenant from the proxy's header — see src/app/layout.tsx.
 */

export const metadata: Metadata = {
  title: {
    default: 'Learning Hub',
    template: '%s · Cyconet Learning',
  },
  // The hub is behind a login; keeping it out of the index avoids publishing
  // an endless list of URLs that every crawler will only ever get a 302 from.
  robots: { index: false, follow: false },
};

export default function LearningTenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
