import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import ProgramBody from '@/components/sections/ProgramBody';
import Button from '@/components/ui/Button';
import { ArrowRight } from '@/components/ui/Icons';
import { programs, programDetails } from '@/lib/content';
import { routes, programSlugs } from '@/lib/routes';
import { breadcrumbJsonLd, courseJsonLd } from '@/lib/seo';

/**
 * A dedicated page per track.
 *
 * `generateStaticParams` prerenders one route per slug at build time, and
 * `dynamicParams = false` makes any other slug a 404 rather than an
 * on-demand render — there is a fixed set of courses, so an unknown slug is a
 * mistake, not a cache miss.
 *
 * Cybersecurity is excluded here; it lives at /cybersecurity-academy.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return programSlugs.map((slug) => ({ slug }));
}

function load(slug: string) {
  const program = programs.find((item) => item.id === slug);
  const detail = programDetails[slug];
  if (!program || !detail || !programSlugs.includes(slug)) return null;
  return { program, detail };
}

export async function generateMetadata(
  props: PageProps<'/programs/[slug]'>,
): Promise<Metadata> {
  // params is a Promise as of Next 16 — synchronous access was removed.
  const { slug } = await props.params;
  const data = load(slug);
  if (!data) return {};

  const { program, detail } = data;
  const path = routes.program(slug);

  return {
    title: `${program.title} Course in Ibadan — ${program.duration}`,
    // Trimmed to stay inside the ~155 characters search engines display.
    description: `${program.title} training at Cyconet in Ibadan. ${program.duration}, ${program.level.toLowerCase()}. ${detail.outcomes[0]}, and more.`.slice(
      0,
      158,
    ),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      title: `${program.title} — Cyconet, Ibadan`,
      description: program.description,
    },
  };
}

export default async function ProgramPage(props: PageProps<'/programs/[slug]'>) {
  const { slug } = await props.params;
  const data = load(slug);
  if (!data) notFound();

  const { program, detail } = data;
  const path = routes.program(slug);
  const trail = [
    { name: 'Home', path: routes.home },
    { name: 'Programs', path: '/#programs' },
    { name: program.title, path },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(trail) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: courseJsonLd({
            slug,
            path,
            title: program.title,
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
        trail={trail}
        eyebrow="Program"
        title={program.title}
        lead={detail.overview}
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
