'use client';

/**
 * Shell for the two signed-in tenants (learning + admin).
 *
 * One component serves both because the chrome is identical — a sidebar, a
 * header carrying the signed-in identity, and a content column. Only the nav
 * items and the accent differ, and both arrive as props.
 *
 * Follows the same styling split as the rest of the codebase: geometry in the
 * `styles` object, hover/active skin in styled-jsx (an inline background can
 * never be overridden by a stylesheet `:hover` rule).
 */

import { useState } from 'react';
import { color, ease, font, radius } from '@/lib/theme';

export type NavItem = {
  href: string;
  label: string;
  /** Match child routes too, e.g. /learning/courses/abc under /learning/courses. */
  exact?: boolean;
};

export default function Shell({
  title,
  items,
  pathname,
  user,
  onSignOut,
  children,
}: {
  /** Tenant name shown in the sidebar head. */
  title: string;
  items: readonly NavItem[];
  /** Current path, passed from the server layout so nav state is correct on first paint. */
  pathname: string;
  user: { name: string; email: string };
  /** Server Action for signing out. */
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="shell">
      <aside className="sidebar" data-open={open}>
        <div style={styles.brand}>
          <span style={styles.brandMark} aria-hidden="true" />
          <span>{title}</span>
        </div>

        <nav aria-label="Section">
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="nav-link"
                  aria-current={isActive(item) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div style={styles.userBlock}>
          <div style={styles.userName}>{user.name}</div>
          <div style={styles.userEmail}>{user.email}</div>
          {/*
            A real form POST rather than a link: signing out mutates state, and
            a GET that logs you out can be fired by any <img> tag on the page.
            The action is passed in from the server layout.
          */}
          <form action={onSignOut} style={{ marginTop: '0.75rem' }}>
            <button type="submit" className="signout">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="column">
        <header className="topbar">
          <button
            type="button"
            className="menu"
            aria-expanded={open}
            aria-controls="shell-sidebar"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
          <span style={styles.topbarTitle}>{title}</span>
        </header>

        <main className="content">{children}</main>
      </div>

      <style jsx>{`
        .shell {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
          background: ${color.bg};
          color: ${color.text};
        }

        .sidebar {
          display: none;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem 1.25rem;
          border-right: 1px solid ${color.border};
          background: ${color.bgSoft};
        }

        .sidebar[data-open='true'] {
          display: flex;
        }

        .sidebar ul {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link {
          display: block;
          padding: 0.6rem 0.75rem;
          border-radius: ${radius.sm}px;
          color: ${color.textMuted};
          font-size: 0.94rem;
          text-decoration: none;
          transition:
            background 180ms ${ease.out},
            color 180ms ${ease.out};
        }

        .nav-link:hover {
          background: ${color.surfaceHover};
          color: ${color.text};
        }

        .nav-link[aria-current='page'] {
          background: ${color.surface};
          color: ${color.cyan};
          box-shadow: inset 2px 0 0 ${color.cyan};
        }

        .signout {
          padding: 0.4rem 0.7rem;
          border: 1px solid ${color.border};
          border-radius: ${radius.sm}px;
          background: transparent;
          color: ${color.textMuted};
          font-size: 0.85rem;
          cursor: pointer;
          transition:
            border-color 180ms ${ease.out},
            color 180ms ${ease.out};
        }

        .signout:hover {
          border-color: ${color.borderStrong};
          color: ${color.text};
        }

        .column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .topbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid ${color.border};
          background: ${color.bgSoft};
        }

        .menu {
          padding: 0.45rem 0.8rem;
          border: 1px solid ${color.border};
          border-radius: ${radius.sm}px;
          background: ${color.surface};
          color: ${color.text};
          font-size: 0.85rem;
          cursor: pointer;
        }

        .content {
          flex: 1;
          padding: clamp(1.25rem, 0.6rem + 2.6vw, 2.5rem);
        }

        /* Sidebar becomes permanent furniture once there is room for it. */
        @media (min-width: 900px) {
          .shell {
            grid-template-columns: 260px 1fr;
          }

          .sidebar {
            display: flex;
            position: sticky;
            top: 0;
            height: 100vh;
          }

          .topbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  brandMark: {
    width: 10,
    height: 10,
    borderRadius: 3,
    background: `linear-gradient(120deg, ${color.cyan}, ${color.violet})`,
  },
  userBlock: {
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: `1px solid ${color.border}`,
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  userEmail: {
    fontSize: font.eyebrow,
    color: color.textFaint,
    overflowWrap: 'anywhere',
  },
  topbarTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontWeight: 700,
  },
} satisfies Record<string, React.CSSProperties>;
