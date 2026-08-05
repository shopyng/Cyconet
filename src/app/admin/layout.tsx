import type { Metadata } from 'next';

/**
 * Tenant shell for admin.cyconet.ng.
 *
 * Like the learning side, the session check lives in the `(app)` group rather
 * than here, so /admin/login is reachable without being redirected to itself.
 *
 * The marketing Navbar/Footer are suppressed for this tenant in the root
 * layout, which reads the tenant from the proxy's header — see src/app/layout.tsx.
 */

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · Cyconet Admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminTenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
