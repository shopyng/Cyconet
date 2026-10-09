'use client';

import { useActionState, useState } from 'react';
import { issueManualCertificate } from '@/lib/admin-actions';
import { IDLE_STATE } from '@/lib/form-state';
import { FieldStyles, FormStatus, SelectField, TextField } from '@/components/forms/Field';
import { font, radius } from '@/lib/theme';

type Option = { value: string; label: string };

export default function CertificateIssueForm({
  students,
  programs,
  defaultDate,
}: {
  students: readonly Option[];
  programs: readonly Option[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(issueManualCertificate, IDLE_STATE);
  const [directorName, setDirectorName] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const done = state.status === 'success';

  return (
    <form action={formAction} encType="multipart/form-data" style={styles.form}>
      <FieldStyles />
      <FormStatus status={state.status} message={state.message} />

      {done ? null : (
        <>
          <div style={styles.grid}>
            <TextField
              name="holderName"
              label="Student name"
              required
              error={state.errors?.holderName}
              hint="Type the name exactly as it should appear on the certificate."
            />
            <SelectField
              name="userId"
              label="Link to existing student account"
              options={students}
              error={state.errors?.userId}
              hint="Optional. Leave this empty for an externally assessed student without an online account."
            />
            <SelectField
              name="programId"
              label="Certificate programme"
              options={programs}
              required
              error={state.errors?.programId}
            />
            <TextField
              name="issuedAt"
              label="Issue date"
              type="date"
              required
              defaultValue={defaultDate}
              error={state.errors?.issuedAt}
              hint="The month and date printed on the certificate."
            />
          </div>

          <div style={styles.signatureGrid}>
            <FileField
              id="directorSignature"
              name="directorSignature"
              label="Director signature"
              chosen={directorName}
              error={state.errors?.directorSignature}
              onChange={setDirectorName}
            />
            <FileField
              id="studentSignature"
              name="studentSignature"
              label="Student signature"
              chosen={studentName}
              error={state.errors?.studentSignature}
              onChange={setStudentName}
            />
          </div>

          <p style={styles.hint}>
            Upload a clear PNG or JPEG signature image for each signer. Each file can be up to 1MB.
            A QR code linking to the public verification page is added automatically.
          </p>

          <button type="submit" className="act act-primary" disabled={pending}>
            {pending ? 'Creating certificate…' : 'Create and issue certificate'}
          </button>
        </>
      )}
    </form>
  );
}

function FileField({
  id,
  name,
  label,
  chosen,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  chosen: string | null;
  error?: string;
  onChange: (name: string | null) => void;
}) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>
        {label}<span aria-hidden="true" style={styles.required}>*</span>
      </label>
      <label htmlFor={id} style={styles.fileBox}>
        <span aria-hidden="true" style={styles.fileIcon}>↑</span>
        <span style={styles.fileName}>{chosen ?? 'Choose signature image'}</span>
        <span style={styles.fileHint}>PNG or JPEG · up to 1MB</span>
        <input
          id={id}
          name={name}
          type="file"
          required
          accept="image/png,image/jpeg"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(event) => onChange(event.target.files?.[0]?.name ?? null)}
          style={styles.fileInput}
        />
      </label>
      {error ? <p id={errorId} style={styles.error}>{error}</p> : null}
    </div>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    gap: '1rem',
  },
  signatureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  label: {
    color: 'var(--text)',
    fontSize: font.small,
    fontWeight: 600,
  },
  required: {
    marginLeft: '0.2rem',
    color: 'var(--danger)',
  },
  fileBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
    minHeight: '8.25rem',
    justifyContent: 'center',
    padding: '1rem',
    border: '1.5px dashed var(--borderStrong)',
    borderRadius: radius.md,
    background: 'var(--surfaceSunken)',
    textAlign: 'center',
    cursor: 'pointer',
  },
  fileIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    borderRadius: 999,
    background: 'var(--primarySoft)',
    color: 'var(--primary)',
    fontWeight: 700,
  },
  fileName: {
    color: 'var(--text)',
    fontSize: font.small,
    fontWeight: 600,
    overflowWrap: 'anywhere',
  },
  fileHint: {
    color: 'var(--textFaint)',
    fontSize: font.eyebrow,
  },
  fileInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  hint: {
    margin: 0,
    color: 'var(--textMuted)',
    fontSize: font.small,
    lineHeight: 1.55,
  },
  error: {
    margin: 0,
    color: 'var(--danger)',
    fontSize: font.small,
  },
} satisfies Record<string, React.CSSProperties>;
