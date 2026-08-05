import 'server-only';
import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-secret-change-in-production'
);

const COOKIE_NAME = 'session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cookie `domain`, or undefined to let the browser scope it to the exact host.
 *
 * A leading dot shares the cookie across subdomains, which is what lets one
 * sign-in cover both learning. and admin. Derived from the same env var the
 * proxy uses, so the two cannot drift onto different domains.
 *
 * Returns undefined unless the host actually sits under that root. On a Vercel
 * preview (`*.vercel.app`) or localhost, a `.cyconet.ng` domain attribute does
 * not match the host and the browser silently discards the cookie — sign-in
 * would appear to succeed and then bounce straight back to the login page.
 */
function cookieDomain(host: string | undefined): string | undefined {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!root || !host) return undefined;

  const bare = host.split(':')[0].toLowerCase();
  return bare === root || bare.endsWith(`.${root}`) ? `.${root}` : undefined;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);

  const host = (await headers()).get('host') ?? undefined;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: cookieDomain(host),
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const host = (await headers()).get('host') ?? undefined;
  const cookieStore = await cookies();

  // Delete must match the domain the cookie was set with, otherwise the browser
  // keeps the cookie and sign-out silently fails.
  cookieStore.delete({
    name: COOKIE_NAME,
    domain: cookieDomain(host),
    path: '/',
  });
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return session;
}
