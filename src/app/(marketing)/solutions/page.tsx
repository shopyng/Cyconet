import type { Metadata } from 'next';
import PageHeader from '@/components/layout/PageHeader';
import Solutions from '@/components/sections/Solutions';
import EnquiryForm from '@/components/forms/EnquiryForm';
import SectionShell from '@/components/ui/SectionShell';
import Button from '@/components/ui/Button';
import { ArrowRight } from '@/components/ui/Icons';
import { routes } from '@/lib/routes';
import { breadcrumbJsonLd } from '@/lib/seo';
import { color, radius } from '@/lib/theme';

const TRAIL = [
  { name: 'Home', path: routes.home },
  { name: 'Solutions', path: routes.solutions },
];

export const metadata: Metadata = {
  title: 'Tech Solutions Agency in Ibadan — Software, Security & Cloud',
  description:
    'Cyconet Solutions builds software, runs security audits and delivers cloud migrations for clients across Nigeria. Senior-led engagements, documented handover, no lock-in.',
  alternates: { canonical: routes.solutions },
  openGraph: {
    type: 'website',
    url: routes.solutions,
    title: 'Cyconet Solutions — Tech Solutions Agency, Ibadan',
    description:
      'Security audits and penetration testing, custom software, cloud and DevOps engineering, and data and AI consulting.',
  },
};

export default function SolutionsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(TRAIL) }}
      />

      <PageHeader
        trail={TRAIL}
        eyebrow="Tech Solutions Agency"
        title="Hire the team that"
        titleAccent="teaches it."
        lead="Our agency delivers security, software, cloud and data engagements from Akala Expressway in Ibadan. The same engineers teach in the academy upstairs, which is why the curriculum never goes stale — and why your project gets people who are still sharp."
        meta={['Senior-led', 'Fixed-scope or retained', 'Full handover documentation']}
      >
        <Button href="#enquiry" size="lg" trailing={<ArrowRight />}>
          Start a project
        </Button>
      </PageHeader>

      <Solutions />

      <SectionShell
        id="enquiry"
        eyebrow="Start a project"
        heading="Tell us what you're"
        headingAccent="trying to do."
        lead="A short description is enough to start. We will come back within one working day with questions and an honest view of whether we are the right fit."
      >
        <div style={styles.formCard}>
          <EnquiryForm />
        </div>
      </SectionShell>
    </>
  );
}

const styles = {
  formCard: {
    maxWidth: 780,
    padding: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.xl,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
} satisfies Record<string, React.CSSProperties>;
