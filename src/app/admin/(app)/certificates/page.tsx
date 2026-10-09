import { allCertificates, allStudents, certificateCandidates, programOptions } from '@/lib/dal';
import { issueCertificate } from '@/lib/admin-actions';
import { ActionButton } from '@/components/app/ActionForms';
import CertificateIssueForm from '@/components/app/CertificateIssueForm';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  Section,
  formatDate,
} from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Certificates' };

/**
 * Certificate issuance.
 *
 * The "ready to issue" queue is computed from `eligibility()` rather than a
 * stored flag, so it cannot drift from what the student sees on their own
 * progress page.
 */
export default async function CertificatesPage() {
  const [issued, candidates, students, programs] = await Promise.all([
    allCertificates(),
    certificateCandidates(),
    allStudents(),
    programOptions(),
  ]);

  return (
    <>
      <PageTitle
        title="Certificates"
        lede={
          candidates.length > 0
            ? `${candidates.length} ready to issue.`
            : 'No students are currently awaiting a certificate.'
        }
      />

      <Section
        title="Issue manually"
        description="Create a verified certificate for a student who was assessed outside the online course. Course eligibility is not required here."
      >
        {programs.length === 0 ? (
          <Card>
            <p style={styles.muted}>Add at least one programme before issuing a certificate.</p>
          </Card>
        ) : (
          <Card>
            <CertificateIssueForm
              students={students.map((student) => ({
                value: student.id,
                label: `${student.name} · ${student.email}`,
              }))}
              programs={programs.map((program) => ({ value: program.id, label: program.title }))}
              defaultDate={new Date().toISOString().slice(0, 10)}
            />
          </Card>
        )}
      </Section>

      <Section
        title="Ready to issue"
        description="Every lesson complete, every exam passed, every project approved."
      >
        {candidates.length === 0 ? (
          <Card>
            <p style={styles.muted}>
              Nobody has met all three requirements yet. Students appear here automatically
              once they do.
            </p>
          </Card>
        ) : (
          <div style={styles.list}>
            {candidates.map(({ enrollment }) => (
              <Card key={enrollment.id}>
                <div style={styles.head}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={styles.name}>{enrollment.user.name}</strong>
                    <p style={styles.sub}>
                      {enrollment.user.email} · {enrollment.program.title}
                    </p>
                  </div>
                  <Badge tone="positive">Eligible</Badge>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <ActionButton
                    action={issueCertificate}
                    fields={{ userId: enrollment.userId, programId: enrollment.programId }}
                    label="Issue certificate"
                    pendingLabel="Issuing…"
                    tone="primary"
                    confirm={`Issue a certificate to ${enrollment.user.name} for ${enrollment.program.title}? This cannot be undone.`}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Issued (${issued.length})`}>
        {issued.length === 0 ? (
          <EmptyState
            title="None issued yet"
            body="Issued certificates are listed here with their public verification codes."
          />
        ) : (
          <Card>
            <ul style={styles.plainList}>
              {issued.map((certificate) => {
                const holderName =
                  certificate.holderName ?? certificate.user?.name ?? 'Certificate holder';
                return (
                  <li key={certificate.id} style={styles.plainItem}>
                    <div style={styles.certMain}>
                      {certificate.user ? (
                        <a href={`/students/${certificate.user.id}`} style={styles.link}>
                          {holderName}
                        </a>
                      ) : (
                        <span style={styles.link}>{holderName}</span>
                      )}
                      <span style={styles.sub}>{certificate.program.title}</span>
                    </div>
                    {/*
                      The code links to the public verification page — the same URL
                      an employer would use, so staff can confirm it resolves.
                    */}
                    <a href={`/verify/${certificate.verificationCode}`} style={styles.code}>
                      {certificate.verificationCode}
                    </a>
                    <span style={styles.right}>{formatDate(certificate.issuedAt)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </Section>
    </>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  name: {
    color: 'var(--text)',
  },
  sub: {
    marginTop: '0.15rem',
    fontSize: font.small,
    color: 'var(--textMuted)',
    overflowWrap: 'anywhere',
  },
  muted: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  plainList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  plainItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  certMain: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  link: {
    color: 'var(--primary)',
    textDecoration: 'none',
  },
  code: {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    fontSize: font.eyebrow,
    letterSpacing: '0.06em',
    color: 'var(--primaryHover)',
    textDecoration: 'none',
  },
  right: {
    marginLeft: 'auto',
    color: 'var(--textFaint)',
  },
} satisfies Record<string, React.CSSProperties>;
