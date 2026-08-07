'use client';

/**
 * Proof-of-payment upload.
 *
 * A client component only because the file input needs to report the chosen
 * filename before submitting — everything else here would work as a plain form
 * post, and still does when JavaScript is unavailable.
 */

import { useActionState, useState } from 'react';
import { uploadPaymentProof } from '@/lib/payment-actions';
import { IDLE_STATE } from '@/lib/form-state';
import { ease, font, radius } from '@/lib/theme';

export default function PaymentProofForm({
  paymentId,
  /** Name of a proof already on file, if the student is replacing one. */
  existingFileName,
}: {
  paymentId: string;
  existingFileName?: string;
}) {
  const [state, formAction, pending] = useActionState(uploadPaymentProof, IDLE_STATE);
  const [chosen, setChosen] = useState<string | null>(null);

  const done = state.status === 'success';

  return (
    <form action={formAction} style={styles.form}>
      <input type="hidden" name="paymentId" value={paymentId} />

      {state.message ? (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          aria-live={state.status === 'error' ? 'assertive' : 'polite'}
          style={{
            ...styles.status,
            ...(state.status === 'error' ? styles.statusError : styles.statusOk),
          }}
        >
          {state.message}
        </p>
      ) : null}

      {done ? null : (
        <>
          <label htmlFor="proof" className="drop">
            <span className="drop-icon" aria-hidden="true">
              ↑
            </span>
            <span className="drop-title">
              {chosen ?? existingFileName ?? 'Choose your receipt'}
            </span>
            <span className="drop-hint">
              PNG, JPEG, WebP or PDF · up to 5MB
              {existingFileName && !chosen ? ' · uploading again replaces the current file' : ''}
            </span>
            <input
              id="proof"
              name="proof"
              type="file"
              required
              accept="image/png,image/jpeg,image/webp,application/pdf"
              aria-describedby={state.errors?.proof ? 'proof-error' : undefined}
              aria-invalid={state.errors?.proof ? true : undefined}
              onChange={(event) => setChosen(event.target.files?.[0]?.name ?? null)}
            />
          </label>

          {state.errors?.proof ? (
            <p id="proof-error" style={styles.error}>
              {state.errors.proof}
            </p>
          ) : null}

          <button type="submit" className="submit" disabled={pending}>
            {pending ? 'Uploading…' : 'Submit proof of payment'}
          </button>
        </>
      )}

      <style jsx>{`
        .drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 2rem 1.25rem;
          border: 1.5px dashed var(--borderStrong);
          border-radius: ${radius.md}px;
          background: var(--surfaceSunken);
          text-align: center;
          cursor: pointer;
          transition:
            border-color 180ms ${ease.out},
            background 180ms ${ease.out};
        }

        .drop:hover {
          border-color: var(--primary);
          background: var(--primarySoft);
        }

        /* The input is the label's control, so clicking anywhere in the box
           opens the picker. Hidden visually, but never display:none — that
           would take it out of the tab order entirely. */
        .drop input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
        }

        .drop:has(input:focus-visible) {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        .drop-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          margin-bottom: 0.35rem;
          border-radius: 999px;
          background: var(--primarySoft);
          color: var(--primary);
          font-size: 1.1rem;
          font-weight: 700;
        }

        .drop-title {
          font-size: 0.98rem;
          font-weight: 600;
          color: var(--text);
          overflow-wrap: anywhere;
        }

        .drop-hint {
          font-size: 0.82rem;
          color: var(--textFaint);
        }

        .submit {
          align-self: flex-start;
          padding: 0.75rem 1.4rem;
          border: none;
          border-radius: ${radius.md}px;
          background: var(--primary);
          color: var(--onPrimary);
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 180ms ${ease.out};
        }

        .submit:hover:not(:disabled) {
          background: var(--primaryHover);
        }

        .submit:disabled {
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
    gap: '1rem',
    position: 'relative',
  },
  status: {
    padding: '0.85rem 1rem',
    borderRadius: radius.sm,
    fontSize: font.small,
    lineHeight: 1.55,
  },
  statusOk: {
    background: 'var(--successSoft)',
    color: 'var(--success)',
  },
  statusError: {
    background: 'var(--dangerSoft)',
    color: 'var(--danger)',
  },
  error: {
    fontSize: '0.84rem',
    color: 'var(--danger)',
  },
} satisfies Record<string, React.CSSProperties>;
