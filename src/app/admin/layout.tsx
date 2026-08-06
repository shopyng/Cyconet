import type { Metadata } from 'next';
import { getTheme } from '@/lib/theme-actions';
import { cssVars } from '@/lib/theme-toggle';

/**
 * Tenant shell for admin.cyconet.ng.
 *
 * Like the learning side, the session check lives in the `(app)` group rather
 * than here, so /admin/login is reachable without being redirected to itself.
 *
 * The marketing Navbar/Footer are suppressed for this tenant in the root
 * layout, which reads the tenant from the proxy's header — see src/app/layout.tsx.
 *
 * Applies the theme preference from the cookie so the first paint is correct.
 */

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · Cyconet Admin',
  },
  robots: { index: false, follow: false },
};

export default async function AdminTenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getTheme();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars(theme)} }` }} />
      <div data-theme={theme}>{children}</div>
    </>
  );
}
