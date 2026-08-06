import 'server-only';

/**
 * Lead validation and delivery.
 *
 * Zero dependencies: the validators are hand-rolled and Resend is called over
 * its REST API with `fetch`, so adding lead capture does not pull a validation
 * library or an SDK into the bundle.
 *
 * ── Delivery ────────────────────────────────────────────────────────────────
 * Configure these environment variables to actually send mail:
 *
 *   RESEND_API_KEY     API key from resend.com
 *   LEAD_FROM_EMAIL    verified sender, e.g. "Cyconet <noreply@cyconet.com>"
 *   LEAD_NOTIFY_EMAIL  where submissions land, e.g. admissions@cyconet.com
 *
 * Programme applications are stored in Postgres first and use this module only
 * for best-effort staff notification. Other leads are written to `.leads.jsonl`
 * in development when email is not configured, and rejected with an actionable
 * error in production so enquiries do not silently disappear.
 */

import { appendFile } from 'node:fs/promises';
import { brand } from './content';
import { HONEYPOT_FIELD, type FieldErrors } from './form-state';

// Re-exported for server-side callers so they have a single import site.
export type { FieldErrors, FormState } from './form-state';
export { IDLE_STATE, HONEYPOT_FIELD } from './form-state';

export type LeadKind = 'application' | 'enquiry' | 'tour' | 'newsletter';

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

type Rule = {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'email' | 'phone';
  min?: number;
  max?: number;
  oneOf?: readonly string[];
};

/**
 * Pragmatic email check. Deliberately not RFC 5322 — the only authority on
 * whether an address exists is sending to it, so this rejects obvious typos
 * without turning away unusual but valid addresses.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s()-]{6,20}$/;

export function validate(
  formData: FormData,
  rules: readonly Rule[],
): { values: Record<string, string>; errors: FieldErrors } {
  const values: Record<string, string> = {};
  const errors: FieldErrors = {};

  for (const rule of rules) {
    const raw = formData.get(rule.name);
    const value = typeof raw === 'string' ? raw.trim() : '';
    values[rule.name] = value;

    if (!value) {
      if (rule.required) errors[rule.name] = `${rule.label} is required.`;
      continue;
    }
    if (rule.min && value.length < rule.min) {
      errors[rule.name] = `${rule.label} must be at least ${rule.min} characters.`;
      continue;
    }
    if (rule.max && value.length > rule.max) {
      errors[rule.name] = `${rule.label} must be under ${rule.max} characters.`;
      continue;
    }
    if (rule.type === 'email' && !EMAIL.test(value)) {
      errors[rule.name] = 'Enter a valid email address.';
      continue;
    }
    if (rule.type === 'phone' && !PHONE.test(value)) {
      errors[rule.name] = 'Enter a valid phone number.';
      continue;
    }
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      errors[rule.name] = `Choose one of the listed ${rule.label.toLowerCase()} options.`;
    }
  }

  return { values, errors };
}

/** True when the honeypot field was filled — see HONEYPOT_FIELD. */
export function isBot(formData: FormData): boolean {
  const trap = formData.get(HONEYPOT_FIELD);
  return typeof trap === 'string' && trap.trim().length > 0;
}

/* ------------------------------------------------------------------ *
 * Rate limiting
 * ------------------------------------------------------------------ */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

/**
 * In-memory, per-process rate limit.
 *
 * Caveat worth knowing before this goes live: serverless deployments run many
 * isolated instances, so the real ceiling is roughly MAX_PER_WINDOW × instance
 * count. It stops a naive flood from one client, not a distributed attack —
 * for that, move this to Redis or a platform WAF rule.
 */
export function rateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/* ------------------------------------------------------------------ *
 * Delivery
 * ------------------------------------------------------------------ */

const SUBJECTS: Record<LeadKind, string> = {
  application: 'New application',
  enquiry: 'New project enquiry',
  tour: 'New hub tour request',
  newsletter: 'New newsletter subscriber',
};

function toEmailBody(kind: LeadKind, values: Record<string, string>): string {
  const rows = Object.entries(values)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `${SUBJECTS[kind]}\n\n${rows}\n\nReceived: ${new Date().toISOString()}`;
}

export async function deliver(
  kind: LeadKind,
  values: Record<string, string>,
): Promise<void> {
  await sendEmail({
    replyTo: values.email || undefined,
    subject: `${SUBJECTS[kind]} — ${values.name || values.email || 'Cyconet'}`,
    text: toEmailBody(kind, values),
  });
}

export async function sendEmail({
  to,
  replyTo,
  subject,
  text,
}: {
  to?: string;
  replyTo?: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  const recipient = to ?? process.env.LEAD_NOTIFY_EMAIL;

  if (apiKey && from && recipient) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: replyTo,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend responded ${response.status}`);
    }
    return;
  }

  // Not configured. In development, persist locally so the flow is testable.
  if (process.env.NODE_ENV !== 'production') {
    const line = JSON.stringify({ kind: 'email', to: recipient, subject, text, at: new Date().toISOString() });
    await appendFile('.leads.jsonl', `${line}\n`, 'utf8');
    console.warn(
      `[leads] No RESEND_API_KEY configured — email written to .leads.jsonl instead of being sent.`,
    );
    return;
  }

  // Configured nowhere in production: fail loudly rather than drop the lead.
  throw new Error('Lead delivery is not configured');
}

/** Shown when delivery fails, so the person always has a way to reach us. */
export const FALLBACK_MESSAGE = `Something went wrong on our side. Please email ${brand.email} and we will pick it up straight away.`;
