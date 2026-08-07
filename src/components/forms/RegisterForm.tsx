'use client';

/**
 * Student registration.
 *
 * Driven by `useActionState` against the `signUp` Server Action so it works
 * without JavaScript, matching every other form in the app: the form posts, the
 * server validates, and the page comes back with errors rendered in place.
 *
 * Lives on the marketing host, so it reuses the marketing Field primitives and
 * their dark palette rather than the dashboard's theme-aware controls.
 */

import { useActionState } from 'react';
import { signUp } from '@/lib/auth-actions';
import { IDLE_STATE } from '@/lib/form-state';
import {
  TextField,
  SelectField,
  Honeypot,
  FormStatus,
  FieldStyles,
} from '@/components/forms/Field';
import { color, ease, font, radius } from '@/lib/theme';

export default function RegisterForm({
  programs,
  /** Pre-selects a track when arriving from a programme page. */
  defaultProgramId,
}: {
  programs: readonly { value: string; label: string }[];
  defaultProgramId?: string;
}) {
  const [state, formAction, pending] = useActionState(signUp, IDLE_STATE);

  return (
    <form action={formAction} style={styles.form} noValidate>
      <FieldStyles />
      <FormStatus status={state.status} message={state.message} />

      <TextField
        name="name"
        label="Full name"
        required
        autoComplete="name"
        defaultValue={state.values?.name}
        error={state.errors?.name}
        hint="This is the name that will appear on your certificate."
      />

      <TextField
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.errors?.email}
      />

      <SelectField
        name="programId"
        label="Programme"
        required
        options={programs}
        placeholder="Choose your track"
        defaultValue={state.values?.programId ?? defaultProgramId}
        error={state.errors?.programId}
      />

      <div style={styles.row}>
        <TextField
          name="password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          error={state.errors?.password}
          hint="At least 10 characters, with a letter and a number."
        />
        <TextField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          error={state.errors?.confirmPassword}
        />
      </div>

      <Honeypot />

      <button type="submit" className="cn-submit" disabled={pending}>
        {pending ? 'Creating your account…' : 'Create account'}
      </button>

      <p style={styles.note}>
        Your place is reserved as soon as you register. You will be shown the tuition fee and
        our bank details next, and the programme unlocks once we confirm your payment.
      </p>

      <p style={styles.foot}>
        Already registered?{' '}
        <a href="/apply" style={styles.link}>
          Talk to admissions
        </a>
      </p>

      <style jsx>{`
        .cn-submit {
          width: 100%;
          padding: 0.85rem 1.4rem;
          border: none;
          border-radius: ${radius.md}px;
          /* Near-black ink on the bright gradient clears 6.6:1 at every stop —
             see the contrast notes in src/lib/theme.ts. */
          background: linear-gradient(120deg, ${color.cyan} 0%, ${color.cyanSoft} 38%, ${color.violetSoft} 100%);
          color: ${color.ink};
          font-family: inherit;
          font-size: 0.98rem;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 200ms ${ease.out},
            box-shadow 200ms ${ease.out},
            opacity 200ms ${ease.out};
        }

        .cn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(0, 229, 255, 0.28), 0 4px 12px rgba(124, 58, 237, 0.24);
        }

        .cn-submit:disabled {
          opacity: 0.6;
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
    gap: '1.15rem',
  },
  row: {
    display: 'grid',
    // Two up when there is room, stacked when there is not — without a media
    // query, which inline styles cannot express.
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '1.15rem',
  },
  note: {
    fontSize: '0.85rem',
    lineHeight: 1.65,
    color: color.textMuted,
  },
  foot: {
    paddingTop: '1.1rem',
    borderTop: `1px solid ${color.border}`,
    fontSize: font.small,
    color: color.textMuted,
  },
  link: {
    color: color.cyan,
    fontWeight: 600,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
