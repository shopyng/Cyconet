import 'server-only';
import { headers } from 'next/headers';

/**
 * Cross-host URL helpers for the three tenants.
 *
 * The proxy rewrites learning.cyconet.ng/courses → /learning/courses internally
 * and 404s any request whose path already carries a /learning or /admin prefix
 * (see src/proxy.ts — it keeps one tenant per host). Two consequences:
 *
 *   1. Same-host links must use the *external* path — `/courses`, never
 *      `/learning/courses`. Those are written literally in the pages; no helper
 *      needed, and `x-pathname` reports the same form so nav highlighting matches.
 *
 *   2. Links that cross hosts cannot be paths at all. A student bounced off the
 *      admin host belongs on learning.<root>. The canonical /verify/<code> URL
 *      lives on the apex, although the admin tenant also exposes a public alias
 *      so copied admin-host links remain verifiable.
 */

export type Tenant = 'learning' | 'admin';

/**
 * The apex host, derived from the request rather than from env.
 *
 * NEXT_PUBLIC_ROOT_DOMAIN is the production root, but in development the app is
 * reached at learning.localhost:3000, where that constant does not apply. Taking
 * the root from the Host header keeps dev, preview and production all correct:
 * strip a recognised tenant label and whatever remains is the apex, port intact.
 */
async function rootHost(): Promise<string> {
  const host = (await headers()).get('host') ?? '';
  const bare = host.toLowerCase();

  for (const label of ['learning.', 'admin.'] as const) {
    if (bare.startsWith(label)) return bare.slice(label.length);
  }
  return bare;
}

/**
 * Scheme for absolute URLs. Behind a proxy or load balancer the connection to
 * Next is plain HTTP even when the browser spoke HTTPS, so the forwarded header
 * wins; localhost falls back to http, everything else to https.
 */
async function scheme(host: string): Promise<string> {
  const forwarded = (await headers()).get('x-forwarded-proto');
  if (forwarded) return forwarded.split(',')[0].trim();
  return host.startsWith('localhost') || host.startsWith('127.0.0.1')
    ? 'http'
    : 'https';
}

/** Which tenant the current request is on, or null on the apex. */
export async function currentTenant(): Promise<Tenant | null> {
  const host = ((await headers()).get('host') ?? '').toLowerCase();
  if (host.startsWith('learning.')) return 'learning';
  if (host.startsWith('admin.')) return 'admin';
  return null;
}

/**
 * Absolute URL for a path on a tenant host.
 *
 * `path` is the external form: tenantUrl('learning', '/courses') →
 * https://learning.cyconet.ng/courses. Passing '/learning/courses' here would
 * produce a URL the proxy rejects, so pass the path as the browser should see it.
 */
export async function tenantUrl(tenant: Tenant, path = '/'): Promise<string> {
  const root = await rootHost();
  return `${await scheme(root)}://${tenant}.${root}${path}`;
}

/** Absolute URL for a path on the apex host — where the public routes live. */
export async function apexUrl(path = '/'): Promise<string> {
  const root = await rootHost();
  return `${await scheme(root)}://${root}${path}`;
}
