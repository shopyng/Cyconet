'use server';

/**
 * Server Actions for every form on the site.
 *
 * Each action takes `(prevState, formData)` so the form component can drive it
 * with `useActionState` and render field-level errors. Because they are plain
 * Server Actions attached to a real <form action={...}>, the forms submit and
 * validate **without JavaScript** — progressive enhancement comes for free.
 *
 * Security note from the Next.js guide: Server Actions are reachable by direct
 * POST, not only through our UI. These endpoints are unauthenticated by design
 * (anyone may apply), so every one of them validates input, runs the honeypot
 * check and is rate limited rather than trusting the client.
 */

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  deliver,
  FALLBACK_MESSAGE,
  isBot,
  rateLimit,
  validate,
  type FormState,
} from './leads';
import { programs } from './content';
import { db } from './db';

const PROGRAM_IDS = programs.map((program) => program.id);
const SERVICE_OPTIONS = [
  'Security audit or penetration testing',
  'Custom software delivery',
  'Cloud & DevOps engineering',
  'Data & AI consulting',
  'Something else',
] as const;
const PLAN_OPTIONS = ['Day Pass', 'Resident', 'Team Suite', 'Not sure yet'] as const;

/** Best-effort client identity for rate limiting behind a proxy. */
async function clientKey(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Shared pipeline: bot check → rate limit → validate → deliver.
 * Keeps every action down to a rule table and a success message.
 */
async function handle(
  kind: Parameters<typeof deliver>[0],
  formData: FormData,
  rules: Parameters<typeof validate>[1],
  successMessage: string,
): Promise<FormState> {
  // Report success to bots so they get no signal that the trap fired.
  if (isBot(formData)) {
    return { status: 'success', message: successMessage };
  }

  if (!rateLimit(await clientKey())) {
    return {
      status: 'error',
      message: 'Too many submissions in a short time. Please try again in a minute.',
    };
  }

  const { values, errors } = validate(formData, rules);
  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      errors,
      values,
    };
  }

  try {
    await deliver(kind, values);
  } catch (error) {
    console.error(`[leads] ${kind} delivery failed:`, error);
    return { status: 'error', message: FALLBACK_MESSAGE, values };
  }

  return { status: 'success', message: successMessage };
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export async function submitApplication(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const successMessage =
    'Application received. We will be in touch within five working days with your next step.';

  // Report success to bots so they get no signal that the trap fired.
  if (isBot(formData)) {
    return { status: 'success', message: successMessage };
  }

  if (!rateLimit(await clientKey())) {
    return {
      status: 'error',
      message: 'Too many submissions in a short time. Please try again in a minute.',
    };
  }

  const { values, errors } = validate(formData, [
    { name: 'name', label: 'Full name', required: true, min: 2, max: 100 },
    { name: 'email', label: 'Email', required: true, type: 'email', max: 160 },
    { name: 'phone', label: 'Phone', required: true, type: 'phone' },
    { name: 'track', label: 'Track', required: true, oneOf: PROGRAM_IDS },
    { name: 'experience', label: 'Experience level', required: true, max: 60 },
    { name: 'motivation', label: 'Motivation', required: true, min: 40, max: 1500 },
  ]);

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      errors,
      values,
    };
  }

  const email = values.email.toLowerCase();
  const existingPending = await db.application.findFirst({
    where: { email, track: values.track, status: 'PENDING' },
    select: { id: true },
  });

  if (existingPending) {
    return {
      status: 'success',
      message:
        'Your application is already in review. We will be in touch within five working days with your next step.',
    };
  }

  await db.application.create({
    data: {
      name: values.name,
      email,
      phone: values.phone,
      track: values.track,
      experience: values.experience,
      motivation: values.motivation,
    },
  });
  revalidatePath('/admin', 'layout');

  try {
    await deliver('application', values);
  } catch (error) {
    console.error('[leads] application notification failed:', error);
  }

  return { status: 'success', message: successMessage };
}

export async function submitEnquiry(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  return handle(
    'enquiry',
    formData,
    [
      { name: 'name', label: 'Full name', required: true, min: 2, max: 100 },
      { name: 'email', label: 'Work email', required: true, type: 'email', max: 160 },
      { name: 'company', label: 'Company', required: true, max: 120 },
      { name: 'service', label: 'Service', required: true, oneOf: SERVICE_OPTIONS },
      { name: 'budget', label: 'Budget', max: 60 },
      { name: 'message', label: 'Project details', required: true, min: 30, max: 2000 },
    ],
    'Thanks — your enquiry is with our engagement team. Expect a reply within one working day.',
  );
}

export async function submitTour(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  return handle(
    'tour',
    formData,
    [
      { name: 'name', label: 'Full name', required: true, min: 2, max: 100 },
      { name: 'email', label: 'Email', required: true, type: 'email', max: 160 },
      { name: 'phone', label: 'Phone', required: true, type: 'phone' },
      { name: 'plan', label: 'Plan', required: true, oneOf: PLAN_OPTIONS },
      { name: 'preferredDate', label: 'Preferred date', max: 40 },
      { name: 'notes', label: 'Notes', max: 800 },
    ],
    'Tour request received. We will confirm a slot on Akala Expressway by email.',
  );
}

export async function subscribeNewsletter(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  return handle(
    'newsletter',
    formData,
    [{ name: 'email', label: 'Email', required: true, type: 'email', max: 160 }],
    'You are on the list for the next cohort brief.',
  );
}
