import { headers } from 'next/headers';
import { verifySession } from '@/lib/dal';
import { signOut } from '@/lib/auth-actions';
import { getTheme, toggleTheme } from '@/lib/theme-actions';
import Shell, { type NavItem } from '@/components/app/Shell';

/**
 * Gate for every signed-in student page.
 *
 * Lives in the `(app)` route group so it wraps the hub but NOT /learning/login
 * — a session check on the login page would redirect it to itself forever.
 * The parentheses keep the segment out of the URL, so these pages still live at
 * /learning/courses and so on.
 */

const NAV: readonly NavItem[] = [
  { href: '/', label: 'Dashboard', exact: true },
  { href: '/courses', label: 'Courses' },
  { href: '/exams', label: 'Exams' },
  { href: '/projects', label: 'Projects' },
  { href: '/timetable', label: 'Timetable' },
  { href: '/certificate', label: 'Certificate' },
];

export default async function LearningAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  /*
   * The active nav item is resolved on the server so it is correct in the first
   * paint. `usePathname()` would work too, but only after hydration — the
   * sidebar would briefly render with nothing selected.
   *
   * x-pathname is set by the proxy; it survives the rewrite, whereas
   * nextUrl.pathname inside the app already shows the rewritten /learning/... form.
   */
  const pathname = (await headers()).get('x-pathname') ?? '/';
  const theme = await getTheme();

  return (
    <Shell
      title="Cyconet Learning"
      items={NAV}
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
