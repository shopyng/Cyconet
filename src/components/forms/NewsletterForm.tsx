'use client';

/**
 * Newsletter signup.
 *
 * Replaces the earlier local-state stub — this one actually reaches the server,
 * validates, and is rate limited and honeypot-protected like every other form.
 * Laid out inline (input + button on one row) rather than stacked, since it
 * lives in the footer.
 */

import { useActionState } from 'react';
import { subscribeNewsletter } from '@/lib/actions';
import { IDLE_STATE, HONEYPOT_FIELD } from '@/lib/form-state';
import Button from '@/components/ui/Button';
import { color, ease, radius, srOnly } from '@/lib/theme';

export default function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, IDLE_STATE);
  const failed = state.status === 'error';
  const errorId = failed ? 'newsletter-error' : undefined;

  return (
    <>
      <form action={formAction} style={styles.form} noValidate>
        <label htmlFor="newsletter-email" style={srOnly}>
          Email address
        </label>
        <input
          id="newsletter-email"
          className="cn-news-input"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          aria-invalid={failed ? true : undefined}
          aria-describedby={errorId}
        />

        {/* Bot trap — hidden from sight, from assistive tech and from tab order. */}
        <div aria-hidden="true" style={styles.honeypot}>
          <label htmlFor={`nl-${HONEYPOT_FIELD}`}>Company website</label>
          <input
            id={`nl-${HONEYPOT_FIELD}`}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Button type="submit" variant="primary">
          {pending ? 'Sending…' : 'Subscribe'}
        </Button>

        <p
          id={errorId}
          role={failed ? 'alert' : 'status'}
          aria-live={failed ? 'assertive' : 'polite'}
          style={{
            ...styles.status,
            color: failed ? '#FCA5A5' : color.cyan,
          }}
        >
          {state.message || state.errors?.email || ''}
        </p>
      </form>

      <style jsx>{`
        .cn-news-input {
          flex: 1 1 220px;
          min-width: 0;
          padding: 0.8rem 1.1rem;
          border: 1px solid ${color.border};
          border-radius: ${radius.pill}px;
          background: rgba(255, 255, 255, 0.04);
          color: ${color.text};
          font-size: 0.94rem;
          transition:
            border-color 240ms ${ease.out},
            background 240ms ${ease.out};
        }

        .cn-news-input::placeholder {
          color: ${color.textFaint};
        }

        .cn-news-input:hover {
          border-color: ${color.borderStrong};
        }

        .cn-news-input:focus {
          outline: none;
          border-color: ${color.cyan};
          background: rgba(255, 255, 255, 0.06);
        }

        .cn-news-input[aria-invalid='true'] {
          border-color: #fca5a5;
        }
      `}</style>
    </>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
    flex: '1 1 340px',
  },
  honeypot: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
  },
  status: {
    flexBasis: '100%',
    minHeight: '1.2rem',
    fontSize: '0.85rem',
    lineHeight: 1.5,
  },
} satisfies Record<string, React.CSSProperties>;
