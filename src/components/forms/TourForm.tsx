'use client';

/** Co-working hub tour request. See ApplicationForm for the shared pattern. */

import { useActionState } from 'react';
import { submitTour } from '@/lib/actions';
import { IDLE_STATE } from '@/lib/form-state';
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

/** Must stay in sync with PLAN_OPTIONS in src/lib/actions.ts. */
const PLAN_OPTIONS = ['Day Pass', 'Resident', 'Team Suite', 'Not sure yet'].map(
  (value) => ({ value, label: value }),
);

export default function TourForm() {
  const [state, formAction, pending] = useActionState(submitTour, IDLE_STATE);

  if (state.status === 'success') {
    return <SuccessPanel title="Tour requested" message={state.message} />;
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
            error={state.errors?.phone}
            defaultValue={state.values?.phone}
          />
          <SelectField
            name="plan"
            label="Plan of interest"
            required
            options={PLAN_OPTIONS}
            placeholder="Which plan?"
            error={state.errors?.plan}
            defaultValue={state.values?.plan}
          />
        </div>

        <TextField
          name="preferredDate"
          label="Preferred date"
          type="date"
          hint="We run tours Monday to Saturday."
          error={state.errors?.preferredDate}
          defaultValue={state.values?.preferredDate}
        />

        <TextArea
          name="notes"
          label="Anything we should know?"
          rows={4}
          hint="Team size, equipment needs, accessibility requirements."
          error={state.errors?.notes}
          defaultValue={state.values?.notes}
        />

        <Honeypot />

        <div style={styles.actions}>
          <Button type="submit" size="lg" trailing={<ArrowRight />}>
            {pending ? 'Sending…' : 'Request a tour'}
          </Button>
          <p style={styles.note}>Akala Expressway, Ibadan.</p>
        </div>
      </form>

      <FieldStyles />
    </>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  row: {
    display: 'grid',
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
  note: { fontSize: '0.85rem', color: color.textMuted },
} satisfies Record<string, React.CSSProperties>;
