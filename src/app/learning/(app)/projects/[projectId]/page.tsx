import { notFound } from 'next/navigation';
import { projectForStudent } from '@/lib/dal';
import { submitProject } from '@/lib/learning-actions';
import Markdown, { MarkdownStyles } from '@/components/app/Markdown';
import { ProjectSubmitForm } from '@/components/app/ActionForms';
import {
  BackLink,
  Badge,
  Card,
  Section,
  statusTone,
  humanStatus,
  formatDateTime,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const result = await projectForStudent(projectId);
  if (!result) notFound();

  const { project, submissions } = result;
  const latest = submissions[0] ?? null;

  // Approved work is final — re-submitting would reopen a closed review and
  // silently drop the student back to PENDING, undoing a gate they already met.
  const canSubmit = !latest || latest.status === 'NEEDS_REVISION';

  return (
    <div style={{ maxWidth: 760 }}>
      <BackLink href="/learning/projects" label="All projects" />

      <header style={styles.header}>
        <span style={styles.eyebrow}>{project.program.title}</span>
        <h1 style={styles.h1}>{project.title}</h1>
        <p style={styles.desc}>{project.description}</p>
        {latest ? (
          <div style={{ marginTop: '0.9rem' }}>
            <Badge tone={statusTone(latest.status)}>{humanStatus(latest.status)}</Badge>
          </div>
        ) : null}
      </header>

      <Section title="Brief">
        <Card>
          <Markdown content={project.requirements} />
        </Card>
      </Section>

      {latest?.feedback ? (
        <Section title="Reviewer feedback">
          <Card>
            <p style={styles.feedback}>{latest.feedback}</p>
            {latest.reviewedAt ? (
              <p style={styles.feedbackMeta}>Reviewed {formatDateTime(latest.reviewedAt)}</p>
            ) : null}
          </Card>
        </Section>
      ) : null}

      <Section
        title={canSubmit ? (latest ? 'Submit a revision' : 'Submit your work') : 'Your submission'}
        description={
          canSubmit
            ? 'The reviewer opens your repository directly, so make sure it is public or shared with staff.'
            : undefined
        }
      >
        {canSubmit ? (
          <ProjectSubmitForm action={submitProject} projectId={project.id} />
        ) : (
          <Card>
            <p style={styles.closed}>
              {latest?.status === 'APPROVED'
                ? 'This project has been approved. No further submissions are needed.'
                : 'Your submission is with a reviewer. You will see the outcome here.'}
            </p>
          </Card>
        )}
      </Section>

      {submissions.length > 0 ? (
        <Section title="Submission history">
          <ul style={styles.history}>
            {submissions.map((submission) => (
              <li key={submission.id} style={styles.historyItem}>
                <div style={styles.historyHead}>
                  <Badge tone={statusTone(submission.status)}>
                    {humanStatus(submission.status)}
                  </Badge>
                  <span style={styles.historyDate}>
                    {formatDateTime(submission.submittedAt)}
                  </span>
                </div>
                <p style={styles.historyDesc}>{submission.description}</p>
                <p style={styles.historyLinks}>
                  {submission.repoUrl ? (
                    <a
                      href={submission.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      Repository
                    </a>
                  ) : null}
                  {submission.demoUrl ? (
                    <a
                      href={submission.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      Live demo
                    </a>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <MarkdownStyles />
    </div>
  );
}

const styles = {
  header: {
    marginTop: '1rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
  },
  h1: {
    marginTop: '0.3rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    color: color.text,
  },
  desc: {
    marginTop: '0.6rem',
    color: color.textMuted,
    lineHeight: 1.6,
  },
  feedback: {
    color: color.text,
    fontSize: font.small,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  feedbackMeta: {
    marginTop: '0.75rem',
    fontSize: font.eyebrow,
    color: color.textFaint,
  },
  closed: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: color.textMuted,
  },
  history: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  historyItem: {
    paddingBottom: '1rem',
    borderBottom: `1px solid ${color.border}`,
  },
  historyHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  historyDate: {
    fontSize: font.small,
    color: color.textFaint,
  },
  historyDesc: {
    marginTop: '0.6rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: color.textMuted,
    whiteSpace: 'pre-wrap',
  },
  historyLinks: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.6rem',
  },
  link: {
    color: color.cyan,
    fontSize: font.small,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
