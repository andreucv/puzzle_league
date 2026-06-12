import { createPrismaClient } from '../../src/lib/database/create_prisma_client';
import type { SeedContext } from './types';

/**
 * Creates a SeedContext for use in suite seed.ts files.
 *
 * Requires env vars:
 *  - DATABASE_URL (or the caller-chosen env var for the test DB)
 *  - TEST_ORGANIZER_USER_EMAIL, TEST_PARTICIPANT_USER_EMAIL, TEST_ADMIN_USER_EMAIL
 *
 * Fetches the three bootstrap users from the database so they are
 * immediately available as `ctx.baseUsers.organizer` etc.
 *
 * Call `ctx.prisma.$disconnect()` when the seed script is done.
 *
 * @param databaseUrl - Connection string for the target database
 */
export async function createSeedContext(databaseUrl: string): Promise<SeedContext> {
    const prisma = createPrismaClient(databaseUrl);
    const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const organizerEmail = process.env.TEST_ORGANIZER_USER_EMAIL;
    const participantEmail = process.env.TEST_PARTICIPANT_USER_EMAIL;
    const adminEmail = process.env.TEST_ADMIN_USER_EMAIL;

    if (!organizerEmail || !participantEmail || !adminEmail) {
        throw new Error(
            'Missing bootstrap user env vars. ' +
            'Ensure TEST_ORGANIZER_USER_EMAIL, TEST_PARTICIPANT_USER_EMAIL, and TEST_ADMIN_USER_EMAIL are set.',
        );
    }

    const [organizer, participant, admin] = await Promise.all([
        prisma.user.findUnique({ where: { email: organizerEmail } }),
        prisma.user.findUnique({ where: { email: participantEmail } }),
        prisma.user.findUnique({ where: { email: adminEmail } }),
    ]);

    if (!organizer || !participant || !admin) {
        const missing = [
            !organizer && `organizer (${organizerEmail})`,
            !participant && `participant (${participantEmail})`,
            !admin && `admin (${adminEmail})`,
        ].filter(Boolean).join(', ');
        throw new Error(
            `Bootstrap user(s) not found in DB: ${missing}. Did global-setup run?`,
        );
    }

    return {
        prisma,
        runId,
        unique: (base: string) => `${base} ${runId}`,
        baseUsers: {
            organizer: { id: organizer.id, name: organizer.name, email: organizer.email },
            participant: { id: participant.id, name: participant.name, email: participant.email },
            admin: { id: admin.id, name: admin.name, email: admin.email },
        },
    };
}
