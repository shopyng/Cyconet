import { allPayments } from '@/lib/dal';
import { reviewPayment } from '@/lib/admin-actions';
import { formatNaira } from '@/lib/content';
import { DecisionForm } from '@/components/app/ActionForms';
import {
  PageTitle,
  Card,
  Section,
  Badge,
  EmptyState,
  DataTable,
  Avatar,
  formatDateTime,
  type BadgeTone,
} from '@/components/app/Primitives';
import { font, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payments' };

const STATUS_TONE: Record<string, BadgeTone> = {
  AWAITING_PROOF: 'neutral',
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'critical',
};

const STATUS_LABEL: Record<string, string> = {
  AWAITING_PROOF: 'Awaiting proof',
  PENDING: 'Needs review',
  APPROVED: 'Confirmed',
  REJECTED: 'Rejected',
};

/**
 * Tuition payment queue.
 *
 * Split into "needs review" and everything else rather than one long table:
 * confirming a payment is what enrols a student, so the receipts waiting on a
 * decision are the whole job and should not be mixed in with settled history.
 */
export default async function AdminPaymentsPage() {
  const payments = await allPayments();

  const needsReview = payments.filter((payment) => payment.status === 'PENDING');
  const settled = payments.filter((payment) => payment.status !== 'PENDING');

  const total = payments
    .filter((payment) => payment.status === 'APPROVED')
    .reduce((sum, payment) => sum + payment.amountKobo, 0);

  return (
    <>
      <PageTitle
        title="Payments"
        lede="Confirm a transfer to enrol the student on their programme."
      />

      <Section
        title={`Needs review (${needsReview.length})`}
        description="A receipt has been uploaded and is waiting on a decision."
      >
        {needsReview.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            body="Receipts appear here as soon as a student uploads one. Confirming a payment opens the programme for them straight away."
          />
        ) : (
          <div style={styles.list}>
            {needsReview.map((payment) => (
              <Card key={payment.id} tone="warning">
                <div style={styles.head}>
                  <div style={styles.who}>
                    <Avatar name={payment.user.name} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <p style={styles.name}>{payment.user.name}</p>
                      <p style={styles.email}>{payment.user.email}</p>
                    </div>
                  </div>
                  <span style={styles.amount}>{formatNaira(payment.amountKobo)}</span>
                </div>

                <dl style={styles.meta}>
                  <Meta label="Programme" value={payment.program.title} />
                  <Meta label="Reference" value={payment.reference} mono />
                  <Meta label="Registered" value={formatDateTime(payment.createdAt)} />
                  <Meta
                    label="Uploaded"
                    value={
                      payment.proof ? formatDateTime(payment.proof.uploadedAt) : 'No file'
                    }
                  />
                </dl>

                {payment.proof ? (
                  <div style={styles.proof}>
                    {/*
                      Opens in a new tab rather than embedding: the receipt may
                      be a PDF, and an <img> cannot render one. The route sets
                      a restrictive CSP and nosniff, so this is safe to view.
                    */}
                    <a
                      href={`/api/payments/${payment.id}/proof`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.proofLink}
                    >
                      View receipt — {payment.proof.fileName}
                    </a>
                    <span style={styles.proofMeta}>
                      {payment.proof.mimeType} · {Math.round(payment.proof.size / 1024)} KB
                    </span>
                  </div>
                ) : null}

                <div style={styles.decision}>
                  <DecisionForm
                    action={reviewPayment}
                    id={payment.id}
                    notesName="reviewNotes"
                    notesLabel="Notes"
                    notesHint="Required when rejecting — the student sees this and re-uploads against it."
                    approveLabel="Confirm payment"
                    rejectLabel="Reject"
                    approveValue="APPROVED"
                    rejectValue="REJECTED"
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="All payments"
        description={`${formatNaira(total)} confirmed across ${payments.length} record${
          payments.length === 1 ? '' : 's'
        }.`}
      >
        <DataTable
          rows={settled}
          rowKey={(payment) => payment.id}
          empty={
            <EmptyState
              title="No payment history yet"
              body="Every confirmed, rejected and outstanding payment will be listed here."
            />
          }
          columns={[
            {
              key: 'student',
              label: 'Student',
              cell: (payment) => (
                <div>
                  <div style={styles.cellName}>{payment.user.name}</div>
                  <div style={styles.cellSub}>{payment.user.email}</div>
                </div>
              ),
            },
            {
              key: 'programme',
              label: 'Programme',
              cell: (payment) => payment.program.title,
            },
            {
              key: 'amount',
              label: 'Amount',
              cell: (payment) => formatNaira(payment.amountKobo),
            },
            {
              key: 'reference',
              label: 'Reference',
              cell: (payment) => <span style={styles.mono}>{payment.reference}</span>,
            },
            {
              key: 'status',
              label: 'Status',
              cell: (payment) => (
                <Badge tone={STATUS_TONE[payment.status] ?? 'neutral'}>
                  {STATUS_LABEL[payment.status] ?? payment.status}
                </Badge>
              ),
            },
            {
              key: 'reviewed',
              label: 'Reviewed',
              cell: (payment) =>
                payment.reviewedAt ? formatDateTime(payment.reviewedAt) : '—',
            },
          ]}
        />
      </Section>
    </>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt style={styles.metaLabel}>{label}</dt>
      <dd style={{ ...styles.metaValue, ...(mono ? styles.mono : null) }}>{value}</dd>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  who: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
  },
  name: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  email: {
    fontSize: font.small,
    color: 'var(--textMuted)',
    overflowWrap: 'anywhere',
  },
  amount: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  meta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
    gap: '1rem',
    margin: '1.25rem 0 0',
    paddingTop: '1.25rem',
    borderTop: '1px solid var(--border)',
  },
  metaLabel: {
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  metaValue: {
    margin: '0.2rem 0 0',
    fontSize: font.small,
    color: 'var(--text)',
    overflowWrap: 'anywhere',
  },
  mono: {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    letterSpacing: '0.05em',
  },
  proof: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginTop: '1.1rem',
    padding: '0.75rem 0.95rem',
    borderRadius: radius.sm,
    background: 'var(--surfaceSunken)',
  },
  proofLink: {
    color: 'var(--primary)',
    fontSize: font.small,
    fontWeight: 600,
    textDecoration: 'none',
    overflowWrap: 'anywhere',
  },
  proofMeta: {
    fontSize: font.eyebrow,
    color: 'var(--textFaint)',
  },
  decision: {
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid var(--border)',
  },
  cellName: {
    fontWeight: 600,
    color: 'var(--text)',
  },
  cellSub: {
    fontSize: '0.82rem',
    color: 'var(--textMuted)',
  },
} satisfies Record<string, React.CSSProperties>;
