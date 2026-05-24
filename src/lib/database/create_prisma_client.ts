import "dotenv/config";
// Relative import so this file can be consumed by both SvelteKit (via $lib)
// and standalone tsx scripts (e2e seeds, db_migration) without alias issues.
import { PrismaClient } from '../.prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
/**
 * Creates a PrismaClient instance.
 *
 * @param databaseUrl - Connection string. Falls back to `process.env.DATABASE_URL`
 *                      when omitted (the default for the running SvelteKit app).
 */
export function createPrismaClient(databaseUrl?: string): PrismaClient {
    const url = databaseUrl ?? process.env.DATABASE_ACCELERATE_URL!;
    console.log(`Connecting to database with URL: ${url.startsWith('prisma+postgres://') ? 'prisma+postgres://***' : url}`);
    if (url.startsWith('prisma+postgres://')) {
        return new PrismaClient({
            accelerateUrl: url
        }).$extends(withAccelerate()) as unknown as PrismaClient;
    }
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
}

/** Singleton instance for the running app — uses DATABASE_URL from env. */
export const prisma = createPrismaClient();
