import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain routing.
 *
 * Next 16 renamed `middleware` to `proxy` — same mechanism, clearer name for
 * what it is: a request interceptor sitting in front of the app.
 *
 * Three tenants share one deployment:
 *   cyconet.ng           → the existing marketing routes, untouched
 *   learning.cyconet.ng  → /learning/*  (student hub)
 *   admin.cyconet.ng     → /admin/*     (staff)
 *
 * Route *groups* — `(learning)` — cannot do this job: parentheses are stripped
 * from the URL, so `(learning)/dashboard` and `(admin)/dashboard` would both
 * resolve to `/dashboard` and Next would refuse to build. So the tenants get
 * real path prefixes and this rewrites onto them; the prefix never appears in
 * the address bar.
 *
 * Auth is deliberately NOT enforced here. Proxy runs on every request
 * including prefetches, and the Next auth guide is explicit that it should stay
 * an optimistic filter — the real checks live in the layouts and the DAL, close
 * to the data.
 */

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'cyconet.ng';

type Tenant = 'learning' | 'admin';

/**
 * Subdomain label for a Host header, or null for the apex/www (and anything
 * we do not recognise, which falls through to the marketing site).
 *
 * Handles `*.localhost` so the subdomains are reachable in development without
 * editing /etc/hosts — Chrome, Edge and Firefox resolve them automatically.
 */
function tenantOf(host: string): Tenant | null {
  // Strip the port: "admin.localhost:3000" → "admin.localhost"
  const bare = host.split(':')[0].toLowerCase();

  let label = '';
  if (bare.endsWith('.localhost')) {
    label = bare.slice(0, -'.localhost'.length);
  } else if (bare.endsWith(`.${ROOT}`)) {
    label = bare.slice(0, -(ROOT.length + 1));
  }

  return label === 'learning' || label === 'admin' ? label : null;
}

export function proxy(request: NextRequest) {
  const tenant = tenantOf(request.headers.get('host') ?? '');

  // Apex or www — serve the marketing site exactly as it is today.
  if (!tenant) return NextResponse.next();

  const { pathname } = request.nextUrl;

  /*
   * The prefixed paths are an internal implementation detail. Without this,
   * learning.cyconet.ng/admin/applications would rewrite to /admin/admin/...
   * — harmless — but admin.cyconet.ng/admin/applications would rewrite to
   * /admin/admin/... too while learning.cyconet.ng/learning/x would resolve
   * straight through to the real page, letting either subdomain address the
   * other's routes. Refusing the prefix outright keeps one tenant per host.
   */
  if (pathname.startsWith('/learning') || pathname.startsWith('/admin')) {
    return new NextResponse(null, { status: 404 });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${tenant}${pathname === '/' ? '' : pathname}`;

  /*
   * Forward the pre-rewrite path. Inside the app, nextUrl.pathname reports the
   * rewritten form (/learning/courses), which is what the router needs but not
   * what the sidebar wants to compare against. Layouts read this header during
   * the server render so the active nav item is correct in the first paint,
   * rather than appearing only after hydration.
   *
   * Note the shape: `rewrite(url, { request: { headers } })` sets headers on
   * the *upstream request*. Passing them at the top level would instead send
   * them back to the browser.
   */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  /*
   * Skip static assets and anything with a file extension. Note that Next runs
   * proxy on /_next/data regardless of this pattern — deliberate on their part,
   * so a protected page cannot leak through its data route.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
