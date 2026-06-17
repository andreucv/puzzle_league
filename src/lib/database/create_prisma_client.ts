import "dotenv/config";
// Relative import so this file can be consumed by both SvelteKit (via $lib)
// and standalone tsx scripts (e2e seeds, db_migration) without alias issues.
import { PrismaClient } from '../.prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import { prismaQueryInsights } from "@prisma/sqlcommenter-query-insights";

/**
 * True when the singleton talks to Accelerate (a `prisma+postgres://` URL). Only
 * then is `cacheStrategy` a real, accepted query argument; sending it to the plain
 * adapter client (e.g. local dev / tests) throws `Unknown argument cacheStrategy`,
 * so guard cached queries with this flag.
 */
export const accelerateEnabled =
    (process.env.DATABASE_ACCELERATE_URL ?? '').startsWith('prisma+postgres://');

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
            accelerateUrl: url,
            comments: [prismaQueryInsights()]
        }).$extends(withAccelerate()) as unknown as PrismaClient;
    }
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({
        adapter,
        comments: [prismaQueryInsights()]
    });
}

/**
 * Lazily-created singleton for the running app — uses DATABASE_ACCELERATE_URL
 * from env. The client is instantiated on first access rather than at import
 * time, so importing this module during SvelteKit's postbuild route analysis
 * does not require the database URL to be present at build time.
 */
let singleton: PrismaClient | undefined;
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        singleton ??= createPrismaClient();
        const value = Reflect.get(singleton, prop);
        return typeof value === 'function' ? value.bind(singleton) : value;
    }
});
