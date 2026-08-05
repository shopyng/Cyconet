import { headers } from 'next/headers';
import { verifyAdmin } from '@/lib/dal';
import { signOut } from '@/lib/auth-actions';
import Shell, { type NavItem } from '@/components/app/Shell';

/**
 * Gate for every staff page.
 *
 * `verifyAdmin()` requires both a session and the ADMIN role — a signed-in
 * student who reaches an /admin URL is sent to their own hub rather than shown
 * a login form they are already past.
 */

const NAV: readonly NavItem[] = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/students', label: 'Students' },
  { href: '/admin/submissions', label: 'Project review' },
  { href: '/admin/curriculum', label: 'Curriculum' },
  { href: '/admin/certificates', label: 'Certificates' },
  { href: '/admin/timetable', label: 'Timetable' },
];

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdmin();
  const pathname = (await headers()).get('x-pathname') ?? '/admin';

  return (
    <Shell
      title="Cyconet Admin"
      items={NAV}
      pathname={pathname}
      user={{ name: user.name, email: user.email }}
      onSignOut={signOut}
    >
      {children}
    </Shell>
  );
}
