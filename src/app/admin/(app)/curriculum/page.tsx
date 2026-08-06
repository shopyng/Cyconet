import { allPrograms } from '@/lib/dal';
import { deleteCurriculumItem, saveProgram } from '@/lib/admin-actions';
import { ActionButton, ProgramForm } from '@/components/app/ActionForms';
import { PageTitle, Card, EmptyState, Badge, Section } from '@/components/app/Primitives';
import { font } from '@/lib/theme';
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

      <Section
        title="Create programme"
        description="Add production programmes here instead of editing seed files."
      >
        <Card>
          <ProgramForm action={saveProgram} />
        </Card>
      </Section>

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

              <a href={`/curriculum/${program.id}`} style={styles.link}>
                View curriculum →
              </a>

              <div style={styles.formBlock}>
                <ProgramForm action={saveProgram} initial={program} />
                <ActionButton
                  action={deleteCurriculumItem}
                  fields={{ type: 'program', id: program.id }}
                  label="Delete programme"
                  pendingLabel="Deleting…"
                  tone="danger"
                  confirm={`Delete ${program.title}? This is blocked if students are enrolled.`}
                />
              </div>
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
      <dd style={{ ...styles.statValue, color: value === 0 ? 'var(--textFaint)' : 'var(--text)' }}>
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
    color: 'var(--text)',
  },
  duration: {
    marginTop: '0.15rem',
    fontSize: font.small,
    color: 'var(--textFaint)',
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
    color: 'var(--textFaint)',
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
    color: 'var(--primary)',
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
  formBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid var(--border)',
  },
} satisfies Record<string, React.CSSProperties>;
