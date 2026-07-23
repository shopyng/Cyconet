/**
 * Form contract shared by client components and Server Actions.
 *
 * Deliberately isomorphic and dependency-free. It was originally part of
 * `leads.ts`, but that module imports `node:fs/promises` for its development
 * fallback — importing these constants from a client component therefore
 * dragged a Node built-in into the browser bundle and failed the build.
 *
 * Rule of thumb: anything a `'use client'` component needs to know about a form
 * belongs here; anything that touches the filesystem, the network or request
 * headers belongs in `leads.ts`.
 */

export type FieldErrors = Record<string, string>;

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  /** Keyed by field name, rendered beside the offending input. */
  errors?: FieldErrors;
  /** Echoed back so a failed submit does not wipe what the user typed. */
  values?: Record<string, string>;
};

export const IDLE_STATE: FormState = { status: 'idle', message: '' };

/**
 * Honeypot field name. A field hidden from humans but filled in by naive bots;
 * the server reports success without delivering anything, so the bot gets no
 * signal that it was caught.
 */
export const HONEYPOT_FIELD = 'company_website';
