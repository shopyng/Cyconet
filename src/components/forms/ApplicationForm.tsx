'use client';

/**
 * Course application form.
 *
 * Driven by `useActionState` against the `submitApplication` Server Action, so
 * it validates server-side and still submits with JavaScript disabled.
 *
 * On success the form is replaced by a confirmation panel that receives focus,
 * because a keyboard or screen-reader user who submits from the bottom of a
 * long form would otherwise be left with no indication anything happened.
 */

import { useActionState } from 'react';
import { submitApplication } from '@/lib/actions';
import { IDLE_STATE } from '@/lib/form-state';
import { programs } from '@/lib/content';
import Button from '@/components/ui/Button';
import { ArrowRight } from '@/components/ui/Icons';
import {
  FieldStyles,
  FormStatus,
  Honeypot,
  SelectField,
  TextArea,
  TextField,
} from './Field';
import SuccessPanel from './SuccessPanel';
import { color } from '@/lib/theme';

const TRACK_OPTIONS = programs.map((program) => ({
  value: program.id,
  label: `${program.title} — ${program.duration}`,
}));

const EXPERIENCE_OPTIONS = [
  'Complete beginner',
  'Some self-taught experience',
  'Studied it formally',
  'Already working in tech',
].map((value) => ({ value, label: value }));

export default function ApplicationForm({
  defaultTrack,
}: {
  /** Pre-selects a track when the form is reached from a program page. */
  defaultTrack?: string;
}) {
  const [state, formAction, pending] = useActionState(submitApplication, IDLE_STATE);

  if (state.status === 'success') {
    return <SuccessPanel title="Application received" message={state.message} />;
  }

  return (
    <>
      <form action={formAction} style={styles.form} noValidate>
        <FormStatus status={state.status} message={state.message} />

        <div style={styles.row}>
          <TextField
            name="name"
            label="Full name"
            required
            autoComplete="name"
            error={state.errors?.name}
            defaultValue={state.values?.name}
          />
          <TextField
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            error={state.errors?.email}
            defaultValue={state.values?.email}
          />
        </div>

        <div style={styles.row}>
          <TextField
            name="phone"
            label="Phone"
            type="tel"
            required
            autoComplete="tel"
            hint="Include the country code, e.g. +234."
            error={state.errors?.phone}
            defaultValue={state.values?.phone}
          />
          <SelectField
            name="track"
            label="Track"
            required
            options={TRACK_OPTIONS}
            placeholder="Which track?"
            error={state.errors?.track}
            defaultValue={state.values?.track ?? defaultTrack}
          />
        </div>

        <SelectField
          name="experience"
          label="Experience level"
          required
          options={EXPERIENCE_OPTIONS}
          placeholder="Where are you starting from?"
          hint="There is no wrong answer — it only tells us where to start you."
          error={state.errors?.experience}
          defaultValue={state.values?.experience}
        />

        <TextArea
          name="motivation"
          label="Why this track, and why now?"
          required
          rows={6}
          hint="A short paragraph is plenty. We read every one."
          error={state.errors?.motivation}
          defaultValue={state.values?.motivation}
        />

        <Honeypot />

        <div style={styles.actions}>
          <Button type="submit" size="lg" trailing={<ArrowRight />}>
            {pending ? 'Sending…' : 'Submit application'}
          </Button>
          <p style={styles.note}>
            No application fee. We reply within five working days.
          </p>
        </div>
      </form>

      <FieldStyles />
    </>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  row: {
    display: 'grid',
    /* Two-up where there is room, stacked on phones — no media query needed. */
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: '1.25rem',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  note: {
    fontSize: '0.85rem',
    color: color.textMuted,
  },
} satisfies Record<string, React.CSSProperties>;
