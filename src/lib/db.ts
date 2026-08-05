import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma client singleton.
 *
 * Prisma 7 no longer reads the connection string from schema.prisma — the
 * `url` property was removed from the datasource block. The driver adapter now
 * owns the connection, and `PrismaPg` takes the URL (or a pg.Pool) directly.
 *
 * Cached on globalThis in development because HMR re-evaluates modules on every
 * edit; without this, each reload opens a fresh connection pool and Postgres
 * eventually refuses new clients. Production instantiates exactly once.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Fail with something actionable — the Prisma error for a missing
    // connection surfaces much deeper in the stack.
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance.',
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg(url),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
