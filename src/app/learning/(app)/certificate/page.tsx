import { myEnrollments, myCertificates, eligibility, verifySession } from '@/lib/dal';
import { SITE_URL } from '@/lib/content';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  Section,
  ProgressBar,
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
        <Section title="Issued">
          <div style={styles.list}>
            {certificates.map((certificate) => (
              <div key={certificate.id} style={styles.certificate}>
                <span style={styles.certEyebrow}>Certificate of completion</span>
                <h3 style={styles.certTitle}>{certificate.program.title}</h3>
                <p style={styles.certHolder}>{user.name}</p>
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
                {/*
                  An absolute URL, not a relative link: this is the line a student
                  pastes into a CV or sends to an employer, so it has to resolve
                  from outside the app.
                */}
                <p style={styles.verify}>
                  Anyone can confirm this at{' '}
                  <a href={`/verify/${certificate.verificationCode}`} style={styles.verifyLink}>
                    {SITE_URL.replace(/^https?:\/\//, '')}/verify/{certificate.verificationCode}
                  </a>
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {progress.length > 0 ? (
        <Section title={certificates.length > 0 ? 'In progress' : 'Your progress'}>
          <div style={styles.list}>
            {progress.map(({ enrollment, status }) => (
              <Card key={enrollment.id}>
                <div style={styles.head}>
                  <h3 style={styles.title}>{enrollment.program.title}</h3>
                  <Badge tone={status.eligible ? 'positive' : 'neutral'}>
                    {status.eligible ? 'Ready to issue' : 'In progress'}
                  </Badge>
                </div>

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

                <p style={styles.note}>
                  {status.eligible
                    ? 'Every requirement is met. Staff will issue your certificate shortly.'
                    : 'All three must be complete before a certificate can be issued.'}
                </p>
              </Card>
            ))}
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
  gates: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
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
  note: {
    marginTop: '1.1rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textFaint)',
  },
  certificate: {
    position: 'relative',
    padding: 'clamp(1.5rem, 1rem + 2vw, 2.25rem)',
    // A brand-gradient hairline reads as "document" without the cost of a real
    // certificate render — this page is the record, not a printable artefact.
    border: `1px solid var(--borderStrong)`,
    borderRadius: radius.lg,
    background: 'var(--surface)',
    boxShadow: '0 18px 44px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  certEyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--primary)',
  },
  certTitle: {
    marginTop: '0.5rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--primary)',
  },
  certHolder: {
    marginTop: '0.35rem',
    color: 'var(--text)',
    fontSize: font.bodyLg,
  },
  certMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
    gap: '1rem',
    margin: '1.5rem 0 0',
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
  verify: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: `1px solid var(--border)`,
    fontSize: font.small,
    color: 'var(--textMuted)',
    overflowWrap: 'anywhere',
  },
  verifyLink: {
    color: 'var(--primary)',
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
