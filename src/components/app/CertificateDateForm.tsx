'use client';

import { useActionState } from 'react';
import { updateCertificateIssuedAt } from '@/lib/admin-actions';
import { IDLE_STATE } from '@/lib/form-state';
import { FieldStyles, FormStatus, TextField } from '@/components/forms/Field';
import { font, radius } from '@/lib/theme';

export default function CertificateDateForm({
  certificateId,
  defaultDate,
}: {
  certificateId: string;
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(updateCertificateIssuedAt, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form}>
      <FieldStyles />
      <input type="hidden" name="certificateId" value={certificateId} />
      <TextField
        name="issuedAt"
        label="Issued date"
        type="date"
        required
        defaultValue={defaultDate}
        error={state.errors?.issuedAt}
      />
      <button type="submit" className="certificate-date-save" disabled={pending}>
        {pending ? 'Saving…' : 'Save date'}
      </button>
      {state.status !== 'idle' ? (
        <FormStatus status={state.status} message={state.message} />
      ) : null}
      <style jsx>{`
        .certificate-date-save {
          align-self: flex-start;
          padding: 0.55rem 0.85rem;
          border: 1px solid var(--primary);
          border-radius: ${radius.md}px;
          background: var(--primary);
          color: var(--onPrimary);
          font: 600 ${font.small} var(--font-sans), system-ui, sans-serif;
          cursor: pointer;
        }

        .certificate-date-save:hover:not(:disabled) {
          background: var(--primaryHover);
          border-color: var(--primaryHover);
        }

        .certificate-date-save:disabled {
          opacity: 0.55;
          cursor: progress;
        }
      `}</style>
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.55rem',
    minWidth: 150,
  },
} satisfies Record<string, React.CSSProperties>;
