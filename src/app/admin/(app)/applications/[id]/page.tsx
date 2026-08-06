import { notFound } from 'next/navigation';
import { applicationById } from '@/lib/dal';
import { reviewApplication } from '@/lib/admin-actions';
import { DecisionForm } from '@/components/app/ActionForms';
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
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Application' };

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const application = await applicationById(id);
  if (!application) notFound();

  const isPending = application.status === 'PENDING';

  return (
    <div style={{ maxWidth: 720 }}>
      <PageTitle title={application.name}>
        <BackLink href="/applications" label="All applications" />
      </PageTitle>

      <div style={{ marginTop: '0.9rem' }}>
        <Badge tone={statusTone(application.status)}>{humanStatus(application.status)}</Badge>
      </div>

      <Section title="Applicant">
        <Card>
          <DetailList>
            <DetailRow label="Email">
              <a href={`mailto:${application.email}`} style={styles.link}>
                {application.email}
              </a>
            </DetailRow>
            <DetailRow label="Phone">
              <a href={`tel:${application.phone}`} style={styles.link}>
                {application.phone}
              </a>
            </DetailRow>
            <DetailRow label="Track applied for">{application.track}</DetailRow>
            <DetailRow label="Experience">{application.experience}</DetailRow>
            <DetailRow label="Applied">{formatDateTime(application.createdAt)}</DetailRow>
          </DetailList>
        </Card>
      </Section>

      <Section title="Motivation">
        <Card>
          <p style={styles.motivation}>{application.motivation}</p>
        </Card>
      </Section>

      {isPending ? (
        <Section
          title="Decision"
          description="Accepting creates the student account if they do not have one, enrols them on the track above, and returns a temporary password to pass on."
        >
          <Card>
            <DecisionForm
              action={reviewApplication}
              id={application.id}
              notesName="reviewNotes"
              notesLabel="Review notes"
              notesHint="Kept on the application for the record. Not shown to the applicant."
              approveLabel="Accept and enrol"
              rejectLabel="Reject"
              approveValue="ACCEPTED"
              rejectValue="REJECTED"
            />
          </Card>
        </Section>
      ) : (
        <Section title="Decision">
          <Card>
            <DetailList>
              <DetailRow label="Outcome">{humanStatus(application.status)}</DetailRow>
              {application.reviewedAt ? (
                <DetailRow label="Reviewed">{formatDateTime(application.reviewedAt)}</DetailRow>
              ) : null}
              {application.reviewNotes ? (
                <DetailRow label="Notes">{application.reviewNotes}</DetailRow>
              ) : null}
            </DetailList>
          </Card>
        </Section>
      )}
    </div>
  );
}

const styles = {
  link: {
    color: 'var(--primary)',
    textDecoration: 'none',
  },
  motivation: {
    color: 'var(--textMuted)',
    fontSize: font.small,
    lineHeight: 1.75,
    whiteSpace: 'pre-wrap',
  },
} satisfies Record<string, React.CSSProperties>;
