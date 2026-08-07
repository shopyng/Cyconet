'use client';

/**
 * Shell for the two signed-in tenants (learning + admin).
 *
 * One component serves both because the chrome is identical — a sidebar, a
 * header carrying the signed-in identity, and a content column. Only the nav
 * items and the title differ, and both arrive as props.
 *
 * Colours come from CSS custom properties set by the tenant layout from the
 * user's theme cookie, so light and dark are one codepath rather than two
 * parallel style objects. Geometry sits in styled-jsx alongside the hover and
 * active skins — an inline background can never be overridden by a `:hover` rule.
 */

import { useState } from 'react';
import { ease, radius } from '@/lib/theme';

export type NavItem = {
  href: string;
  label: string;
  /** Match child routes too, e.g. /courses/abc under /courses. */
  exact?: boolean;
  /** Optional count badge — pending applications, unreviewed submissions, etc. */
  badge?: number;
};

/** Initials for the avatar, e.g. "Ada Obi" → "AO". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Shell({
  title,
  items,
  pathname,
  user,
  onSignOut,
  onToggleTheme,
  theme,
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
  /** Server Action that flips the theme cookie. */
  onToggleTheme: () => Promise<void>;
  theme: 'light' | 'dark';
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const active = items.find(isActive);

  return (
    <div className="shell">
      {/*
        The sidebar is a long list of repeated links on every page, so keyboard
        and screen-reader users need a way straight past it to the content.
      */}
      <a href="#content" className="skip">
        Skip to content
      </a>

      {/* Closes the drawer on mobile; never rendered at desktop widths. */}
      <div
        className="scrim"
        data-open={open}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside className="sidebar" id="shell-sidebar" data-open={open}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
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
                  <span>{item.label}</span>
                  {item.badge ? <span className="badge">{item.badge}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="user-block">
          <div className="user-row">
            <span className="avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="user-meta">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </span>
          </div>
          {/*
            A real form POST rather than a link: signing out mutates state, and
            a GET that logs you out can be fired by any <img> tag on the page.
            The action is passed in from the server layout.
          */}
          <form action={onSignOut}>
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
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>

          {/*
            Names the section you are in — the sidebar that would otherwise say so
            is hidden at this width.
          */}
          <span className="topbar-title">{active?.label ?? title}</span>

          {/*
            Theme toggle posts to a Server Action so the cookie is set before the
            next render. A client-side toggle would flash the previous theme on
            every navigation until hydration caught up.
          */}
          <form action={onToggleTheme} className="theme-form">
            <button type="submit" className="theme-toggle">
              <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
              <span className="sr-only">
                Switch to {theme === 'light' ? 'dark' : 'light'} theme
              </span>
            </button>
          </form>
        </header>

        <main className="content" id="content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .shell {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
        }

        .skip {
          position: absolute;
          left: -9999px;
          z-index: 100;
        }

        .skip:focus {
          left: 1rem;
          top: 1rem;
          padding: 0.6rem 1rem;
          border-radius: ${radius.sm}px;
          background: var(--primary);
          /*
           * Not #fff. The dark theme's primary is cyan, and white on it measures
           * about 1.9:1 — unreadable. --onPrimary is near-black there and white
           * on the light theme's indigo, so one rule stays legible in both.
           */
          color: var(--onPrimary);
        }

        .scrim {
          display: none;
        }

        .sidebar {
          display: none;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.25rem 1rem;
          border-right: 1px solid var(--border);
          background: var(--bgSoft);
        }

        .sidebar[data-open='true'] {
          display: flex;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.25rem 0.5rem 0;
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: 1.02rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .brand-mark {
          width: 10px;
          height: 10px;
          flex: none;
          border-radius: 3px;
          background: var(--primary);
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          border-radius: ${radius.sm}px;
          color: var(--textMuted);
          font-size: 0.94rem;
          font-weight: 500;
          text-decoration: none;
          transition:
            background 160ms ${ease.out},
            color 160ms ${ease.out};
        }

        .nav-link:hover {
          background: var(--surfaceHover);
          color: var(--text);
        }

        .nav-link[aria-current='page'] {
          background: var(--primarySoft);
          color: var(--primary);
          font-weight: 600;
        }

        .badge {
          min-width: 1.35rem;
          padding: 0.05rem 0.4rem;
          border-radius: 999px;
          background: var(--primary);
          color: var(--onPrimary);
          font-size: 0.72rem;
          font-weight: 700;
          text-align: center;
        }

        .user-block {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 0;
        }

        .avatar {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: none;
          border-radius: 999px;
          background: var(--primarySoft);
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 700;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 0.88rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--textFaint);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .signout {
          width: 100%;
          padding: 0.45rem 0.7rem;
          border: 1px solid var(--border);
          border-radius: ${radius.sm}px;
          background: transparent;
          color: var(--textMuted);
          font-size: 0.85rem;
          cursor: pointer;
          transition:
            border-color 160ms ${ease.out},
            background 160ms ${ease.out},
            color 160ms ${ease.out};
        }

        .signout:hover {
          border-color: var(--borderStrong);
          background: var(--surfaceHover);
          color: var(--text);
        }

        .column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          border-bottom: 1px solid var(--border);
          background: var(--bgSoft);
        }

        .menu {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--border);
          border-radius: ${radius.sm}px;
          background: var(--surface);
          color: var(--text);
          font-size: 1rem;
          cursor: pointer;
        }

        .topbar-title {
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }

        .theme-form {
          margin-left: auto;
        }

        .theme-toggle {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--border);
          border-radius: ${radius.sm}px;
          background: var(--surface);
          color: var(--textMuted);
          font-size: 1rem;
          cursor: pointer;
          transition:
            border-color 160ms ${ease.out},
            color 160ms ${ease.out};
        }

        .theme-toggle:hover {
          border-color: var(--borderStrong);
          color: var(--text);
        }

        .content {
          flex: 1;
          width: 100%;
          max-width: 1280px;
          padding: clamp(1.25rem, 0.6rem + 2.6vw, 2.25rem);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Mobile: the sidebar overlays the content rather than displacing it. */
        @media (max-width: 899px) {
          .sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 40;
            width: 264px;
          }

          .scrim[data-open='true'] {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 30;
            background: rgba(0, 0, 0, 0.45);
          }
        }

        /* Sidebar becomes permanent furniture once there is room for it. */
        @media (min-width: 900px) {
          .shell {
            grid-template-columns: 256px 1fr;
          }

          .sidebar {
            display: flex;
            position: sticky;
            top: 0;
            height: 100vh;
          }

          .menu,
          .topbar-title {
            display: none;
          }

          .topbar {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
