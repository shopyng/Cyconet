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
import { db } from './db';
import { createSession, destroySession, hashPassword, verifyPassword } from './auth';
import { rateLimit } from './leads';
import type { FormState } from './form-state';

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

  // Role decides the destination, not the form that was submitted.
  redirect(user.role === 'ADMIN' ? '/admin' : '/learning');
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect('/learning/login');
}
