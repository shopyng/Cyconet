'use client';

/**
 * Sign-in form, shared by both tenants.
 *
 * Driven by `useActionState` against the `signIn` Server Action, so it works
 * without JavaScript — the form posts, the server validates, and the page comes
 * back with errors rendered. The action decides the destination from the user's
 * role, so this component does not care which subdomain it is mounted on.
 */

import { useActionState } from 'react';
import { signIn } from '@/lib/auth-actions';
import { IDLE_STATE } from '@/lib/form-state';
import { FieldStyles, FormStatus, TextField } from '@/components/forms/Field';
import Button from '@/components/ui/Button';
import { color, font, glass, radius } from '@/lib/theme';

export default function LoginForm({
  heading,
  sub,
}: {
  heading: string;
  sub: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, IDLE_STATE);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.heading}>{heading}</h1>
        <p style={styles.sub}>{sub}</p>

        <form action={formAction} style={styles.form} noValidate>
          <FormStatus status={state.status} message={state.message} />

          <TextField
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            error={state.errors?.email}
            defaultValue={state.values?.email}
          />

          <TextField
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            error={state.errors?.password}
          />

          <Button type="submit" size="lg" fullWidth>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      <FieldStyles />
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1.5rem',
    background: color.bg,
  },
  card: {
    ...glass,
    width: '100%',
    maxWidth: 420,
    padding: 'clamp(1.5rem, 1rem + 2vw, 2.5rem)',
    borderRadius: radius.lg,
  },
  heading: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: color.text,
  },
  sub: {
    marginTop: '0.4rem',
    marginBottom: '1.5rem',
    fontSize: font.small,
    color: color.textMuted,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: font.small,
    fontWeight: 500,
    color: color.text,
  },
  req: {
    marginLeft: '0.2rem',
    color: color.cyan,
  },
} satisfies Record<string, React.CSSProperties>;
