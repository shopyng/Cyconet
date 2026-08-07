'use client';

/**
 * Sticky navigation.
 *
 * Transparent over the hero, then settles into a frosted glass bar once the
 * page scrolls — the CTA stays visible the whole way down.
 *
 * Accessibility:
 *  - A skip link is the first focusable element on the page.
 *  - The mobile toggle exposes `aria-expanded` / `aria-controls`.
 *  - Escape closes the panel and returns focus to the toggle.
 *  - Body scroll is locked while the panel is open so the page behind cannot
 *    scroll away under the user's finger.
 *
 * Breakpoint-dependent properties (`display`, mostly) live exclusively in
 * styled-jsx — an inline `display` would outrank the media query and the layout
 * would never switch.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Lockup } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { MenuIcon } from '@/components/ui/Icons';
import { color, ease, font, layout, radius } from '@/lib/theme';
import { navLinks, routes } from '@/lib/routes';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* Frost the bar once the hero starts sliding under it. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  /* Escape to dismiss, and lock the page behind the open panel. */
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <a href="#main" className="cn-skip">
        Skip to content
      </a>

      <header
        className="cn-nav"
        style={{
          ...styles.header,
          // State-driven, so inline is correct here — React re-renders it and
          // no stylesheet rule is competing for these properties.
          background: scrolled ? 'rgba(10, 11, 15, 0.72)' : 'transparent',
          borderBottomColor: scrolled ? color.border : 'transparent',
          backdropFilter: scrolled ? 'blur(18px) saturate(140%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(140%)' : 'none',
        }}
      >
        <nav className="cn-nav__inner" aria-label="Primary" style={styles.inner}>
          <a href={routes.home} className="cn-nav__brand" aria-label="Cyconet — home">
            <Lockup />
          </a>

          <ul className="cn-nav__links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="cn-nav__link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="cn-nav__actions">
            <span className="cn-nav__cta">
              <Button href={routes.register} variant="primary">
                Enroll Now
              </Button>
            </span>

            <button
              ref={toggleRef}
              type="button"
              className="cn-nav__toggle"
              aria-expanded={menuOpen}
              aria-controls="cn-mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </nav>

        {/*
          Kept mounted and toggled with `hidden` so the markup order stays
          natural for screen readers and the CSS transition has something to
          animate between.
        */}
        <div
          id="cn-mobile-menu"
          className="cn-nav__panel"
          hidden={!menuOpen}
          style={styles.panel}
        >
          <ul style={styles.panelList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="cn-nav__panel-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div style={styles.panelCta}>
            <Button href={routes.register} variant="primary" size="lg" fullWidth>
              Enroll Now
            </Button>
          </div>
        </div>
      </header>

      <style jsx>{`
        .cn-skip {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -120%);
          z-index: 200;
          padding: 0.7rem 1.2rem;
          border-radius: 0 0 ${radius.md}px ${radius.md}px;
          background: ${color.cyan};
          color: ${color.ink};
          font-size: ${font.small};
          font-weight: 600;
          transition: transform 200ms ${ease.out};
        }

        .cn-skip:focus-visible {
          transform: translate(-50%, 0);
        }

        .cn-nav__brand {
          display: inline-flex;
          align-items: center;
          border-radius: ${radius.sm}px;
          transition: opacity 200ms ${ease.out};
        }

        .cn-nav__brand:hover {
          opacity: 0.82;
        }

        /* — Desktop link row: hidden by default, revealed at the breakpoint — */
        .cn-nav__links {
          display: none;
          align-items: center;
          gap: 0.35rem;
        }

        .cn-nav__link {
          position: relative;
          display: inline-block;
          padding: 0.5rem 0.85rem;
          border-radius: ${radius.sm}px;
          color: ${color.textMuted};
          font-size: 0.93rem;
          font-weight: 500;
          transition: color 220ms ${ease.out};
        }

        .cn-nav__link:hover {
          color: ${color.text};
        }

        /* Gradient underline that grows from the centre on hover. */
        .cn-nav__link::after {
          content: '';
          position: absolute;
          left: 0.85rem;
          right: 0.85rem;
          bottom: 0.25rem;
          height: 1.5px;
          border-radius: 2px;
          background: linear-gradient(90deg, ${color.cyan}, ${color.violet});
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 280ms ${ease.out};
        }

        .cn-nav__link:hover::after {
          transform: scaleX(1);
        }

        .cn-nav__actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .cn-nav__cta {
          display: none;
        }

        .cn-nav__toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 1px solid ${color.border};
          border-radius: ${radius.sm}px;
          background: ${color.surface};
          color: ${color.text};
          transition:
            background 200ms ${ease.out},
            border-color 200ms ${ease.out};
        }

        .cn-nav__toggle:hover {
          background: ${color.surfaceHover};
          border-color: ${color.borderStrong};
        }

        .cn-nav__panel-link {
          display: block;
          padding: 0.9rem 0.25rem;
          border-bottom: 1px solid ${color.border};
          color: ${color.text};
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          transition:
            color 200ms ${ease.out},
            padding-left 200ms ${ease.out};
        }

        .cn-nav__panel-link:hover {
          color: ${color.cyan};
          padding-left: 0.75rem;
        }

        @media (min-width: 900px) {
          .cn-nav__links,
          .cn-nav__cta {
            display: flex;
          }

          .cn-nav__toggle,
          .cn-nav__panel {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid transparent',
    transition: `background 320ms ${ease.out}, border-color 320ms ${ease.out}, backdrop-filter 320ms ${ease.out}`,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    width: '100%',
    maxWidth: layout.maxWidth,
    marginInline: 'auto',
    paddingInline: layout.gutter,
    height: 74,
  },
  panel: {
    borderTop: `1px solid ${color.border}`,
    background: 'rgba(10, 11, 15, 0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    paddingInline: layout.gutter,
    paddingBottom: '1.75rem',
  },
  panelList: {
    paddingTop: '0.5rem',
  },
  panelCta: {
    marginTop: '1.5rem',
  },
} satisfies Record<string, React.CSSProperties>;
