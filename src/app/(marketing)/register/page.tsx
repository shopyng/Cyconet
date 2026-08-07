import type { Metadata } from 'next';
import PageHeader from '@/components/layout/PageHeader';
import RegisterForm from '@/components/forms/RegisterForm';
import SectionShell from '@/components/ui/SectionShell';
import { routes } from '@/lib/routes';
import { breadcrumbJsonLd } from '@/lib/seo';
import { db } from '@/lib/db';
import { formatNaira, paymentDetails } from '@/lib/content';
import { color, font, radius } from '@/lib/theme';

const TRAIL = [
  { name: 'Home', path: routes.home },
  { name: 'Register', path: routes.register },
];

export const metadata: Metadata = {
  title: 'Register — Create your Cyconet student account',
  description:
    'Create a Cyconet student account, reserve your place on a track, and pay your tuition by bank transfer. Cybersecurity, software engineering, data science, AI and cloud.',
  alternates: { canonical: routes.register },
  openGraph: {
    type: 'website',
    url: routes.register,
    title: 'Register with Cyconet',
    description: 'Create your student account and reserve a place on the next cohort.',
  },
};

/**
 * Self-serve registration.
 *
 * Programmes and their fees come from the database rather than content.ts, so
 * the price quoted here is the one the payment screen will bill — a hardcoded
 * marketing figure would drift from `Program.priceKobo` the first time staff
 * changed it in the admin.
 */
export default async function RegisterPage() {
  const programs = await db.program.findMany({
    select: { id: true, title: true, duration: true, priceKobo: true },
    orderBy: { title: 'asc' },
  });

  const options = programs.map((program) => ({
    value: program.id,
    label:
      program.priceKobo > 0
        ? `${program.title} — ${program.duration}, ${formatNaira(program.priceKobo)}`
        : `${program.title} — ${program.duration}`,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(TRAIL) }}
      />

      <PageHeader
        trail={TRAIL}
        eyebrow="Enrolment"
        title="Create your"
        titleAccent="student account."
        lead="Register, reserve your place, and pay by transfer. You will have access to the learning hub the moment we confirm your payment."
        meta={['No degree required', 'Places capped at 24', 'Pay by bank transfer']}
      />

      <SectionShell id="register" eyebrow="Registration" heading="Reserve your" headingAccent="place.">
        <div style={styles.layout}>
          <div style={styles.formCard}>
            <RegisterForm programs={options} />
          </div>

          <aside style={styles.aside} aria-labelledby="how-it-works-heading">
            <h3 id="how-it-works-heading" style={styles.asideTitle}>
              How enrolment works
            </h3>

            <ol style={styles.steps}>
              {STEPS.map((step, index) => (
                <li key={step.title} style={styles.step}>
                  <span aria-hidden="true" style={styles.stepNum}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p style={styles.stepTitle}>{step.title}</p>
                    <p style={styles.stepMeta}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div style={styles.bank}>
              <p style={styles.bankLabel}>Tuition is paid to</p>
              <p style={styles.bankName}>{paymentDetails.accountName}</p>
              <p style={styles.bankMeta}>
                {paymentDetails.bankName} · {paymentDetails.accountNumber}
              </p>
              <p style={styles.bankNote}>
                Your personal payment reference is generated after you register — quote it on
                the transfer so we can match it to your account.
              </p>
            </div>
          </aside>
        </div>
      </SectionShell>
    </>
  );
}

const STEPS = [
  {
    title: 'Create your account',
    body: 'Pick your track and set a password. Your place is reserved immediately.',
  },
  {
    title: 'Transfer the tuition',
    body: 'We show you the fee, our account details and a reference unique to you.',
  },
  {
    title: 'Upload your proof of payment',
    body: 'A photo of the receipt or a PDF from your banking app is enough.',
  },
  {
    title: 'We verify and unlock',
    body: 'Once admissions confirms the transfer, the full learning hub opens up.',
  },
] as const;

const styles = {
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1.75rem',
    alignItems: 'start',
  },
  formCard: {
    padding: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.xl,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  aside: {
    padding: 'clamp(1.35rem, 1.1rem + 1vw, 1.9rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
  },
  asideTitle: {
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
    marginTop: '1.35rem',
  },
  step: {
    display: 'flex',
    gap: '0.9rem',
  },
  stepNum: {
    flexShrink: 0,
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '0.85rem',
    fontWeight: 800,
    color: color.cyan,
  },
  stepTitle: {
    fontSize: '0.96rem',
    fontWeight: 600,
    color: color.text,
  },
  stepMeta: {
    marginTop: '0.2rem',
    fontSize: '0.84rem',
    lineHeight: 1.6,
    color: color.textMuted,
  },
  bank: {
    marginTop: '1.75rem',
    paddingTop: '1.35rem',
    borderTop: `1px solid ${color.border}`,
  },
  bankLabel: {
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: color.textFaint,
  },
  bankName: {
    marginTop: '0.45rem',
    fontSize: '0.98rem',
    fontWeight: 600,
    color: color.text,
  },
  bankMeta: {
    marginTop: '0.15rem',
    fontSize: '0.9rem',
    color: color.cyan,
  },
  bankNote: {
    marginTop: '0.7rem',
    fontSize: '0.82rem',
    lineHeight: 1.6,
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
