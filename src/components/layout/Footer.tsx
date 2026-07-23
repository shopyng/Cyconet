'use client';

/**
 * Footer — newsletter signup, sitemap columns, socials.
 *
 * The newsletter is now a real Server Action form (see NewsletterForm), so it
 * validates server-side, is rate limited and works without JavaScript.
 */

import { Lockup } from '@/components/ui/Logo';
import NewsletterForm from '@/components/forms/NewsletterForm';
import { SocialIcon } from '@/components/ui/Icons';
import { color, container, ease, font, radius } from '@/lib/theme';
import { brand, footer } from '@/lib/content';

export default function Footer() {
  return (
    <footer id="contact" style={styles.footer}>
      <div style={styles.inner}>
        {/* — Newsletter — */}
        <div style={styles.newsletter}>
          <div style={styles.newsletterCopy}>
            <h2 style={styles.newsletterTitle}>{footer.newsletter.title}</h2>
            <p style={styles.newsletterBody}>{footer.newsletter.body}</p>
          </div>

          <NewsletterForm />
        </div>

        {/* — Sitemap — */}
        <div className="cn-foot-grid">
          <div style={styles.brandCol}>
            <a href="#top" aria-label="Cyconet — back to top" className="cn-foot-brand">
              <Lockup size={30} />
            </a>
            <p style={styles.brandBlurb}>{brand.shortDescription}</p>

            <ul style={styles.socials}>
              {footer.socials.map((social) => (
                <li key={social.icon}>
                  <a
                    href={social.href}
                    className="cn-social"
                    aria-label={social.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <SocialIcon name={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 style={styles.colTitle}>{column.title}</h3>
              <ul style={styles.colList}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="cn-foot-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* — Legal — */}
        <div style={styles.legal}>
          <p style={styles.legalText}>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p style={styles.legalText}>
            {brand.address.street}, {brand.address.locality} ·{' '}
            <a href={`mailto:${brand.email}`} className="cn-foot-link">
              {brand.email}
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .cn-foot-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          padding-block: clamp(2.5rem, 2rem + 2vw, 4rem);
        }

        .cn-foot-brand {
          display: inline-flex;
          transition: opacity 220ms ${ease.out};
        }

        .cn-foot-brand:hover {
          opacity: 0.82;
        }

        .cn-foot-link {
          display: inline-block;
          padding-block: 0.28rem;
          color: ${color.textMuted};
          font-size: 0.92rem;
          transition:
            color 220ms ${ease.out},
            transform 220ms ${ease.out};
        }

        .cn-foot-link:hover {
          color: ${color.text};
        }

        .cn-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid ${color.border};
          border-radius: 999px;
          color: ${color.textMuted};
          transition:
            color 240ms ${ease.out},
            border-color 240ms ${ease.out},
            transform 240ms ${ease.out};
        }

        .cn-social:hover {
          color: ${color.cyan};
          border-color: rgba(0, 229, 255, 0.35);
          transform: translateY(-2px);
        }

        @media (min-width: 760px) {
          .cn-foot-grid {
            grid-template-columns: 1.6fr repeat(3, 1fr);
            gap: 3rem 2rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-social:hover {
            transform: none;
          }
        }
      `}</style>
    </footer>
  );
}

const styles = {
  footer: {
    position: 'relative',
    marginTop: 'clamp(3rem, 2rem + 4vw, 6rem)',
    borderTop: `1px solid ${color.border}`,
    background: `linear-gradient(180deg, ${color.bgSoft} 0%, ${color.bg} 100%)`,
  },
  inner: {
    ...container,
    paddingBlock: 'clamp(3rem, 2rem + 3vw, 4.5rem)',
  },
  newsletter: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    padding: 'clamp(1.6rem, 1.2rem + 1.6vw, 2.5rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.xl,
    background: `linear-gradient(135deg, rgba(0,229,255,0.07) 0%, rgba(124,58,237,0.07) 100%)`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  newsletterCopy: {
    flex: '1 1 320px',
  },
  newsletterTitle: {
    fontSize: 'clamp(1.35rem, 1.15rem + 1vw, 1.9rem)',
    fontWeight: 700,
    color: color.text,
  },
  newsletterBody: {
    marginTop: '0.6rem',
    maxWidth: '46ch',
    fontSize: '0.95rem',
    lineHeight: 1.65,
    color: color.textMuted,
  },
  brandCol: {
    maxWidth: 380,
  },
  brandBlurb: {
    marginTop: '1.1rem',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
  socials: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: '1.5rem',
  },
  colTitle: {
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: font.eyebrow,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: color.text,
  },
  colList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    marginTop: '1rem',
  },
  legal: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    paddingTop: '2rem',
    borderTop: `1px solid ${color.border}`,
  },
  legalText: {
    fontSize: '0.85rem',
    color: color.textFaint,
  },
} satisfies Record<string, React.CSSProperties>;
