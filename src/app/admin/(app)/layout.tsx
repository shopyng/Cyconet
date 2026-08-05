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
  { href: '/', label: 'Overview', exact: true },
  { href: '/applications', label: 'Applications' },
  { href: '/students', label: 'Students' },
  { href: '/submissions', label: 'Project review' },
  { href: '/curriculum', label: 'Curriculum' },
  { href: '/certificates', label: 'Certificates' },
  { href: '/timetable', label: 'Timetable' },
];

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdmin();
  const pathname = (await headers()).get('x-pathname') ?? '/';

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
