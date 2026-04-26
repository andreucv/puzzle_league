import { randomUUID } from 'crypto';
import type { SeedContext, UserSeedInput, SeededUser } from '../types';

/**
 * Upserts a list of test users into the database.
 * Uses email as the unique key — existing users are updated, new ones are created.
 *
 * Returns the actual database records (IDs may differ from input if the user
 * already existed).
 */
export async function upsertUsers(
    ctx: SeedContext,
    users: UserSeedInput[],
): Promise<SeededUser[]> {
    console.log(`👥 Upserting ${users.length} users...`);

    for (const u of users) {
        await ctx.prisma.user.upsert({
            where: { email: u.email },
            update: { name: u.name },
            create: {
                id: u.id ?? randomUUID(),
                name: u.name,
                email: u.email,
                emailVerified: u.emailVerified ?? true,
                country: u.country,
                postalCode: u.postalCode,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    // Re-fetch to get canonical IDs (input IDs are ignored if user existed)
    const dbUsers = await Promise.all(
        users.map(u => ctx.prisma.user.findUniqueOrThrow({ where: { email: u.email } })),
    );

    const result = dbUsers.map(u => ({ id: u.id, name: u.name, email: u.email }));
    console.log(`   ✅ ${result.length} users ready`);
    return result;
}
