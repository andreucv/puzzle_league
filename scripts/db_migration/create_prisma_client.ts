import "dotenv/config";
import { createPrismaClient } from '../../src/lib/database/create_prisma_client';

/**
 * Singleton Prisma client for CLI scripts.
 * Reads DATABASE_URL from environment — scripts control their own env.
 */
export const prisma = createPrismaClient(process.env.DATABASE_URL!);
