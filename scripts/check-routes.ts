/**
 * Route smoke test against a running dev server.
 *
 * Run: npm run dev, then npm run check:routes
 *
 * Checks the status code and, where it matters, the shape of the response.
 * Deliberately does not sign in — the point of most of these assertions is
 * what an *unauthenticated* request gets, which is where the payment gate and
 * the certificate authorisation live.
 */

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3000';

type Check = {
  path: string;
  /** Accepted status codes. */
  expect: number[];
  /** Substring the body must contain, when the status is a 2xx. */
  contains?: string;
  note: string;
};

const CHECKS: Check[] = [
  { path: '/', expect: [200], contains: 'Cyconet', note: 'marketing home' },
  {
    path: '/register',
    expect: [200],
    contains: 'Create your account',
    note: 'self-serve registration form renders',
  },
  {
    path: '/register',
    expect: [200],
    contains: 'Cybersecurity',
    note: 'programme options come from the database',
  },
  {
    path: '/apply',
    expect: [200],
    note: 'legacy application route still works',
  },
  {
    path: '/verify/NOPE000000',
    expect: [200],
    contains: 'No certificate matches',
    note: 'unknown verification code is handled, not a crash',
  },
  {
    path: '/verify/NOPE000000/download',
    expect: [404],
    note: 'PDF download for an unknown code is a 404, not a broken file',
  },
  {
    /*
     * The learning hub on the apex host. Without authentication the DAL
     * redirects to /login, so this returns a redirect, not a 200 — and not the
     * route group's 404 either, which would be the case if the proxy had
     * rewritten this onto the internal prefix.
     */
    path: '/learning/certificate',
    expect: [307],
    note: 'hub route redirects when unauthenticated, does not serve content',
  },
  {
    path: '/api/payments/does-not-exist/proof',
    expect: [404],
    note: 'payment proof requires auth and a real record',
  },
  { path: '/sitemap.xml', expect: [200], contains: '/register', note: 'sitemap lists /register' },
  { path: '/robots.txt', expect: [200], note: 'robots.txt still served' },
];

// Wrapped in a function because tsx compiles this to CJS, where top-level
// await is not available.
async function main() {
  let failed = 0;

  for (const check of CHECKS) {
    let status = 0;
    let body = '';
    try {
      const response = await fetch(`${BASE}${check.path}`, { redirect: 'manual' });
      status = response.status;
      body = await response.text();
    } catch (error) {
      console.log(`FAIL  ${check.path}  — ${(error as Error).message}`);
      failed += 1;
      continue;
    }

    const statusOk = check.expect.includes(status);
    const bodyOk = !check.contains || status >= 300 || body.includes(check.contains);
    const ok = statusOk && bodyOk;
    if (!ok) failed += 1;

    const detail = !statusOk
      ? `got ${status}, want ${check.expect.join('/')}`
      : !bodyOk
        ? `missing "${check.contains}"`
        : String(status);

    console.log(
      `${ok ? 'ok  ' : 'FAIL'}  ${check.path.padEnd(34)} ${detail.padEnd(22)} ${check.note}`,
    );
  }

  console.log(failed === 0 ? '\nAll route checks passed.' : `\n${failed} route check(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
