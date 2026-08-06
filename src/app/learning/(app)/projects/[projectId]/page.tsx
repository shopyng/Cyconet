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
import { font } from '@/lib/theme';
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
      <BackLink href="/projects" label="All projects" />

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

      {project.rubricItems.length > 0 ? (
        <Section title="Rubric">
          <Card>
            <ul style={styles.history}>
              {project.rubricItems.map((item) => (
                <li key={item.id} style={styles.rubricItem}>
                  <span style={styles.rubricLabel}>{item.label}</span>
                  <span style={styles.historyDate}>{item.points} pts</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}

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
                {submission.feedbackThread.length > 0 ? (
                  <div style={styles.thread}>
                    {submission.feedbackThread.map((message) => (
                      <div key={message.id} style={styles.threadItem}>
                        <strong style={styles.rubricLabel}>{message.authorName}</strong>
                        <span style={styles.historyDate}>
                          {message.authorRole.toLowerCase()} · {formatDateTime(message.createdAt)}
                        </span>
                        <p style={styles.historyDesc}>{message.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
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
    color: 'var(--textFaint)',
  },
  h1: {
    marginTop: '0.3rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    color: 'var(--text)',
  },
  desc: {
    marginTop: '0.6rem',
    color: 'var(--textMuted)',
    lineHeight: 1.6,
  },
  feedback: {
    color: 'var(--text)',
    fontSize: font.small,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  feedbackMeta: {
    marginTop: '0.75rem',
    fontSize: font.eyebrow,
    color: 'var(--textFaint)',
  },
  closed: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
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
    borderBottom: `1px solid var(--border)`,
  },
  historyHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  historyDate: {
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  historyDesc: {
    marginTop: '0.6rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
    whiteSpace: 'pre-wrap',
  },
  historyLinks: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.6rem',
  },
  rubricItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    fontSize: font.small,
  },
  rubricLabel: {
    color: 'var(--text)',
  },
  thread: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.85rem',
    paddingTop: '0.85rem',
    borderTop: '1px solid var(--border)',
  },
  threadItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  link: {
    color: 'var(--primary)',
    fontSize: font.small,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
