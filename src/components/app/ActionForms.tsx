'use client';

/**
 * Buttons and forms that drive a Server Action.
 *
 * All of these are `useActionState` wrappers, which means they degrade to a
 * plain form POST when JavaScript has not loaded — the same progressive
 * enhancement the marketing forms rely on. The only thing the client adds is
 * a pending label and inline result text without a full navigation.
 */

import { useActionState } from 'react';
import { IDLE_STATE, type FormState } from '@/lib/form-state';
import { FormStatus, TextArea, TextField } from '@/components/forms/Field';
import { ease, radius } from '@/lib/theme';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/* ------------------------------------------------------------------ *
 * Single-button actions
 * ------------------------------------------------------------------ */

/**
 * One button that submits a fixed set of hidden fields.
 *
 * Used for "mark complete", "issue certificate", "remove entry" — anything
 * where the whole interaction is a single irreversible-ish press with no
 * further input.
 */
export function ActionButton({
  action,
  fields,
  label,
  pendingLabel,
  tone = 'default',
  confirm,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  tone?: 'default' | 'primary' | 'danger';
  /** Native confirm() prompt. Skipped entirely without JS, where the POST just runs. */
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (confirm && !window.confirm(confirm)) event.preventDefault();
        }}
      >
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button type="submit" className={`act act-${tone}`} disabled={pending}>
          {pending ? (pendingLabel ?? 'Working…') : label}
        </button>
      </form>

      {state.status !== 'idle' ? (
        <div style={{ marginTop: '0.75rem' }}>
          <FormStatus status={state.status} message={state.message} />
        </div>
      ) : null}

      <ButtonStyles />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Review forms (admin)
 * ------------------------------------------------------------------ */

/**
 * A notes field plus two opposed decisions.
 *
 * Both buttons submit the same form and differ only by the `decision` value
 * they carry, so the notes travel with whichever one is pressed. Two separate
 * forms would drop the notes from the button that did not own the textarea.
 */
export function DecisionForm({
  action,
  id,
  notesName,
  notesLabel,
  notesHint,
  approveLabel,
  rejectLabel,
  approveValue,
  rejectValue,
}: {
  action: Action;
  id: string;
  notesName: string;
  notesLabel: string;
  notesHint?: string;
  approveLabel: string;
  rejectLabel: string;
  approveValue: string;
  rejectValue: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const done = state.status === 'success';

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="id" value={id} />

      <FormStatus status={state.status} message={state.message} />

      {/*
        The form is replaced by its result once a decision lands. Leaving the
        buttons live would invite a second press, and the action rejects
        already-reviewed records anyway — better to not offer the dead end.
      */}
      {done ? null : (
        <>
          <TextArea
            name={notesName}
            label={notesLabel}
            hint={notesHint}
            rows={4}
            error={state.errors?.[notesName]}
            defaultValue={state.values?.[notesName]}
          />

          <div style={styles.row}>
            <button
              type="submit"
              name="decision"
              value={approveValue}
              className="act act-primary"
              disabled={pending}
            >
              {pending ? 'Saving…' : approveLabel}
            </button>
            <button
              type="submit"
              name="decision"
              value={rejectValue}
              className="act act-danger"
              disabled={pending}
            >
              {rejectLabel}
            </button>
          </div>
        </>
      )}

      <ButtonStyles />
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Project submission (student)
 * ------------------------------------------------------------------ */

export function ProjectSubmitForm({
  action,
  projectId,
}: {
  action: Action;
  projectId: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="projectId" value={projectId} />

      <FormStatus status={state.status} message={state.message} />

      <TextField
        name="repoUrl"
        label="Repository URL"
        required
        hint="Where the reviewer can read your code."
        error={state.errors?.repoUrl}
        defaultValue={state.values?.repoUrl}
      />
      <TextField
        name="demoUrl"
        label="Live demo URL"
        hint="A deployed instance, if you have one."
        error={state.errors?.demoUrl}
        defaultValue={state.values?.demoUrl}
      />
      <TextArea
        name="description"
        label="What you built"
        required
        rows={6}
        hint="Approach, trade-offs, and anything you want the reviewer to look at first."
        error={state.errors?.description}
        defaultValue={state.values?.description}
      />

      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>

      <ButtonStyles />
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Timetable entry (admin)
 * ------------------------------------------------------------------ */

export function TimetableForm({
  action,
  programs,
}: {
  action: Action;
  programs: readonly { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <FormStatus status={state.status} message={state.message} />

      <div style={styles.field}>
        <label htmlFor="programId" style={styles.label}>
          Programme
          <span aria-hidden="true" style={styles.req}>
            *
          </span>
        </label>
        <select
          id="programId"
          name="programId"
          className="cn-control"
          required
          defaultValue={state.values?.programId ?? ''}
          aria-invalid={state.errors?.programId ? true : undefined}
        >
          <option value="" disabled>
            Choose a programme
          </option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>
        {state.errors?.programId ? (
          <p style={styles.error}>{state.errors.programId}</p>
        ) : null}
      </div>

      <TextField
        name="title"
        label="Session title"
        required
        error={state.errors?.title}
        defaultValue={state.values?.title}
      />

      <div style={styles.pair}>
        <div style={styles.field}>
          <label htmlFor="startTime" style={styles.label}>
            Starts
            <span aria-hidden="true" style={styles.req}>
              *
            </span>
          </label>
          {/*
            datetime-local rather than a text field: it gives a native picker on
            mobile and guarantees the "YYYY-MM-DDTHH:mm" shape the action parses.
          */}
          <input
            id="startTime"
            name="startTime"
            type="datetime-local"
            className="cn-control"
            required
            defaultValue={state.values?.startTime}
            aria-invalid={state.errors?.startTime ? true : undefined}
          />
          {state.errors?.startTime ? (
            <p style={styles.error}>{state.errors.startTime}</p>
          ) : null}
        </div>

        <div style={styles.field}>
          <label htmlFor="endTime" style={styles.label}>
            Ends
            <span aria-hidden="true" style={styles.req}>
              *
            </span>
          </label>
          <input
            id="endTime"
            name="endTime"
            type="datetime-local"
            className="cn-control"
            required
            defaultValue={state.values?.endTime}
            aria-invalid={state.errors?.endTime ? true : undefined}
          />
          {state.errors?.endTime ? <p style={styles.error}>{state.errors.endTime}</p> : null}
        </div>
      </div>

      <TextField
        name="location"
        label="Location"
        error={state.errors?.location}
        defaultValue={state.values?.location}
      />
      <TextArea
        name="description"
        label="Description"
        rows={3}
        error={state.errors?.description}
        defaultValue={state.values?.description}
      />

      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Adding…' : 'Add session'}
        </button>
      </div>

      <ButtonStyles />
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Curriculum authoring (admin)
 * ------------------------------------------------------------------ */

export function ProgramForm({
  action,
  initial,
}: {
  action: Action;
  initial?: { id: string; title: string; duration: string; description: string };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      {initial ? <input type="hidden" name="originalId" value={initial.id} /> : null}
      <FormStatus status={state.status} message={state.message} />
      <TextField name="id" label="Programme ID" hint="URL-safe slug, e.g. cloud-computing." error={state.errors?.id} defaultValue={initial?.id} />
      <TextField name="title" label="Title" required error={state.errors?.title} defaultValue={initial?.title} />
      <TextField name="duration" label="Duration" required error={state.errors?.duration} defaultValue={initial?.duration} />
      <TextArea name="description" label="Description" required rows={4} error={state.errors?.description} defaultValue={initial?.description} />
      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Update programme' : 'Create programme'}
        </button>
      </div>
      <ButtonStyles />
    </form>
  );
}

export function ModuleForm({
  action,
  programId,
  nextOrder,
  initial,
}: {
  action: Action;
  programId: string;
  nextOrder: number;
  initial?: { id: string; title: string; description: string; order: number };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="programId" value={programId} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus status={state.status} message={state.message} />
      <div style={styles.pair}>
        <TextField name="title" label="Module title" required error={state.errors?.title} defaultValue={initial?.title} />
        <TextField name="order" label="Order" required defaultValue={String(initial?.order ?? nextOrder)} error={state.errors?.order} />
      </div>
      <TextArea name="description" label="Description" required rows={3} error={state.errors?.description} defaultValue={initial?.description} />
      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Update module' : 'Add module'}
        </button>
      </div>
      <ButtonStyles />
    </form>
  );
}

export function LessonForm({
  action,
  moduleId,
  nextOrder,
  initial,
}: {
  action: Action;
  moduleId: string;
  nextOrder: number;
  initial?: { id: string; title: string; content: string; videoUrl: string | null; order: number };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="moduleId" value={moduleId} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus status={state.status} message={state.message} />
      <div style={styles.pair}>
        <TextField name="title" label="Lesson title" required error={state.errors?.title} defaultValue={initial?.title} />
        <TextField name="order" label="Order" required defaultValue={String(initial?.order ?? nextOrder)} error={state.errors?.order} />
      </div>
      <TextField name="videoUrl" label="Video URL" error={state.errors?.videoUrl} defaultValue={initial?.videoUrl ?? undefined} />
      <TextArea name="content" label="Lesson content" required rows={8} hint="Markdown is supported." error={state.errors?.content} defaultValue={initial?.content} />
      <div style={styles.pair}>
        <TextField name="resourceLabel" label="Resource label" error={state.errors?.resourceLabel} />
        <TextField name="resourceUrl" label="Resource URL" error={state.errors?.resourceUrl} />
      </div>
      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Update lesson' : 'Add lesson'}
        </button>
      </div>
      <ButtonStyles />
    </form>
  );
}

export function ExamForm({
  action,
  programId,
  initial,
}: {
  action: Action;
  programId: string;
  initial?: { id: string; title: string; description: string; passingScore: number };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="programId" value={programId} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus status={state.status} message={state.message} />
      <div style={styles.pair}>
        <TextField name="title" label="Exam title" required error={state.errors?.title} defaultValue={initial?.title} />
        <TextField name="passingScore" label="Pass mark" required defaultValue={String(initial?.passingScore ?? 70)} error={state.errors?.passingScore} />
      </div>
      <TextArea name="description" label="Description" required rows={3} error={state.errors?.description} defaultValue={initial?.description} />
      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Update exam' : 'Add exam'}
        </button>
      </div>
      <ButtonStyles />
    </form>
  );
}

export function QuestionForm({
  action,
  examId,
  nextOrder,
  initial,
}: {
  action: Action;
  examId: string;
  nextOrder: number;
  initial?: { id: string; question: string; options: unknown; correct: string; order: number };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="examId" value={examId} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus status={state.status} message={state.message} />
      <TextArea name="question" label="Question" required rows={3} error={state.errors?.question} defaultValue={initial?.question} />
      <div style={styles.pair}>
        <TextField name="optionA" label="Option A" required error={state.errors?.optionA} defaultValue={Array.isArray(initial?.options) ? String(initial.options[0] ?? '') : undefined} />
        <TextField name="optionB" label="Option B" required error={state.errors?.optionB} defaultValue={Array.isArray(initial?.options) ? String(initial.options[1] ?? '') : undefined} />
        <TextField name="optionC" label="Option C" required error={state.errors?.optionC} defaultValue={Array.isArray(initial?.options) ? String(initial.options[2] ?? '') : undefined} />
        <TextField name="optionD" label="Option D" required error={state.errors?.optionD} defaultValue={Array.isArray(initial?.options) ? String(initial.options[3] ?? '') : undefined} />
      </div>
      <div style={styles.pair}>
        <div style={styles.field}>
          <label htmlFor={`correct-${examId}-${initial?.id ?? 'new'}`} style={styles.label}>Correct answer</label>
          <select id={`correct-${examId}-${initial?.id ?? 'new'}`} name="correct" className="cn-control" defaultValue={initial?.correct ?? 'A'}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <TextField name="order" label="Order" required defaultValue={String(initial?.order ?? nextOrder)} error={state.errors?.order} />
      </div>
      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Update question' : 'Add question'}
        </button>
      </div>
      <ButtonStyles />
    </form>
  );
}

export function ProjectForm({
  action,
  programId,
  initial,
}: {
  action: Action;
  programId: string;
  initial?: { id: string; title: string; description: string; requirements: string };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="programId" value={programId} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus status={state.status} message={state.message} />
      <TextField name="title" label="Project title" required error={state.errors?.title} defaultValue={initial?.title} />
      <TextArea name="description" label="Description" required rows={3} error={state.errors?.description} defaultValue={initial?.description} />
      <TextArea name="requirements" label="Requirements" required rows={6} hint="Markdown is supported." error={state.errors?.requirements} defaultValue={initial?.requirements} />
      <div style={styles.pair}>
        <TextField name="rubricLabel" label="First rubric item" error={state.errors?.rubricLabel} />
        <TextField name="rubricPoints" label="Points" defaultValue="10" error={state.errors?.rubricPoints} />
      </div>
      <div>
        <button type="submit" className="act act-primary" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Update project' : 'Add project'}
        </button>
      </div>
      <ButtonStyles />
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Shared button skin
 * ------------------------------------------------------------------ */

/**
 * Background and border live here rather than in an inline style: an inline
 * style cannot be overridden by a `:hover` rule, so the hover would silently
 * do nothing. Same split the rest of the codebase uses.
 */
function ButtonStyles() {
  return (
    <style jsx>{`
      .act {
        padding: 0.6rem 1.1rem;
        border: 1px solid var(--border);
        border-radius: ${radius.md}px;
        background: ${'var(--surface)'};
        color: ${'var(--text)'};
        font-family: inherit;
        font-size: 0.92rem;
        font-weight: 500;
        cursor: pointer;
        transition:
          background 200ms ${ease.out},
          border-color 200ms ${ease.out},
          opacity 200ms ${ease.out};
      }

      .act:hover:not(:disabled) {
        background: ${'var(--surfaceHover)'};
        border-color: var(--borderStrong);
      }

      .act:disabled {
        opacity: 0.55;
        cursor: progress;
      }

      .act-primary {
        border-color: var(--primary);
        background: var(--primary);
        color: #fff;
      }

      .act-primary:hover:not(:disabled) {
        background: var(--primaryHover);
        border-color: var(--primaryHover);
      }

      .act-danger {
        border-color: var(--danger);
        color: var(--danger);
      }

      .act-danger:hover:not(:disabled) {
        background: var(--dangerSoft);
        border-color: rgba(252, 165, 165, 0.45);
      }
    `}</style>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  pair: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '1.1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  req: {
    marginLeft: 3,
    color: 'var(--primary)',
  },
  error: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: '#FCA5A5',
  },
} satisfies Record<string, React.CSSProperties>;
