import { notFound } from 'next/navigation';
import { studentById } from '@/lib/dal';
import { issueCertificate } from '@/lib/admin-actions';
import { ActionButton } from '@/components/app/ActionForms';
import {
  PageTitle,
  BackLink,
  Card,
  Badge,
  Section,
  ProgressBar,
  statusTone,
  humanStatus,
  formatDate,
  formatDateTime,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Student' };

/**
 * Everything staff need about one student on a single screen: which programmes
 * they are on, how far through each, and the certificate button when they have
 * met every gate.
 */
export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await studentById(id);
  if (!result) notFound();

  const { student, progress } = result;
  const certifiedProgramIds = new Set(student.certificates.map((c) => c.programId));

  return (
    <div style={{ maxWidth: 820 }}>
      <PageTitle title={student.name} lede={student.email}>
        <BackLink href="/admin/students" label="All students" />
      </PageTitle>

      <p style={styles.joined}>Joined {formatDate(student.createdAt)}</p>

      <Section title="Programmes">
        {student.enrollments.length === 0 ? (
          <Card>
            <p style={styles.muted}>
              This student has no enrolments. Accepting an application enrols them
              automatically.
            </p>
          </Card>
        ) : (
          <div style={styles.list}>
            {student.enrollments.map((enrollment) => {
              const status = progress.get(enrollment.programId);
              const certified = certifiedProgramIds.has(enrollment.programId);

              return (
                <Card key={enrollment.id}>
                  <div style={styles.head}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={styles.title}>{enrollment.program.title}</h3>
                      <p style={styles.since}>
                        Started {formatDate(enrollment.startedAt)} · {enrollment.program.duration}
                      </p>
                    </div>
                    {certified ? (
                      <Badge tone="positive">Certified</Badge>
                    ) : status?.eligible ? (
                      <Badge tone="positive">Ready to issue</Badge>
                    ) : (
                      <Badge tone="neutral">In progress</Badge>
                    )}
                  </div>

                  {status ? (
                    <div style={styles.gates}>
                      <Gate
                        label="Lessons"
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
                  ) : null}

                  {/*
                    The button only appears when every gate is met. issueCertificate
                    re-checks eligibility server-side regardless — this page could be
                    minutes stale by the time anyone clicks.
                  */}
                  {!certified && status?.eligible ? (
                    <div style={{ marginTop: '1.25rem' }}>
                      <ActionButton
                        action={issueCertificate}
                        fields={{ userId: student.id, programId: enrollment.programId }}
                        label="Issue certificate"
                        pendingLabel="Issuing…"
                        tone="primary"
                        confirm={`Issue a certificate to ${student.name} for ${enrollment.program.title}? This cannot be undone.`}
                      />
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {student.certificates.length > 0 ? (
        <Section title="Certificates">
          <Card>
            <ul style={styles.plainList}>
              {student.certificates.map((certificate) => (
                <li key={certificate.id} style={styles.plainItem}>
                  <span style={{ color: color.text }}>{certificate.program.title}</span>
                  <span style={styles.code}>{certificate.verificationCode}</span>
                  <span style={styles.right}>{formatDate(certificate.issuedAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}

      {student.examAttempts.length > 0 ? (
        <Section title="Exam attempts">
          <Card>
            <ul style={styles.plainList}>
              {student.examAttempts.map((attempt) => (
                <li key={attempt.id} style={styles.plainItem}>
                  <span style={{ color: color.text }}>{attempt.exam.title}</span>
                  <Badge tone={attempt.passed ? 'positive' : 'critical'}>
                    {attempt.score}%
                  </Badge>
                  <span style={styles.right}>{formatDateTime(attempt.attemptedAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}

      {student.projectSubmissions.length > 0 ? (
        <Section title="Project submissions">
          <Card>
            <ul style={styles.plainList}>
              {student.projectSubmissions.map((submission) => (
                <li key={submission.id} style={styles.plainItem}>
                  <a href={`/admin/submissions/${submission.id}`} style={styles.link}>
                    {submission.project.title}
                  </a>
                  <Badge tone={statusTone(submission.status)}>
                    {humanStatus(submission.status)}
                  </Badge>
                  <span style={styles.right}>{formatDate(submission.submittedAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}
    </div>
  );
}

function Gate({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div>
      <div style={styles.gateHead}>
        <span style={{ color: color.textMuted }}>{label}</span>
        <span style={{ color: color.textFaint }}>
          {done}/{total}
        </span>
      </div>
      <ProgressBar done={done} total={total} label={label} />
    </div>
  );
}

const styles = {
  joined: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: color.textFaint,
  },
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
    color: color.text,
  },
  since: {
    marginTop: '0.2rem',
    fontSize: font.small,
    color: color.textFaint,
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
  muted: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: color.textMuted,
  },
  plainList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  plainItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  code: {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    fontSize: font.eyebrow,
    letterSpacing: '0.06em',
    color: color.cyan,
  },
  right: {
    marginLeft: 'auto',
    color: color.textFaint,
  },
  link: {
    color: color.cyan,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
