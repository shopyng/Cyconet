import { myEnrollments, myCompletedLessonIds } from '@/lib/dal';
import { PageTitle, Card, EmptyState, ProgressBar, Badge } from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Courses' };

/**
 * Course index — one card per enrolled programme.
 *
 * Deliberately not a list of every programme Cyconet offers: this is the
 * student's own shelf. Marketing pages under /programs cover the catalogue.
 */
export default async function CoursesPage() {
  const [enrollments, completedIds] = await Promise.all([
    myEnrollments(),
    myCompletedLessonIds(),
  ]);

  if (enrollments.length === 0) {
    return (
      <>
        <PageTitle title="Courses" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No courses yet"
            body="Once admissions accept your application, the programme you were accepted onto appears here with its full curriculum."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Courses"
        lede={
          enrollments.length === 1
            ? 'Your programme and its curriculum.'
            : `Your ${enrollments.length} programmes and their curricula.`
        }
      />

      <div style={styles.grid}>
        {enrollments.map(({ program }) => {
          const lessons = program.modules.flatMap((m) => m.lessons);
          const done = lessons.filter((l) => completedIds.has(l.id)).length;

          return (
            <Card key={program.id}>
              <div style={styles.cardHead}>
                <h2 style={styles.cardTitle}>{program.title}</h2>
                <Badge tone="accent">{program.duration}</Badge>
              </div>

              <p style={styles.desc}>{program.description}</p>

              <ProgressBar
                done={done}
                total={lessons.length}
                label={`${program.title} lesson progress`}
              />

              <p style={styles.meta}>
                {program.modules.length}{' '}
                {program.modules.length === 1 ? 'module' : 'modules'} · {lessons.length}{' '}
                {lessons.length === 1 ? 'lesson' : 'lessons'}
              </p>

              <a href={`/courses/${program.id}`} style={styles.link}>
                {done === 0 ? 'Start course' : done === lessons.length ? 'Review course' : 'Continue'} →
              </a>
            </Card>
          );
        })}
      </div>
    </>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: '1.25rem',
    marginTop: '1.75rem',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  cardTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: 'var(--text)',
  },
  desc: {
    marginTop: '0.6rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  meta: {
    marginTop: '0.35rem',
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  link: {
    marginTop: '1.1rem',
    color: 'var(--primary)',
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
