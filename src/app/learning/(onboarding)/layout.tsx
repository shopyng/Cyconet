import { verifySession } from '@/lib/dal';
import { signOut } from '@/lib/auth-actions';
import { getTheme } from '@/lib/theme-actions';
import { radius } from '@/lib/theme';

/**
 * Chrome for the pre-payment screens.
 *
 * A separate route group from `(app)` on purpose. The `(app)` layout redirects
 * anyone without an ACTIVE enrolment to `/payment`; if this page lived under
 * that layout it would redirect to itself forever.
 *
 * The sidebar is deliberately absent. Every link in it leads somewhere this
 * student cannot go yet, and showing a nav of dead ends is worse than showing
 * none — so this is a single focused column with a way out.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();
  const theme = await getTheme();

  return (
    <div data-theme={theme} style={styles.page}>
      <header style={styles.bar}>
        <div style={styles.brand}>
          <span style={styles.mark} aria-hidden="true" />
          <span>Cyconet</span>
        </div>

        <div style={styles.right}>
          <span style={styles.email}>{user.email}</span>
          {/*
            A real form POST rather than a link: signing out mutates state, and
            a GET that logs you out can be fired by any <img> on the page.
          */}
          <form action={signOut}>
            <button type="submit" style={styles.signout}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main style={styles.main} id="content">
        {children}
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    padding: '0.85rem clamp(1rem, 0.5rem + 2vw, 2rem)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bgSoft)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.02rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  mark: {
    width: 10,
    height: 10,
    borderRadius: 3,
    background: 'var(--primary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  email: {
    fontSize: '0.85rem',
    color: 'var(--textMuted)',
  },
  signout: {
    padding: '0.4rem 0.8rem',
    border: '1px solid var(--border)',
    borderRadius: radius.sm,
    background: 'transparent',
    color: 'var(--textMuted)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    marginInline: 'auto',
    padding: 'clamp(1.5rem, 1rem + 2.5vw, 3rem) clamp(1rem, 0.5rem + 2vw, 2rem)',
  },
} satisfies Record<string, React.CSSProperties>;
