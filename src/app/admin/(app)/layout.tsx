import { headers } from 'next/headers';
import { verifyAdmin, pendingApplications, pendingSubmissions } from '@/lib/dal';
import { signOut } from '@/lib/auth-actions';
import { getTheme, toggleTheme } from '@/lib/theme-actions';
import Shell, { type NavItem } from '@/components/app/Shell';

/**
 * Gate for every staff page.
 *
 * `verifyAdmin()` requires both a session and the ADMIN role — a signed-in
 * student who reaches an /admin URL is sent to their own hub rather than shown
 * a login form they are already past.
 */

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdmin();
  const pathname = (await headers()).get('x-pathname') ?? '/';
  const theme = await getTheme();

  /*
   * Queue sizes surface in the sidebar so staff can see what needs attention
   * without opening each screen. Both reads are already memoised by the DAL's
   * `cache()`, so a page that also renders these lists pays for one query.
   */
  const [applications, submissions] = await Promise.all([
    pendingApplications(),
    pendingSubmissions(),
  ]);

  const nav: readonly NavItem[] = [
    { href: '/', label: 'Overview', exact: true },
    { href: '/applications', label: 'Applications', badge: applications.length },
    { href: '/students', label: 'Students' },
    { href: '/submissions', label: 'Project review', badge: submissions.length },
    { href: '/curriculum', label: 'Curriculum' },
    { href: '/certificates', label: 'Certificates' },
    { href: '/timetable', label: 'Timetable' },
    { href: '/ops', label: 'Ops' },
  ];

  return (
    <Shell
      title="Cyconet Admin"
      items={nav}
      pathname={pathname}
      user={{ name: user.name, email: user.email }}
      onSignOut={signOut}
      onToggleTheme={toggleTheme}
      theme={theme}
    >
      {children}
    </Shell>
  );
}
