import "dotenv/config";
// Relative import so this file can be consumed by both SvelteKit (via $lib)
// and standalone tsx scripts (e2e seeds, db_migration) without alias issues.
import { PrismaClient } from '../.prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Creates a PrismaClient instance.
 *
 * @param databaseUrl - Connection string. Falls back to `process.env.DATABASE_URL`
 *                      when omitted (the default for the running SvelteKit app).
 */
export function createPrismaClient(databaseUrl?: string): PrismaClient {
    const url = databaseUrl ?? process.env.DATABASE_URL!;
    if (url.startsWith('prisma+postgres://')) {
        return new PrismaClient({ accelerateUrl: url });
    }
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
}

/** Singleton instance for the running app — uses DATABASE_URL from env. */
export const prisma = createPrismaClient();
