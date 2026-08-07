'use client';

/**
 * Sign-in form, shared by both tenants.
 *
 * Driven by `useActionState` against the `signIn` Server Action, so it works
 * without JavaScript — the form posts, the server validates, and the page comes
 * back with errors rendered. The action decides the destination from the user's
 * role, so this component does not care which subdomain it is mounted on.
 *
 * Two columns on desktop: a branded panel carrying the value proposition, and
 * the form itself. The panel collapses away below 900px so the form is the whole
 * screen on a phone rather than something to scroll past.
 *
 * Colours are CSS custom properties from the tenant layout's theme cookie. The
 * shared Field primitives are deliberately not reused here — they are pinned to
 * the marketing site's dark palette, which is unreadable on a light surface.
 */

import { useActionState } from 'react';
import { signIn } from '@/lib/auth-actions';
import { IDLE_STATE } from '@/lib/form-state';
import { ease, radius } from '@/lib/theme';

export default function LoginForm({
  heading,
  sub,
  /** Short lines shown on the branded panel — what this login gets you. */
  highlights = [],
  /** Panel eyebrow, e.g. "Student portal" or "Staff access". */
  eyebrow,
  /**
   * Absolute URL of the registration page on the apex host.
   *
   * Passed in rather than derived here: this is a Client Component, and
   * `apexUrl()` is server-only because it reads the Host header. The login
   * pages are Server Components, so they resolve it and hand it down.
   *
   * Omitted on the staff form — there is no self-serve route to an admin
   * account, so offering one there would be a dead end.
   */
  registerUrl,
}: {
  heading: string;
  sub: string;
  highlights?: readonly string[];
  eyebrow?: string;
  registerUrl?: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, IDLE_STATE);

  const emailError = state.errors?.email;
  const passwordError = state.errors?.password;

  return (
    <div className="auth">
      {/*
        Decorative: everything here is marketing copy repeated from the public
        site, so a screen reader should land on the form instead.
      */}
      <section className="panel" aria-hidden="true">
        <div className="panel-inner">
          <div className="brand">
            <span className="brand-mark" />
            <span>Cyconet</span>
          </div>

          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}

          <p className="panel-copy">
            Build real cybersecurity and engineering skills with structured
            programmes, graded projects and verifiable certificates.
          </p>

          {highlights.length > 0 ? (
            <ul className="highlights">
              {highlights.map((line) => (
                <li key={line}>
                  <span className="tick">✓</span>
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="form-col">
        <div className="card">
          <h1 className="heading">{heading}</h1>
          <p className="sub">{sub}</p>

          <form action={formAction} noValidate>
            {/*
              role="alert" so the failure is announced the moment the server
              responds — a sighted user sees the panel, everyone else is told.
            */}
            {state.status === 'error' && state.message ? (
              <p className="alert" role="alert">
                {state.message}
              </p>
            ) : null}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                defaultValue={state.values?.email}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError ? (
                <p className="error" id="email-error">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError ? (
                <p className="error" id="password-error">
                  {passwordError}
                </p>
              ) : null}
            </div>

            <button type="submit" className="submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/*
            Registration is self-serve and lives on the marketing host, so this
            is an absolute URL rather than a same-host link — the proxy would
            otherwise rewrite /register onto this tenant's prefix and 404.
          */}
          {registerUrl ? (
            <p className="foot">
              No account yet? <a href={registerUrl}>Create one</a>
            </p>
          ) : null}
        </div>
      </section>

      <style jsx>{`
        .auth {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
        }

        .panel {
          display: none;
          padding: 3rem;
          background: linear-gradient(150deg, var(--primary), var(--primaryHover));
          /* Same reason as .submit — the dark theme's primary is cyan. */
          color: var(--onPrimary);
        }

        .panel-inner {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-width: 30rem;
          margin: auto 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .brand-mark {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          /* Follows the panel's ink so it stays visible whichever theme is on. */
          background: currentColor;
        }

        .eyebrow {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .panel-copy {
          font-size: 1.35rem;
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: -0.01em;
          text-wrap: balance;
        }

        .highlights {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin: 0;
          padding: 0;
          list-style: none;
          font-size: 0.95rem;
        }

        .highlights li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          opacity: 0.95;
        }

        .tick {
          flex: none;
          font-weight: 700;
        }

        .form-col {
          display: grid;
          place-items: center;
          padding: clamp(1.25rem, 0.6rem + 2.6vw, 2.5rem);
        }

        .card {
          width: 100%;
          max-width: 24rem;
        }

        .heading {
          font-family: var(--font-display), system-ui, sans-serif;
          font-size: 1.7rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .sub {
          margin-top: 0.4rem;
          margin-bottom: 1.75rem;
          font-size: 0.94rem;
          color: var(--textMuted);
        }

        .alert {
          margin-bottom: 1.1rem;
          padding: 0.7rem 0.85rem;
          border: 1px solid var(--danger);
          border-radius: ${radius.sm}px;
          background: var(--dangerSoft);
          color: var(--danger);
          font-size: 0.88rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1.1rem;
        }

        .field label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text);
        }

        .field input {
          padding: 0.7rem 0.85rem;
          border: 1px solid var(--border);
          border-radius: ${radius.sm}px;
          background: var(--surface);
          color: var(--text);
          font-size: 0.95rem;
          transition:
            border-color 160ms ${ease.out},
            box-shadow 160ms ${ease.out};
        }

        .field input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primarySoft);
        }

        .field input[aria-invalid='true'] {
          border-color: var(--danger);
        }

        .error {
          font-size: 0.82rem;
          color: var(--danger);
        }

        .submit {
          width: 100%;
          margin-top: 0.4rem;
          padding: 0.8rem 1rem;
          border: none;
          border-radius: ${radius.sm}px;
          background: var(--primary);
          color: var(--onPrimary);
          font-size: 0.96rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 160ms ${ease.out};
        }

        .submit:hover:not(:disabled) {
          background: var(--primaryHover);
        }

        .submit:disabled {
          opacity: 0.65;
          cursor: progress;
        }

        .foot {
          margin-top: 1.5rem;
          font-size: 0.88rem;
          color: var(--textMuted);
        }

        .foot a {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }

        .foot a:hover {
          text-decoration: underline;
        }

        @media (min-width: 900px) {
          .auth {
            grid-template-columns: 1.05fr 1fr;
          }

          .panel {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
