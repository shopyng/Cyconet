'use server';

/**
 * Authentication actions: sign in, sign out.
 *
 * Shared by both tenants — the learning hub and the admin dashboard post to the
 * same `signIn`, which routes by role rather than by which form was used. A
 * student who submits the admin form still lands in the learning hub, and vice
 * versa, so there is no way to end up signed in on the wrong side.
 *
 * Rate limiting reuses `rateLimit()` from leads.ts rather than growing a second
 * implementation. Same caveat applies: per-process, so it stops a naive
 * password-guessing loop from one client, not a distributed one.
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { customAlphabet } from 'nanoid';
import { db } from './db';
import { createSession, destroySession, hashPassword, verifyPassword } from './auth';
import { rateLimit } from './leads';
import { tenantUrl } from './tenant';
import { HONEYPOT_FIELD, type FormState } from './form-state';

/**
 * A valid bcrypt hash of a value nobody can supply, computed once and reused.
 * Used to keep the failed-login path doing the same work as the success path —
 * see the comment at the comparison site.
 */
let decoy: Promise<string> | undefined;
function decoyHash(): Promise<string> {
  decoy ??= hashPassword(`decoy:${Math.random()}:${Date.now()}`);
  return decoy;
}

/** Best-effort client identity for rate limiting behind a proxy. */
async function clientKey(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    'unknown'
  );
}

export async function signIn(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return {
      status: 'error',
      message: 'Enter your email and password.',
      values: { email },
    };
  }

  if (!rateLimit(`signin:${await clientKey()}`)) {
    return {
      status: 'error',
      message: 'Too many attempts. Wait a minute and try again.',
      values: { email },
    };
  }

  const user = await db.user.findUnique({ where: { email } });

  /*
   * One message for "no such account" and for "wrong password", and the hash
   * comparison runs even when the user is missing. Branching earlier would let
   * an attacker map which addresses have accounts, either from the wording or
   * from the response time — bcrypt is slow enough to be a usable oracle.
   *
   * The decoy hash is generated at startup rather than hardcoded so it is
   * always a well-formed hash at the same cost factor as the real ones. A
   * malformed constant would be rejected early by bcrypt and collapse the
   * timing back into a signal.
   */
  const ok = await verifyPassword(password, user?.password ?? (await decoyHash()));

  if (!user || !ok) {
    return {
      status: 'error',
      message: 'Those details did not match an account.',
      values: { email },
    };
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  /*
   * Role decides the destination, not the form that was submitted — and the two
   * roles live on different hosts, so these are absolute URLs. A bare '/admin'
   * would be rewritten by the proxy on whichever host the form was posted from
   * and 404 (the prefix is internal); a bare '/' would keep a student who used
   * the admin form stuck on the admin host.
   */
  redirect(await tenantUrl(user.role === 'ADMIN' ? 'admin' : 'learning'));
}

export async function signOut(): Promise<void> {
  await destroySession();
  // Same host the user signed out from — the session cookie is shared across
  // subdomains, so there is no need to send them to the other tenant's form.
  redirect('/login');
}

/* ------------------------------------------------------------------ *
 * Registration
 * ------------------------------------------------------------------ */

/**
 * Payment reference quoted on the bank transfer.
 *
 * Same Crockford-style alphabet as the certificate codes in admin-actions.ts —
 * no I, L, O or U — because this is read off a screen and typed into a banking
 * app, where a 0/O mix-up means an unmatchable payment.
 */
const paymentReference = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 6);

/** Deliberately permissive. The real test of an address is that mail arrives. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MIN_PASSWORD = 10;

/**
 * Self-serve student registration.
 *
 * Creates the account, the enrolment and the payment record in one transaction.
 * The enrolment starts PENDING_PAYMENT, which is what the learning layout's
 * gate checks — so a student can sign in immediately and see exactly what they
 * owe, but not the course material.
 *
 * Unlike `signIn` above, this reports "that email is already registered" rather
 * than a generic failure. The timing- and wording-oracle care taken there does
 * not transfer: a signup form has to tell you the address is taken or it cannot
 * function, and an attacker can learn the same fact by attempting to register.
 * Hiding it would cost real usability for no gain.
 */
export async function signUp(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');
  const programId = String(formData.get('programId') ?? '').trim();

  // Echoed back on failure so a rejected submit does not wipe the form. The
  // passwords are deliberately never echoed.
  const values = { name, email, programId };

  // Honeypot: report success without creating anything, so a bot gets no signal.
  if (String(formData.get(HONEYPOT_FIELD) ?? '')) {
    return { status: 'success', message: 'Account created.' };
  }

  if (!rateLimit(`signup:${await clientKey()}`)) {
    return {
      status: 'error',
      message: 'Too many attempts. Wait a minute and try again.',
      values,
    };
  }

  const errors: Record<string, string> = {};

  if (name.length < 2) {
    errors.name = 'Enter your full name.';
  } else if (name.length > 120) {
    errors.name = 'Keep your name under 120 characters.';
  }

  if (!email) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (password.length < MIN_PASSWORD) {
    errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  } else if (password.length > 200) {
    // bcrypt truncates at 72 bytes; rejecting the extreme case avoids a
    // password that is silently shorter than the user believes.
    errors.password = 'Keep your password under 200 characters.';
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Include at least one letter and one number.';
  }

  if (confirm !== password) {
    errors.confirmPassword = 'Both passwords must match.';
  }

  const program = programId
    ? await db.program.findUnique({
        where: { id: programId },
        select: { id: true, title: true, priceKobo: true },
      })
    : null;
  if (!program) {
    errors.programId = 'Choose the programme you want to join.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      errors,
      values,
    };
  }

  /*
   * Redundant at runtime — a null program already added an error above and
   * returned — but the compiler cannot see that through the errors object, and
   * everything below dereferences it.
   */
  if (!program) {
    return {
      status: 'error',
      message: 'Choose the programme you want to join.',
      errors: { programId: 'Choose the programme you want to join.' },
      values,
    };
  }

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      status: 'error',
      message: 'An account with that email already exists.',
      errors: { email: 'Already registered — sign in instead.' },
      values,
    };
  }

  const passwordHash = await hashPassword(password);
  const reference = `CYC-${paymentReference()}`;

  /*
   * All four rows or none. A user with no enrolment could sign in to an empty
   * hub, and an enrolment with no payment row would leave the payment screen
   * with nothing to render — both are worse than a failed registration the
   * student can simply retry.
   */
  const created = await db.$transaction(async (tx) => {
    const student = await tx.user.create({
      data: { email, name, password: passwordHash, role: 'STUDENT' },
    });

    await tx.enrollment.create({
      data: {
        userId: student.id,
        programId: program.id,
        status: 'PENDING_PAYMENT',
      },
    });

    await tx.payment.create({
      data: {
        userId: student.id,
        programId: program.id,
        reference,
        amountKobo: program.priceKobo,
        status: 'AWAITING_PROOF',
      },
    });

    await tx.notification.create({
      data: {
        userId: student.id,
        title: 'Welcome to Cyconet',
        body: `Your place on ${program.title} is reserved. Complete payment to unlock the programme.`,
        href: '/payment',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: student.id,
        action: 'student.registered',
        entity: 'User',
        entityId: student.id,
        metadata: { email, programId: program.id, reference },
      },
    });

    return student;
  });

  await createSession({
    id: created.id,
    email: created.email,
    name: created.name,
    role: created.role,
  });

  /*
   * Absolute URL to the learning host. Registration is served from the apex,
   * and the session cookie is scoped to the shared parent domain, so the
   * browser carries it across — the same mechanism signIn relies on.
   */
  redirect(await tenantUrl('learning', '/payment'));
}
