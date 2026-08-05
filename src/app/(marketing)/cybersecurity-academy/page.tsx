import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import ProgramBody from '@/components/sections/ProgramBody';
import Button from '@/components/ui/Button';
import { ArrowRight } from '@/components/ui/Icons';
import { programs, programDetails } from '@/lib/content';
import { routes, FLAGSHIP_SLUG } from '@/lib/routes';
import { breadcrumbJsonLd, courseJsonLd } from '@/lib/seo';

/**
 * The flagship page.
 *
 * "Cybersecurity Academy" is the highest-intent term this business has, so it
 * gets the cleanest URL on the domain rather than sitting at
 * /programs/cybersecurity. That path permanently redirects here (see
 * next.config.ts) so the two never compete for the same queries.
 */

const program = programs.find((item) => item.id === FLAGSHIP_SLUG);
const detail = programDetails[FLAGSHIP_SLUG];

const TRAIL = [
  { name: 'Home', path: routes.home },
  { name: 'Cybersecurity Academy', path: routes.academy },
];

export const metadata: Metadata = {
  title: 'Cybersecurity Academy in Ibadan — 14-Week Training',
  description:
    'Become job-ready in cybersecurity in 14 weeks at Cyconet in Ibadan. Penetration testing, SIEM, incident response and forensics taught in a live attack range. No degree required.',
  alternates: { canonical: routes.academy },
  openGraph: {
    type: 'website',
    url: routes.academy,
    title: 'Cyconet Cybersecurity Academy — Ibadan',
    description:
      'Offensive and defensive security taught in a live attack range. 14 weeks, beginners welcome, job support until you sign an offer.',
  },
};

export default function CybersecurityAcademyPage() {
  // Guards against the content and route maps drifting apart.
  if (!program || !detail) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(TRAIL) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: courseJsonLd({
            slug: program.id,
            path: routes.academy,
            title: 'Cybersecurity Academy',
            description: program.description,
            duration: program.duration,
            level: program.level,
            prerequisites: detail.prerequisites,
            skills: [...program.skills],
            modules: detail.modules,
          }),
        }}
      />

      <PageHeader
        trail={TRAIL}
        eyebrow="Flagship program"
        title="The Cyconet"
        titleAccent="Cybersecurity Academy."
        lead="Fourteen weeks from networking fundamentals to defending live infrastructure against real intrusion scenarios. Beginners welcome, no degree required, and job support that continues until you sign an offer."
        meta={[program.duration, program.level, 'On-site in Ibadan', 'Cohort capped at 24']}
      >
        <Button href="#apply" size="lg" trailing={<ArrowRight />}>
          Apply to this track
        </Button>
        <Button href="#curriculum" variant="secondary" size="lg">
          See the curriculum
        </Button>
      </PageHeader>

      <ProgramBody program={program} detail={detail} />
    </>
  );
}
