'use client';

/**
 * Form field primitives.
 *
 * Every control is wired the same way, because these are the details that
 * decide whether a form is usable with a screen reader:
 *
 *  - a real <label htmlFor>, never a placeholder standing in for one
 *  - `aria-invalid` when the server rejected the value
 *  - `aria-describedby` pointing at the error text *and* any hint, so both are
 *    announced when focus lands on the input
 *  - `defaultValue` echoed from server state, so a failed submit never wipes
 *    what someone typed
 *
 * Error colour is #FCA5A5 rather than a saturated red: on #0A0B0F a mid red
 * lands near 3:1 and fails AA for body text.
 */

import { color, ease, font, radius } from '@/lib/theme';
import { HONEYPOT_FIELD } from '@/lib/form-state';

type BaseProps = {
  name: string;
  label: string;
  error?: string;
  defaultValue?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
};

function useIds(name: string, error?: string, hint?: string) {
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { errorId, hintId, describedBy };
}

function Shell({
  name,
  label,
  error,
  hint,
  required,
  children,
}: BaseProps & { children: React.ReactNode }) {
  const { errorId, hintId } = useIds(name, error, hint);
  return (
    <div style={styles.field}>
      <label htmlFor={name} style={styles.label}>
        {label}
        {required ? (
          <span aria-hidden="true" style={styles.req}>
            *
          </span>
        ) : (
          <span style={styles.optional}> (optional)</span>
        )}
      </label>
      {hint ? (
        <p id={hintId} style={styles.hint}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} style={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  type = 'text',
  ...props
}: BaseProps & { type?: 'text' | 'email' | 'tel' | 'date' }) {
  const { describedBy } = useIds(props.name, props.error, props.hint);
  return (
    <Shell {...props}>
      <input
        id={props.name}
        name={props.name}
        type={type}
        className="cn-control"
        required={props.required}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
      />
    </Shell>
  );
}

export function TextArea({ rows = 5, ...props }: BaseProps & { rows?: number }) {
  const { describedBy } = useIds(props.name, props.error, props.hint);
  return (
    <Shell {...props}>
      <textarea
        id={props.name}
        name={props.name}
        rows={rows}
        className="cn-control"
        required={props.required}
        defaultValue={props.defaultValue}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
      />
    </Shell>
  );
}

export function SelectField({
  options,
  placeholder = 'Choose one',
  ...props
}: BaseProps & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  const { describedBy } = useIds(props.name, props.error, props.hint);
  return (
    <Shell {...props}>
      <select
        id={props.name}
        name={props.name}
        className="cn-control"
        required={props.required}
        defaultValue={props.defaultValue ?? ''}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/**
 * Bot trap. Hidden from sight and from assistive tech, and excluded from tab
 * order — a human should never encounter it, so anything filling it in is not
 * one. `display: none` is avoided because some bots skip such fields.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={styles.honeypot}>
      <label htmlFor={HONEYPOT_FIELD}>Company website</label>
      <input
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

/**
 * Submission result. `role="status"` announces success politely; `role="alert"`
 * makes failures interrupt, since the user must act on them.
 */
export function FormStatus({
  status,
  message,
}: {
  status: 'idle' | 'success' | 'error';
  message: string;
}) {
  if (status === 'idle' || !message) {
    // Kept mounted and empty so the live region exists before it has content —
    // regions inserted at the same time as their text are often not announced.
    return <p role="status" aria-live="polite" style={styles.statusIdle} />;
  }
  const isError = status === 'error';
  return (
    <p
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      style={{ ...styles.status, ...(isError ? styles.statusError : styles.statusOk) }}
    >
      {message}
    </p>
  );
}

/** Shared control styling — imported once per form. */
export function FieldStyles() {
  return (
    <style jsx global>{`
      .cn-control {
        width: 100%;
        padding: 0.75rem 0.95rem;
        border: 1px solid ${color.border};
        border-radius: ${radius.md}px;
        background: rgba(255, 255, 255, 0.04);
        color: ${color.text};
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 0.95rem;
        transition:
          border-color 220ms ${ease.out},
          background 220ms ${ease.out};
      }

      .cn-control::placeholder {
        color: ${color.textFaint};
      }

      .cn-control:hover {
        border-color: ${color.borderStrong};
      }

      .cn-control:focus {
        outline: none;
        border-color: ${color.cyan};
        background: rgba(255, 255, 255, 0.06);
        box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.14);
      }

      .cn-control[aria-invalid='true'] {
        border-color: #fca5a5;
      }

      textarea.cn-control {
        resize: vertical;
        min-height: 120px;
      }

      select.cn-control {
        appearance: none;
        cursor: pointer;
        /* Chevron drawn inline so the control needs no image request. */
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A8F98' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 9 7 7 7-7'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.9rem center;
        padding-right: 2.4rem;
      }

      select.cn-control option {
        background: ${color.bgElevated};
        color: ${color.text};
      }
    `}</style>
  );
}

const styles = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: color.text,
  },
  req: {
    marginLeft: 3,
    color: color.cyan,
  },
  optional: {
    fontWeight: 400,
    color: color.textFaint,
  },
  hint: {
    fontSize: '0.82rem',
    lineHeight: 1.5,
    color: color.textMuted,
  },
  error: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: '#FCA5A5',
  },
  honeypot: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
  },
  statusIdle: {
    minHeight: 0,
  },
  status: {
    padding: '0.85rem 1rem',
    borderRadius: radius.md,
    fontSize: font.small,
    lineHeight: 1.55,
  },
  statusOk: {
    border: '1px solid rgba(0, 229, 255, 0.3)',
    background: 'rgba(0, 229, 255, 0.09)',
    color: color.cyan,
  },
  statusError: {
    border: '1px solid rgba(252, 165, 165, 0.35)',
    background: 'rgba(252, 165, 165, 0.08)',
    color: '#FCA5A5',
  },
} satisfies Record<string, React.CSSProperties>;
