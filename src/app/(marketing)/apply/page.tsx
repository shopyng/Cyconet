import type { Metadata } from 'next';
import PageHeader from '@/components/layout/PageHeader';
import ApplicationForm from '@/components/forms/ApplicationForm';
import SectionShell from '@/components/ui/SectionShell';
import Reveal from '@/components/ui/Reveal';
import { routes } from '@/lib/routes';
import { breadcrumbJsonLd } from '@/lib/seo';
import { admissionSteps } from '@/lib/content';
import { color, font, radius } from '@/lib/theme';

const TRAIL = [
  { name: 'Home', path: routes.home },
  { name: 'Apply', path: routes.apply },
];

export const metadata: Metadata = {
  title: 'Apply to Cyconet — Admissions',
  description:
    'Apply to a Cyconet track in Ibadan. No degree required, no application fee, and a decision within five working days. Cybersecurity, software, data, AI and cloud.',
  alternates: { canonical: routes.apply },
  openGraph: {
    type: 'website',
    url: routes.apply,
    title: 'Apply to Cyconet',
    description:
      'No degree required, no application fee, decision within five working days.',
  },
};

export default function ApplyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(TRAIL) }}
      />

      <PageHeader
        trail={TRAIL}
        eyebrow="Admissions"
        title="Apply to"
        titleAccent="Cyconet."
        lead="One form, about ten minutes. No degree required and no application fee — we care about how you think, not what you have already studied."
        meta={['No application fee', 'Decision in 5 working days', 'Cohort capped at 24']}
      />

      <SectionShell
        id="application"
        eyebrow="Your application"
        heading="Tell us about"
        headingAccent="you."
      >
        <div style={styles.layout}>
          <div style={styles.formCard}>
            <ApplicationForm />
          </div>

          <aside style={styles.aside} aria-labelledby="what-happens-heading">
            <h3 id="what-happens-heading" style={styles.asideTitle}>
              What happens next
            </h3>
            <ol style={styles.steps}>
              {admissionSteps.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 70} style={styles.step}>
                  <span aria-hidden="true" style={styles.stepNum}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p style={styles.stepTitle}>{step.title}</p>
                    <p style={styles.stepMeta}>{step.meta}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </aside>
        </div>
      </SectionShell>
    </>
  );
}

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
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
