import type { Metadata } from 'next';
import PageHeader from '@/components/layout/PageHeader';
import Hub from '@/components/sections/Hub';
import TourForm from '@/components/forms/TourForm';
import SectionShell from '@/components/ui/SectionShell';
import Button from '@/components/ui/Button';
import { ArrowRight } from '@/components/ui/Icons';
import { routes } from '@/lib/routes';
import { breadcrumbJsonLd } from '@/lib/seo';
import { brand } from '@/lib/content';
import { color, radius } from '@/lib/theme';

const TRAIL = [
  { name: 'Home', path: routes.home },
  { name: 'Co-Working Hub', path: routes.hub },
];

export const metadata: Metadata = {
  title: 'Co-Working Space in Ibadan — Fibre, Backup Power, 24/7 Access',
  description:
    'Cyconet Hub is a co-working tech hub on Akala Expressway, Ibadan. Fibre internet, full backup power, 24/7 secure access, meeting rooms and a 120-seat event floor. Day passes to private team suites.',
  alternates: { canonical: routes.hub },
  openGraph: {
    type: 'website',
    url: routes.hub,
    title: 'Cyconet Hub — Co-Working Tech Hub, Ibadan',
    description:
      'A workspace built for people who build. Fibre, backup power, 24/7 access and a community of working engineers.',
  },
};

export default function HubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(TRAIL) }}
      />

      <PageHeader
        trail={TRAIL}
        eyebrow="Co-Working Tech Hub"
        title="A desk on Akala Expressway,"
        titleAccent="among people who build."
        lead="Reliable power and fibre are the baseline, not the pitch. What you are actually paying for is the room: engineers, founders and graduates who are working on hard things and will happily look at yours."
        meta={['24/7 secure access', 'Fibre + full backup power', 'Day pass to private suite']}
      >
        <Button href="#tour" size="lg" trailing={<ArrowRight />}>
          Book a tour
        </Button>
      </PageHeader>

      <Hub />

      <SectionShell
        id="tour"
        eyebrow="Visit"
        heading="Come and see it"
        headingAccent="first."
        lead={`Tours run Monday to Saturday at ${brand.address.street}, ${brand.address.locality}. Bring a laptop and work a few hours on us.`}
      >
        <div style={styles.formCard}>
          <TourForm />
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
