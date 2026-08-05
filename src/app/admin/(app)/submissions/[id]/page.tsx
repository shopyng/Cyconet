import { notFound } from 'next/navigation';
import { submissionById } from '@/lib/dal';
import { reviewSubmission } from '@/lib/admin-actions';
import { DecisionForm } from '@/components/app/ActionForms';
import Markdown, { MarkdownStyles } from '@/components/app/Markdown';
import {
  PageTitle,
  BackLink,
  Card,
  Badge,
  Section,
  DetailList,
  DetailRow,
  statusTone,
  humanStatus,
  formatDateTime,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Review submission' };

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await submissionById(id);
  if (!submission) notFound();

  return (
    <div style={{ maxWidth: 760 }}>
      <PageTitle title={submission.project.title}>
        <BackLink href="/admin/submissions" label="Review queue" />
      </PageTitle>

      <div style={styles.headMeta}>
        <Badge tone={statusTone(submission.status)}>{humanStatus(submission.status)}</Badge>
        <a href={`/admin/students/${submission.user.id}`} style={styles.link}>
          {submission.user.name}
        </a>
        <span style={styles.faint}>{formatDateTime(submission.submittedAt)}</span>
      </div>

      <Section title="Submitted work">
        <Card>
          <DetailList>
            <DetailRow label="Repository">
              {submission.repoUrl ? (
                <a
                  href={submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  {submission.repoUrl}
                </a>
              ) : (
                <span style={styles.faint}>Not provided</span>
              )}
            </DetailRow>
            <DetailRow label="Live demo">
              {submission.demoUrl ? (
                <a
                  href={submission.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  {submission.demoUrl}
                </a>
              ) : (
                <span style={styles.faint}>Not provided</span>
              )}
            </DetailRow>
            <DetailRow label="Student's notes">
              <span style={styles.pre}>{submission.description}</span>
            </DetailRow>
          </DetailList>
        </Card>
      </Section>

      <Section title="Brief" description="What the student was asked to build.">
        <Card>
          <Markdown content={submission.project.requirements} />
        </Card>
      </Section>

      {submission.status === 'PENDING' ? (
        <Section title="Decision">
          <Card>
            <DecisionForm
              action={reviewSubmission}
              id={submission.id}
              notesName="feedback"
              notesLabel="Feedback"
              notesHint="Shown to the student. Required when requesting changes."
              approveLabel="Approve"
              rejectLabel="Request changes"
              approveValue="APPROVED"
              rejectValue="NEEDS_REVISION"
            />
          </Card>
        </Section>
      ) : (
        <Section title="Review">
          <Card>
            <DetailList>
              <DetailRow label="Outcome">{humanStatus(submission.status)}</DetailRow>
              {submission.reviewedAt ? (
                <DetailRow label="Reviewed">{formatDateTime(submission.reviewedAt)}</DetailRow>
              ) : null}
              {submission.feedback ? (
                <DetailRow label="Feedback">
                  <span style={styles.pre}>{submission.feedback}</span>
                </DetailRow>
              ) : null}
            </DetailList>
          </Card>
        </Section>
      )}

      <MarkdownStyles />
    </div>
  );
}

const styles = {
  headMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    marginTop: '0.9rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  link: {
    color: color.cyan,
    textDecoration: 'none',
    overflowWrap: 'anywhere',
  },
  faint: {
    color: color.textFaint,
  },
  pre: {
    display: 'block',
    whiteSpace: 'pre-wrap',
  },
} satisfies Record<string, React.CSSProperties>;
