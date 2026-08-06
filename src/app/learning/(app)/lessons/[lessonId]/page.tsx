import { notFound } from 'next/navigation';
import { lessonForStudent } from '@/lib/dal';
import { setLessonProgress } from '@/lib/learning-actions';
import Markdown, { MarkdownStyles } from '@/components/app/Markdown';
import { ActionButton } from '@/components/app/ActionForms';
import { BackLink, Badge, Card } from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Lesson' };

/**
 * A single lesson: body, video link, completion toggle, prev/next.
 *
 * Lessons sit at /learning/lessons/[id] rather than nested under the course
 * path. A lesson ID already identifies its module and programme, so the nested
 * form would carry two segments that must agree with the third — and a
 * mismatch between them has no sensible meaning.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  const result = await lessonForStudent(lessonId);
  // Null covers both "no such lesson" and "not enrolled" — same 404 either way,
  // so the page cannot be used to probe which lessons exist.
  if (!result) notFound();

  const { lesson, completed } = result;
  const { module } = lesson;
  const siblings = module.lessons;
  const index = siblings.findIndex((l) => l.id === lesson.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <article style={styles.wrap}>
      <BackLink href={`/courses/${module.programId}`} label={module.program.title} />

      <header style={styles.header}>
        <span style={styles.eyebrow}>
          Module {module.order} · {module.title}
        </span>
        <h1 style={styles.h1}>{lesson.title}</h1>
        <div style={styles.headerMeta}>
          <Badge tone={completed ? 'positive' : 'neutral'}>
            {completed ? 'Complete' : 'Not started'}
          </Badge>
          <span style={styles.position}>
            Lesson {index + 1} of {siblings.length}
          </span>
        </div>
      </header>

      {lesson.videoUrl ? (
        <p style={styles.video}>
          <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" style={styles.videoLink}>
            Watch the lesson video →
          </a>
        </p>
      ) : null}

      {lesson.resources.length > 0 ? (
        <Card>
          <h2 style={styles.actionTitle}>Resources</h2>
          <ul style={styles.resources}>
            {lesson.resources.map((resource) => (
              <li key={resource.id}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" style={styles.videoLink}>
                  {resource.label} →
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div style={styles.body}>
        <Markdown content={lesson.content} />
      </div>

      <Card>
        <h2 style={styles.actionTitle}>
          {completed ? 'Marked complete' : 'Finished this lesson?'}
        </h2>
        <p style={styles.actionBody}>
          {completed
            ? 'This lesson counts towards your certificate. You can undo this if you marked it by mistake.'
            : 'Marking it complete records your progress towards the certificate for this programme.'}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <ActionButton
            action={setLessonProgress}
            fields={{ lessonId: lesson.id, completed: completed ? 'false' : 'true' }}
            label={completed ? 'Mark as incomplete' : 'Mark as complete'}
            pendingLabel="Saving…"
            tone={completed ? 'default' : 'primary'}
          />
        </div>
      </Card>

      <nav style={styles.pager} aria-label="Lesson navigation">
        {previous ? (
          <a href={`/lessons/${previous.id}`} style={styles.pagerLink}>
            <span style={styles.pagerLabel}>Previous</span>
            <span style={styles.pagerTitle}>{previous.title}</span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={`/lessons/${next.id}`} style={{ ...styles.pagerLink, textAlign: 'right' }}>
            <span style={styles.pagerLabel}>Next</span>
            <span style={styles.pagerTitle}>{next.title}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>

      <MarkdownStyles />
    </article>
  );
}

const styles = {
  wrap: {
    maxWidth: 760,
  },
  header: {
    marginTop: '1rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  h1: {
    marginTop: '0.3rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    color: 'var(--text)',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.85rem',
  },
  position: {
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  video: {
    marginTop: '1.5rem',
  },
  videoLink: {
    color: 'var(--primary)',
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
  body: {
    margin: '2rem 0',
  },
  resources: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    margin: '0.8rem 0 0',
    padding: 0,
    listStyle: 'none',
  },
  actionTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  actionBody: {
    marginTop: '0.4rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  pager: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '2rem',
  },
  pagerLink: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    color: 'inherit',
    textDecoration: 'none',
  },
  pagerLabel: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  pagerTitle: {
    fontSize: font.small,
    color: 'var(--primary)',
  },
} satisfies Record<string, React.CSSProperties>;
