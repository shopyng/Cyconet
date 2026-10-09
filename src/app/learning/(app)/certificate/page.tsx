import { myEnrollments, myCertificates, eligibility, verifySession } from '@/lib/dal';
import { SITE_URL } from '@/lib/content';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  Section,
  ProgressBar,
  ProgressRing,
  Alert,
  formatDate,
} from '@/components/app/Primitives';
import { font, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Certificate' };

/**
 * Certificates earned, and progress towards the ones still outstanding.
 *
 * The three gates shown here come from `eligibility()` — the same function the
 * admin's issue button calls — so a student can never see "eligible" while
 * staff see otherwise.
 *
 * Each issued certificate is rendered as a preview of the real document and
 * links to `/certificate/<code>/download`, which returns the PDF. No `.pdf`
 * suffix on that path: the proxy skips anything containing a dot, so the
 * extension would take the route out of the rewrite and 404 it.
 */
export default async function CertificatePage() {
  const user = await verifySession();
  const [enrollments, certificates] = await Promise.all([myEnrollments(), myCertificates()]);

  if (enrollments.length === 0) {
    return (
      <>
        <PageTitle title="Certificate" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No programme yet"
            body="Certificates are issued per programme. Once you are enrolled, your progress towards one appears here."
          />
        </div>
      </>
    );
  }

  const issuedProgramIds = new Set(certificates.map((c) => c.programId));
  const outstanding = enrollments.filter((e) => !issuedProgramIds.has(e.programId));

  const progress = await Promise.all(
    outstanding.map(async (enrollment) => ({
      enrollment,
      status: await eligibility(user.id, enrollment.programId),
    })),
  );

  return (
    <>
      <PageTitle
        title="Certificate"
        lede="Awarded once every lesson, exam and project on a programme is complete."
      />

      {certificates.length > 0 ? (
        <Section
          title="Issued"
          description="Download the PDF for your records, or share the verification link."
        >
          <div style={styles.list}>
            {certificates.map((certificate) => (
              <article key={certificate.id} style={styles.certificate}>
                <div style={styles.certRule} aria-hidden="true" />

                <div style={styles.certHead}>
                  <span style={styles.certEyebrow}>Certificate of completion</span>
                  <Badge tone="positive">Verified</Badge>
                </div>

                <p style={styles.certAwarded}>This is to certify that</p>
                <p style={styles.certHolder}>{certificate.holderName ?? user.name}</p>
                <p style={styles.certAwarded}>has successfully completed</p>
                <h3 style={styles.certTitle}>{certificate.program.title}</h3>

                <dl style={styles.certMeta}>
                  <div>
                    <dt style={styles.certLabel}>Issued</dt>
                    <dd style={styles.certValue}>{formatDate(certificate.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt style={styles.certLabel}>Duration</dt>
                    <dd style={styles.certValue}>{certificate.program.duration}</dd>
                  </div>
                  <div>
                    <dt style={styles.certLabel}>Verification code</dt>
                    <dd style={{ ...styles.certValue, letterSpacing: '0.06em' }}>
                      {certificate.verificationCode}
                    </dd>
                  </div>
                </dl>

                <div style={styles.certActions}>
                  {/*
                    A plain <a>, not a router Link: this response is a file
                    download, and the client router would try to treat it as a
                    navigation. `download` also gives the browser a filename
                    hint that matches the Content-Disposition header.
                  */}
                  <a
                    href={`/certificate/${certificate.verificationCode}/download`}
                    className="cert-download"
                    download
                  >
                    <span aria-hidden="true">↓</span> Download PDF
                  </a>
                  <a
                    href={`/verify/${certificate.verificationCode}`}
                    style={styles.verifyLink}
                  >
                    View public verification page
                  </a>
                </div>

                {/*
                  An absolute URL, not a relative link: this is the line a student
                  pastes into a CV or sends to an employer, so it has to resolve
                  from outside the app.
                */}
                <p style={styles.verify}>
                  Anyone can confirm this at{' '}
                  <span style={styles.verifyUrl}>
                    {SITE_URL.replace(/^https?:\/\//, '')}/verify/
                    {certificate.verificationCode}
                  </span>
                </p>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      {progress.length > 0 ? (
        <Section title={certificates.length > 0 ? 'In progress' : 'Your progress'}>
          <div style={styles.list}>
            {progress.map(({ enrollment, status }) => {
              const done =
                status.lessons.done + status.exams.passed + status.projects.approved;
              const total =
                status.lessons.total + status.exams.total + status.projects.total;

              return (
                <Card key={enrollment.id} tone={status.eligible ? 'positive' : undefined}>
                  <div style={styles.head}>
                    <h3 style={styles.title}>{enrollment.program.title}</h3>
                    <Badge tone={status.eligible ? 'positive' : 'neutral'}>
                      {status.eligible ? 'Ready to issue' : 'In progress'}
                    </Badge>
                  </div>

                  <div style={styles.progressLayout}>
                    <ProgressRing
                      done={done}
                      total={total}
                      label={`Overall progress on ${enrollment.program.title}`}
                    />

                    <div style={styles.gates}>
                      <Gate
                        label="Lessons completed"
                        done={status.lessons.done}
                        total={status.lessons.total}
                      />
                      <Gate
                        label="Exams passed"
                        done={status.exams.passed}
                        total={status.exams.total}
                      />
                      <Gate
                        label="Projects approved"
                        done={status.projects.approved}
                        total={status.projects.total}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem' }}>
                    {status.eligible ? (
                      <Alert tone="success" title="Every requirement is met">
                        Staff will issue your certificate shortly. It will appear on this page,
                        ready to download as a PDF.
                      </Alert>
                    ) : (
                      <Alert tone="info">
                        All three gates must be complete before a certificate can be issued.
                      </Alert>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}
    </>
  );
}

function Gate({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div>
      <div style={styles.gateHead}>
        <span style={styles.gateLabel}>{label}</span>
        <span style={styles.gateCount}>
          {done}/{total}
        </span>
      </div>
      <ProgressBar done={done} total={total} label={label} />
    </div>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  title: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: 'var(--text)',
  },
  progressLayout: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(1.25rem, 0.8rem + 2vw, 2.5rem)',
    flexWrap: 'wrap',
    marginTop: '1.25rem',
  },
  gates: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    // Claims the rest of the row beside the ring, but wraps under it rather
    // than crushing when the card is narrow.
    flex: '1 1 320px',
    minWidth: 0,
  },
  gateHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
    fontSize: font.small,
  },
  gateLabel: {
    color: 'var(--textMuted)',
  },
  gateCount: {
    color: 'var(--textFaint)',
  },
  certificate: {
    position: 'relative',
    padding: 'clamp(1.75rem, 1rem + 2.5vw, 2.75rem)',
    border: '1px solid var(--borderStrong)',
    borderRadius: radius.lg,
    background: 'var(--surface)',
    boxShadow: 'var(--shadowLg)',
    overflow: 'hidden',
    textAlign: 'center',
  },
  certRule: {
    position: 'absolute',
    insetInline: 0,
    top: 0,
    height: 4,
    background: 'var(--primary)',
  },
  certHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
  },
  certEyebrow: {
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--primary)',
  },
  certAwarded: {
    fontSize: font.small,
    color: 'var(--textMuted)',
  },
  certHolder: {
    margin: '0.4rem 0 0.9rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: 'clamp(1.6rem, 1.2rem + 2vw, 2.5rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
    color: 'var(--text)',
  },
  certTitle: {
    margin: '0.4rem 0 0',
    fontSize: font.h3,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--primary)',
  },
  certMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
    gap: '1rem',
    margin: '1.75rem 0 0',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border)',
  },
  certLabel: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  certValue: {
    margin: '0.2rem 0 0',
    fontSize: font.small,
    color: 'var(--text)',
  },
  certActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '1.75rem',
  },
  verify: {
    marginTop: '1.25rem',
    fontSize: font.small,
    color: 'var(--textMuted)',
    overflowWrap: 'anywhere',
  },
  verifyUrl: {
    color: 'var(--text)',
  },
  verifyLink: {
    color: 'var(--primary)',
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
