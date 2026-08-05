import { allPrograms } from '@/lib/dal';
import { PageTitle, Card, EmptyState, Badge } from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Curriculum' };

/**
 * Curriculum overview — every programme with what has been published on it.
 *
 * Read-only. Programmes, modules and lessons are seeded from `prisma/seed.ts`
 * rather than authored in the browser, so this page reports the shape of the
 * curriculum and flags the gaps; it does not pretend to be an editor.
 */
export default async function CurriculumPage() {
  const programs = await allPrograms();

  if (programs.length === 0) {
    return (
      <>
        <PageTitle title="Curriculum" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No programmes"
            body="Programmes are created by the seed script. Run `npx prisma db seed` to populate them."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Curriculum"
        lede={`${programs.length} ${programs.length === 1 ? 'programme' : 'programmes'} published.`}
      />

      <div style={styles.grid}>
        {programs.map((program) => {
          const lessonCount = program.modules.reduce((sum, m) => sum + m.lessons.length, 0);
          const questionCount = program.exams.reduce((sum, e) => sum + e.questions.length, 0);

          // A programme with no lessons cannot be completed, so no certificate
          // can ever be issued for it — worth surfacing before a cohort starts.
          const incomplete = lessonCount === 0 || program.exams.length === 0;

          return (
            <Card key={program.id}>
              <div style={styles.head}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={styles.title}>{program.title}</h2>
                  <p style={styles.duration}>{program.duration}</p>
                </div>
                {incomplete ? (
                  <Badge tone="warning">Incomplete</Badge>
                ) : (
                  <Badge tone="positive">Ready</Badge>
                )}
              </div>

              <dl style={styles.stats}>
                <Stat label="Modules" value={program.modules.length} />
                <Stat label="Lessons" value={lessonCount} />
                <Stat label="Exams" value={program.exams.length} />
                <Stat label="Questions" value={questionCount} />
                <Stat label="Projects" value={program.projects.length} />
                <Stat label="Enrolled" value={program._count.enrollments} />
              </dl>

              <a href={`/admin/curriculum/${program.id}`} style={styles.link}>
                View curriculum →
              </a>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt style={styles.statLabel}>{label}</dt>
      <dd style={{ ...styles.statValue, color: value === 0 ? color.textFaint : color.text }}>
        {value}
      </dd>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: '1.25rem',
    marginTop: '1.75rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  title: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
  },
  duration: {
    marginTop: '0.15rem',
    fontSize: font.small,
    color: color.textFaint,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.9rem',
    margin: '1.25rem 0 0',
  },
  statLabel: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: color.textFaint,
  },
  statValue: {
    margin: '0.15rem 0 0',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.35rem',
    fontWeight: 700,
  },
  link: {
    display: 'inline-block',
    marginTop: '1.25rem',
    color: color.cyan,
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
