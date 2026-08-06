import { notFound } from 'next/navigation';
import { programForAdmin } from '@/lib/dal';
import {
  deleteCurriculumItem,
  saveExam,
  saveLesson,
  saveModule,
  saveProject,
  saveQuestion,
} from '@/lib/admin-actions';
import {
  ActionButton,
  ExamForm,
  LessonForm,
  ModuleForm,
  ProjectForm,
  QuestionForm,
} from '@/components/app/ActionForms';
import {
  PageTitle,
  BackLink,
  Card,
  Badge,
  Section,
} from '@/components/app/Primitives';
import { font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Programme curriculum' };

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  const program = await programForAdmin(programId);
  if (!program) notFound();

  const lessonCount = program.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div style={{ maxWidth: 820 }}>
      <PageTitle title={program.title} lede={program.description}>
        <BackLink href="/curriculum" label="All programmes" />
      </PageTitle>

      <div style={styles.summary}>
        <Badge tone="accent">{program.duration}</Badge>
        <span style={styles.faint}>
          {program._count.enrollments}{' '}
          {program._count.enrollments === 1 ? 'student' : 'students'} enrolled
        </span>
      </div>

      <Section title={`Modules (${program.modules.length})`}>
        <Card>
          <ModuleForm
            action={saveModule}
            programId={program.id}
            nextOrder={program.modules.length + 1}
          />
        </Card>

        {program.modules.length === 0 ? (
          <Card>
            <p style={styles.muted}>
              No modules published. Students on this programme see an empty curriculum and
              can never complete it.
            </p>
          </Card>
        ) : (
          <div style={styles.list}>
            {program.modules.map((module) => (
              <Card key={module.id}>
                <div style={styles.head}>
                  <div style={{ minWidth: 0 }}>
                    <span style={styles.eyebrow}>Module {module.order}</span>
                    <h3 style={styles.title}>{module.title}</h3>
                  </div>
                  <Badge tone={module.lessons.length === 0 ? 'warning' : 'neutral'}>
                    {module.lessons.length}{' '}
                    {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                  </Badge>
                </div>

                <p style={styles.desc}>{module.description}</p>

                {module.lessons.length > 0 ? (
                  <ol style={styles.lessonList}>
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} style={styles.lessonItem}>
                        <span style={styles.lessonOrder}>{lesson.order}</span>
                        <span style={{ color: 'var(--text)' }}>{lesson.title}</span>
                        {lesson.videoUrl ? (
                          <span style={styles.right}>
                            <Badge tone="accent">Video</Badge>
                          </span>
                        ) : null}
                        {lesson.resources.length > 0 ? (
                          <span>
                            <Badge tone="neutral">
                              {lesson.resources.length}{' '}
                              {lesson.resources.length === 1 ? 'resource' : 'resources'}
                            </Badge>
                          </span>
                        ) : null}
                        <span style={styles.lessonEdit}>
                          <LessonForm
                            action={saveLesson}
                            moduleId={module.id}
                            nextOrder={lesson.order}
                            initial={lesson}
                          />
                          <ActionButton
                            action={deleteCurriculumItem}
                            fields={{ type: 'lesson', id: lesson.id }}
                            label="Delete lesson"
                            pendingLabel="Deleting…"
                            tone="danger"
                            confirm={`Delete lesson "${lesson.title}"?`}
                          />
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                <div style={styles.formBlock}>
                  <LessonForm
                    action={saveLesson}
                    moduleId={module.id}
                    nextOrder={module.lessons.length + 1}
                  />
                  <ModuleForm
                    action={saveModule}
                    programId={program.id}
                    nextOrder={module.order}
                    initial={module}
                  />
                  <ActionButton
                    action={deleteCurriculumItem}
                    fields={{ type: 'module', id: module.id }}
                    label="Delete module"
                    pendingLabel="Deleting…"
                    tone="danger"
                    confirm={`Delete module "${module.title}" and its lessons?`}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Exams (${program.exams.length})`}>
        <Card>
          <ExamForm action={saveExam} programId={program.id} />
        </Card>

        {program.exams.length === 0 ? (
          <Card>
            <p style={styles.muted}>
              No exams published. Certificates for this programme cannot be gated on an
              assessment until one exists.
            </p>
          </Card>
        ) : (
          <Card>
            <ul style={styles.plainList}>
              {program.exams.map((exam) => (
                <li key={exam.id} style={styles.stackedItem}>
                  <div style={styles.plainItem}>
                    <span style={{ color: 'var(--text)' }}>{exam.title}</span>
                    <Badge tone={exam.questions.length === 0 ? 'warning' : 'neutral'}>
                      {exam.questions.length}{' '}
                      {exam.questions.length === 1 ? 'question' : 'questions'}
                    </Badge>
                    <span style={styles.right}>pass mark {exam.passingScore}%</span>
                  </div>
                  <QuestionForm
                    action={saveQuestion}
                    examId={exam.id}
                    nextOrder={exam.questions.length + 1}
                  />
                  <ExamForm action={saveExam} programId={program.id} initial={exam} />
                  {exam.questions.map((question) => (
                    <div key={question.id} style={styles.formBlock}>
                      <QuestionForm
                        action={saveQuestion}
                        examId={exam.id}
                        nextOrder={question.order}
                        initial={question}
                      />
                      <ActionButton
                        action={deleteCurriculumItem}
                        fields={{ type: 'question', id: question.id }}
                        label="Delete question"
                        pendingLabel="Deleting…"
                        tone="danger"
                        confirm="Delete this exam question?"
                      />
                    </div>
                  ))}
                  <ActionButton
                    action={deleteCurriculumItem}
                    fields={{ type: 'exam', id: exam.id }}
                    label="Delete exam"
                    pendingLabel="Deleting…"
                    tone="danger"
                    confirm={`Delete exam "${exam.title}" and all questions?`}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>

      <Section title={`Projects (${program.projects.length})`}>
        <Card>
          <ProjectForm action={saveProject} programId={program.id} />
        </Card>

        {program.projects.length === 0 ? (
          <Card>
            <p style={styles.muted}>No project briefs published for this programme.</p>
          </Card>
        ) : (
          <Card>
            <ul style={styles.plainList}>
              {program.projects.map((project) => (
                <li key={project.id} style={styles.plainItem}>
                  <span style={{ color: 'var(--text)' }}>{project.title}</span>
                  {project.rubricItems.length > 0 ? (
                    <Badge tone="accent">
                      {project.rubricItems.reduce((sum, item) => sum + item.points, 0)} pts
                    </Badge>
                  ) : null}
                  <span style={styles.right}>{project.description.slice(0, 60)}…</span>
                  <span style={{ width: '100%' }}>
                    <ProjectForm action={saveProject} programId={program.id} initial={project} />
                  </span>
                  <ActionButton
                    action={deleteCurriculumItem}
                    fields={{ type: 'project', id: project.id }}
                    label="Delete project"
                    pendingLabel="Deleting…"
                    tone="danger"
                    confirm={`Delete project "${project.title}"?`}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>

      <p style={styles.footnote}>
        {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'} in total. Curriculum content
        is authored in <code style={styles.code}>prisma/seed.ts</code> and applied with{' '}
        <code style={styles.code}>npx prisma db seed</code>.
      </p>
    </div>
  );
}

const styles = {
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    marginTop: '0.9rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  title: {
    marginTop: '0.15rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  desc: {
    marginTop: '0.5rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  lessonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    margin: '1rem 0 0',
    padding: 0,
    listStyle: 'none',
  },
  lessonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  lessonEdit: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border)',
  },
  lessonOrder: {
    minWidth: '1.2rem',
    color: 'var(--textFaint)',
  },
  formBlock: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)',
  },
  plainList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  stackedItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border)',
  },
  plainItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    fontSize: font.small,
  },
  right: {
    marginLeft: 'auto',
    color: 'var(--textFaint)',
  },
  faint: {
    color: 'var(--textFaint)',
  },
  muted: {
    fontSize: font.small,
    lineHeight: 1.6,
    color: 'var(--textMuted)',
  },
  footnote: {
    marginTop: '2rem',
    fontSize: font.small,
    lineHeight: 1.7,
    color: 'var(--textFaint)',
  },
  code: {
    padding: '0.1em 0.35em',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--primaryHover)',
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    fontSize: '0.85em',
  },
} satisfies Record<string, React.CSSProperties>;
