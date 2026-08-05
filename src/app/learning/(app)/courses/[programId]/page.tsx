import { notFound } from 'next/navigation';
import { programForStudent, myCompletedLessonIds } from '@/lib/dal';
import {
  PageTitle,
  BackLink,
  Card,
  EmptyState,
  ProgressBar,
  Badge,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course' };

/**
 * One programme's curriculum: modules in order, lessons within them.
 *
 * `programForStudent` returns null for a programme this student is not
 * enrolled on, and notFound() renders the same 404 as a non-existent ID —
 * so the page never confirms that a course exists to someone without access.
 */
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  const [program, completedIds] = await Promise.all([
    programForStudent(programId),
    myCompletedLessonIds(),
  ]);

  if (!program) notFound();

  const lessons = program.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => completedIds.has(l.id)).length;

  // The first unfinished lesson in curriculum order — what "continue" means.
  const nextLesson = lessons.find((l) => !completedIds.has(l.id));

  return (
    <>
      <PageTitle title={program.title} lede={program.description}>
        <BackLink href="/courses" label="All courses" />
      </PageTitle>

      <div style={{ marginTop: '1.5rem', maxWidth: 640 }}>
        <ProgressBar done={done} total={lessons.length} label="Lesson progress" />
      </div>

      {nextLesson ? (
        <p style={{ marginTop: '1rem' }}>
          <a href={`/lessons/${nextLesson.id}`} style={styles.cta}>
            {done === 0 ? 'Start' : 'Continue'}: {nextLesson.title} →
          </a>
        </p>
      ) : lessons.length > 0 ? (
        <p style={styles.doneNote}>Every lesson on this programme is complete.</p>
      ) : null}

      {program.modules.length === 0 ? (
        <div style={{ marginTop: '1.75rem' }}>
          <EmptyState
            title="Curriculum coming soon"
            body="No modules have been published for this programme yet. Your instructor will add them before the cohort begins."
          />
        </div>
      ) : (
        <div style={styles.modules}>
          {program.modules.map((module) => {
            const moduleDone = module.lessons.filter((l) => completedIds.has(l.id)).length;
            const allDone = module.lessons.length > 0 && moduleDone === module.lessons.length;

            return (
              <Card key={module.id}>
                <div style={styles.moduleHead}>
                  <div style={{ minWidth: 0 }}>
                    <span style={styles.eyebrow}>Module {module.order}</span>
                    <h2 style={styles.moduleTitle}>{module.title}</h2>
                  </div>
                  <Badge tone={allDone ? 'positive' : 'neutral'}>
                    {moduleDone}/{module.lessons.length}
                  </Badge>
                </div>

                <p style={styles.moduleDesc}>{module.description}</p>

                {module.lessons.length === 0 ? (
                  <p style={styles.noLessons}>No lessons in this module yet.</p>
                ) : (
                  <ol style={styles.lessonList}>
                    {module.lessons.map((lesson) => {
                      const complete = completedIds.has(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <a href={`/lessons/${lesson.id}`} style={styles.lessonLink}>
                            <span
                              aria-hidden="true"
                              style={{ color: complete ? color.cyan : color.textFaint }}
                            >
                              {complete ? '●' : '○'}
                            </span>
                            <span style={styles.lessonTitle}>{lesson.title}</span>
                            {complete ? (
                              <span style={styles.completeTag}>Complete</span>
                            ) : null}
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

const styles = {
  cta: {
    color: color.cyan,
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
  doneNote: {
    marginTop: '1rem',
    fontSize: font.small,
    color: color.textMuted,
  },
  modules: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '1.75rem',
  },
  moduleHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
  },
  moduleTitle: {
    marginTop: '0.15rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
  },
  moduleDesc: {
    marginTop: '0.5rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: color.textMuted,
  },
  noLessons: {
    marginTop: '1rem',
    fontSize: font.small,
    color: color.textFaint,
  },
  lessonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    margin: '1.1rem 0 0',
    padding: 0,
    listStyle: 'none',
  },
  lessonLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.6rem 0.7rem',
    borderRadius: 8,
    color: 'inherit',
    fontSize: font.small,
    textDecoration: 'none',
  },
  lessonTitle: {
    color: color.text,
    minWidth: 0,
  },
  completeTag: {
    marginLeft: 'auto',
    fontSize: font.eyebrow,
    color: color.textFaint,
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, React.CSSProperties>;
