'use client';

/** Agency project enquiry form. See ApplicationForm for the shared pattern. */

import { useActionState } from 'react';
import { submitEnquiry } from '@/lib/actions';
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

/** Must stay in sync with SERVICE_OPTIONS in src/lib/actions.ts. */
const SERVICE_OPTIONS = [
  'Security audit or penetration testing',
  'Custom software delivery',
  'Cloud & DevOps engineering',
  'Data & AI consulting',
  'Something else',
].map((value) => ({ value, label: value }));

export default function EnquiryForm() {
  const [state, formAction, pending] = useActionState(submitEnquiry, IDLE_STATE);

  if (state.status === 'success') {
    return <SuccessPanel title="Enquiry received" message={state.message} />;
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
            label="Work email"
            type="email"
            required
            autoComplete="email"
            error={state.errors?.email}
            defaultValue={state.values?.email}
          />
        </div>

        <div style={styles.row}>
          <TextField
            name="company"
            label="Company"
            required
            autoComplete="organization"
            error={state.errors?.company}
            defaultValue={state.values?.company}
          />
          <SelectField
            name="service"
            label="What do you need?"
            required
            options={SERVICE_OPTIONS}
            placeholder="Choose a service"
            error={state.errors?.service}
            defaultValue={state.values?.service}
          />
        </div>

        <TextField
          name="budget"
          label="Indicative budget"
          hint="A range is fine. It helps us scope honestly rather than guess."
          error={state.errors?.budget}
          defaultValue={state.values?.budget}
        />

        <TextArea
          name="message"
          label="What are you trying to build, secure or fix?"
          required
          rows={6}
          error={state.errors?.message}
          defaultValue={state.values?.message}
        />

        <Honeypot />

        <div style={styles.actions}>
          <Button type="submit" size="lg" trailing={<ArrowRight />}>
            {pending ? 'Sending…' : 'Send enquiry'}
          </Button>
          <p style={styles.note}>We reply within one working day.</p>
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
