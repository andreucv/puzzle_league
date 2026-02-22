import "dotenv/config";
import { PrismaClient } from "$lib/.prisma/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
    const url = process.env.DATABASE_URL!;
    if (url.startsWith('prisma+postgres://')) {
        return new PrismaClient({ accelerateUrl: url });
    }
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();
