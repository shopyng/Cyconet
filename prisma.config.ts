import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * New in 7: the datasource `url` was removed from schema.prisma entirely. The
 * connection string now lives here for CLI commands (db push, migrate, studio)
 * and is passed to the driver adapter at runtime in src/lib/db.ts.
 *
 * `dotenv/config` is imported explicitly because Prisma 7 no longer loads .env
 * files automatically the way 6 and earlier did.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',

  datasource: {
    url: env('DATABASE_URL'),
  },

  migrations: {
    // Run with: npx prisma db seed
    seed: 'npx tsx prisma/seed.ts',
  },
});
