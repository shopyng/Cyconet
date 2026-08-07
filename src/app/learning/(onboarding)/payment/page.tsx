import { redirect } from 'next/navigation';
import { myPendingPayment, verifySession } from '@/lib/dal';
import { db } from '@/lib/db';
import { formatNaira, paymentDetails } from '@/lib/content';
import PaymentProofForm from '@/components/app/PaymentProofForm';
import {
  PageTitle,
  Card,
  Alert,
  Badge,
  Stepper,
  formatDateTime,
} from '@/components/app/Primitives';
import { font, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Complete your payment' };

/**
 * The payment gate.
 *
 * Everything a registered student needs to pay and prove it: the fee, where to
 * send it, the reference that ties the transfer back to their account, and the
 * upload. Which step they are on is derived from `Payment.status` rather than
 * stored separately, so the screen cannot disagree with the record.
 */
export default async function PaymentPage() {
  const user = await verifySession();
  const payment = await myPendingPayment();

  /*
   * Nothing outstanding. Either they have paid — in which case the hub is open
   * and this screen is a dead end — or an admin enrolled them directly and no
   * payment row was ever created. Both belong at the dashboard.
   */
  if (!payment) {
    const active = await db.enrollment.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      select: { id: true },
    });
    if (active) redirect('/');

    return (
      <>
        <PageTitle title="Nothing outstanding" />
        <div style={{ marginTop: '1.5rem' }}>
          <Alert tone="info" title="No payment is due">
            There is no outstanding payment on your account, and no active programme either.
            Contact admissions and we will sort it out.
          </Alert>
        </div>
      </>
    );
  }

  const stepIndex =
    payment.status === 'PENDING' ? 2 : payment.status === 'REJECTED' ? 1 : 1;

  return (
    <>
      <PageTitle
        eyebrow="Enrolment"
        title="Complete your payment"
        lede={`Your place on ${payment.program.title} is reserved. The programme unlocks once we confirm your transfer.`}
      />

      <div style={styles.grid}>
        <div style={styles.mainCol}>
          {payment.status === 'PENDING' ? (
            <Alert tone="success" title="Proof received — under review">
              We have your receipt{payment.proof ? ` (${payment.proof.fileName})` : ''} and are
              checking it against our account. This is usually done within one working day, and
              you will get an email the moment it clears.
            </Alert>
          ) : null}

          {payment.status === 'REJECTED' ? (
            <Alert tone="critical" title="We could not confirm that payment">
              {payment.reviewNotes ??
                'The receipt did not match a transfer we can find. Please check the details and upload it again.'}
            </Alert>
          ) : null}

          <Card title="1. Transfer the tuition">
            <dl style={styles.bank}>
              <Row label="Amount" value={formatNaira(payment.amountKobo)} emphasis />
              <Row label="Bank" value={paymentDetails.bankName} />
              <Row label="Account name" value={paymentDetails.accountName} />
              <Row label="Account number" value={paymentDetails.accountNumber} mono />
              <Row label="Your reference" value={payment.reference} mono emphasis />
            </dl>

            <p style={styles.note}>
              <strong style={styles.noteStrong}>Quote the reference on the transfer.</strong> It
              is what matches your payment to your account — without it we have to reconcile by
              hand, which is slower.
            </p>
          </Card>

          <Card title="2. Upload your proof of payment">
            <p style={styles.cardLede}>
              A screenshot or PDF receipt from your banking app is fine, as long as the amount,
              date and reference are legible.
            </p>
            <PaymentProofForm
              paymentId={payment.id}
              existingFileName={payment.proof?.fileName}
            />
          </Card>
        </div>

        <aside style={styles.aside}>
          <Card title="Where you are">
            <Stepper
              steps={['Account created', 'Transfer tuition', 'Under review', 'Programme unlocked']}
              current={stepIndex}
            />
          </Card>

          <Card title="Your enrolment">
            <dl style={styles.summary}>
              <Row label="Programme" value={payment.program.title} />
              <Row label="Duration" value={payment.program.duration} />
              <Row label="Registered" value={formatDateTime(payment.createdAt)} />
              <div style={styles.row}>
                <dt style={styles.label}>Status</dt>
                <dd style={styles.value}>
                  <Badge
                    tone={
                      payment.status === 'PENDING'
                        ? 'warning'
                        : payment.status === 'REJECTED'
                          ? 'critical'
                          : 'neutral'
                    }
                  >
                    {payment.status === 'PENDING'
                      ? 'Awaiting review'
                      : payment.status === 'REJECTED'
                        ? 'Needs another receipt'
                        : 'Awaiting payment'}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <p style={styles.help}>
            Something not right? Email{' '}
            <a href="mailto:cyconet@outlook.com" style={styles.link}>
              cyconet@outlook.com
            </a>{' '}
            quoting <span style={styles.mono}>{payment.reference}</span>.
          </p>
        </aside>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div style={styles.row}>
      <dt style={styles.label}>{label}</dt>
      <dd
        style={{
          ...styles.value,
          ...(mono ? styles.mono : null),
          ...(emphasis ? styles.emphasis : null),
        }}
      >
        {value}
      </dd>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    // One column until there is genuinely room for two — the bank details are
    // the primary task and must not be squeezed by a sidebar.
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1.25rem',
    alignItems: 'start',
    marginTop: '1.75rem',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    minWidth: 0,
  },
  aside: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    minWidth: 0,
  },
  bank: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
    margin: 0,
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
    margin: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBottom: '0.7rem',
    borderBottom: '1px solid var(--border)',
  },
  label: {
    flex: 'none',
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  value: {
    margin: 0,
    fontSize: font.small,
    color: 'var(--text)',
    textAlign: 'right',
    overflowWrap: 'anywhere',
  },
  mono: {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    letterSpacing: '0.06em',
  },
  emphasis: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--primary)',
  },
  note: {
    marginTop: '1.1rem',
    padding: '0.8rem 0.95rem',
    borderRadius: radius.sm,
    background: 'var(--warningSoft)',
    fontSize: '0.86rem',
    lineHeight: 1.6,
    color: 'var(--text)',
  },
  noteStrong: {
    color: 'var(--text)',
  },
  cardLede: {
    marginBottom: '1.1rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  help: {
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  link: {
    color: 'var(--primary)',
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
