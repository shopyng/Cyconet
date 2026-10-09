import Link from 'next/link';
import { certificateByCode } from '@/lib/dal';
import { apexUrl, currentTenant } from '@/lib/tenant';
import { color, font, glass, gradient, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify certificate',
  robots: { index: false, follow: false },
};

/**
 * Public certificate verification page.
 *
 * No session required — this URL is what a student puts on their CV and what
 * an employer or recruiter opens. `certificateByCode` deliberately returns
 * only the minimum a third party needs to confirm the credential; it never
 * returns the student's contact details.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const certificate = await certificateByCode(code.toUpperCase());
  const homeHref = (await currentTenant()) === 'admin' ? await apexUrl('/') : '/';

  return (
    <div style={styles.page}>
      <Link href={homeHref} style={styles.home}>← cyconet.ng</Link>

      <div style={styles.card}>
        {certificate ? (
          <>
            <span style={styles.valid} role="img" aria-label="Valid">
              ✓
            </span>
            <p style={styles.eyebrow}>Verified certificate</p>

            <h1 style={styles.program}>{certificate.program}</h1>

            <p style={styles.holder}>Awarded to</p>
            <p style={styles.holderName}>{certificate.holder}</p>

            <dl style={styles.meta}>
              <div style={styles.metaItem}>
                <dt style={styles.metaLabel}>Duration</dt>
                <dd style={styles.metaValue}>{certificate.duration}</dd>
              </div>
              <div style={styles.metaItem}>
                <dt style={styles.metaLabel}>Issued</dt>
                <dd style={styles.metaValue}>
                  {new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div style={styles.metaItem}>
                <dt style={styles.metaLabel}>Code</dt>
                <dd style={{ ...styles.metaValue, letterSpacing: '0.06em' }}>
                  {certificate.code}
                </dd>
              </div>
            </dl>

            <p style={styles.issuer}>
              Issued by{' '}
              <Link href={homeHref} style={styles.issuerLink}>
                Cyconet
              </Link>{' '}
              — cybersecurity academy, tech school and solutions agency.
            </p>

            {/*
              A plain <a download>, not a Link: the response is a file, and the
              client router would try to navigate to it. No `.pdf` in the path —
              the proxy's matcher skips any path containing a dot.
            */}
            <a href={`/verify/${certificate.code}/download`} style={styles.download} download>
              <span aria-hidden="true">↓</span> Download certificate (PDF)
            </a>
          </>
        ) : (
          <>
            <span style={styles.invalid} role="img" aria-label="Not found">
              ✗
            </span>
            <p style={styles.eyebrow}>Not found</p>

            <h1 style={{ ...styles.program, fontSize: font.h3 }}>
              No certificate matches this code
            </h1>

            <p style={styles.notFoundBody}>
              Double-check the code on the certificate. If it still does not resolve, contact{' '}
                <Link href={homeHref} style={styles.issuerLink}>
                Cyconet
              </Link>{' '}
              directly to verify the credential.
            </p>

            <p style={styles.code}>{code.toUpperCase()}</p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: color.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(1.5rem, 1rem + 2vw, 3rem)',
    gap: '1.5rem',
  },
  home: {
    alignSelf: 'flex-start',
    color: color.textMuted,
    fontSize: font.small,
    textDecoration: 'none',
  },
  card: {
    ...glass,
    width: '100%',
    maxWidth: 540,
    padding: 'clamp(1.75rem, 1.25rem + 2vw, 2.75rem)',
    borderRadius: radius.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  valid: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    background: 'rgba(0,229,255,0.12)',
    border: `1px solid rgba(0,229,255,0.3)`,
    color: color.cyan,
    fontSize: '1.1rem',
    fontStyle: 'normal',
    marginBottom: '1.25rem',
  },
  invalid: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    background: 'rgba(252,165,165,0.1)',
    border: `1px solid rgba(252,165,165,0.3)`,
    color: '#FCA5A5',
    fontSize: '1.1rem',
    fontStyle: 'normal',
    marginBottom: '1.25rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: color.textFaint,
    marginBottom: '0.5rem',
  },
  program: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    background: gradient.brand,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    marginBottom: '1.75rem',
  },
  holder: {
    fontSize: font.small,
    color: color.textFaint,
    marginBottom: '0.2rem',
  },
  holderName: {
    fontSize: font.bodyLg,
    fontWeight: 600,
    color: color.text,
    marginBottom: '1.5rem',
  },
  meta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '1.1rem',
    margin: '0 0 1.75rem',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  metaLabel: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
  },
  metaValue: {
    fontSize: font.small,
    color: color.text,
    margin: 0,
  },
  issuer: {
    paddingTop: '1.25rem',
    borderTop: `1px solid ${color.border}`,
    fontSize: font.small,
    color: color.textMuted,
    lineHeight: 1.6,
  },
  issuerLink: {
    color: color.cyan,
    textDecoration: 'none',
  },
  download: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    padding: '0.75rem 1.35rem',
    borderRadius: radius.md,
    // Ink on the bright brand gradient — the same accessible pairing the
    // marketing buttons use. See gradient.cta in src/lib/theme.ts.
    background: gradient.cta,
    color: color.ink,
    fontSize: font.small,
    fontWeight: 700,
    textDecoration: 'none',
  },
  notFoundBody: {
    fontSize: font.small,
    lineHeight: 1.7,
    color: color.textMuted,
    marginBottom: '1.25rem',
  },
  code: {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    fontSize: '1.2rem',
    letterSpacing: '0.1em',
    color: color.textFaint,
    padding: '0.6rem 0.9rem',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
} satisfies Record<string, React.CSSProperties>;
