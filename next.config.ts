import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * A package-lock.json in the parent directory makes Turbopack infer the wrong
   * workspace root, which would resolve modules and trace files from outside
   * this project. Pinning the root to this directory removes the ambiguity.
   *
   * `turbopack` is a top-level option as of Next 16 — it was `experimental.turbopack` in 15.
   */
  turbopack: {
    root: __dirname,
  },

  async redirects() {
    return [
      {
        /*
         * The cybersecurity track lives at /cybersecurity-academy, which is the
         * stronger URL and the brand term. A second page at the /programs path
         * would compete with it for identical queries, so this consolidates
         * them. Permanent (308) so search engines transfer ranking signals
         * rather than treating it as a temporary detour.
         */
        source: '/programs/cybersecurity',
        destination: '/cybersecurity-academy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
