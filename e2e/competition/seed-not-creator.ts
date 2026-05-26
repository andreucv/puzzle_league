/**
 * Seed for not-creator-organizer E2E tests.
 *
 * Creates:
 * 1. A competition owned by the default organizer (from .env)
 * 2. A second organizer user (with Better Auth credentials for login)
 *    who does NOT own the competition
 *
 * The second organizer has the global ORGANIZER role but is not the creator,
 * not a scoped competition organizer, and not an admin — so they should be
 * denied access to edit the competition.
 */
import "dotenv/config";
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createSeedContext, createCompetition } from '../seed_utils';
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createPrismaClient } from '../seed_utils';

const SECOND_ORGANIZER_EMAIL = 'second_organizer_e2e@test.com';
const SECOND_ORGANIZER_PASSWORD = 'second-org-pass!';
const SECOND_ORGANIZER_NAME = 'Second Organizer';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    // 1. Create a competition owned by the default organizer
    const now = new Date();
    const competition = await createCompetition(ctx, {
        name: 'Not Creator Test Competition',
        description: 'Competition for testing non-creator organizer access denial',
        location: 'Test Location',
        country: 'ES',
        postalCode: '08001',
        startDate: now,
        endDate: now,
        creatorId: organizer.id,
        registrationOpen: false,
        categories: [
            {
                description: '500 pcs',
                type: 'INDIVIDUAL',
                maxPartySize: 1,
                maxParties: 10,
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
            },
        ],
    });

    // 2. Create a second organizer user via Better Auth (handles password hashing)
    const rawPrisma = createPrismaClient(databaseUrl);

    const auth = betterAuth({
        baseURL: 'http://localhost',
        secret: process.env.BETTER_AUTH_SECRET!,
        database: prismaAdapter(rawPrisma, { provider: "postgresql" }),
        emailAndPassword: { enabled: true },
    });

    const existing = await rawPrisma.user.findUnique({ where: { email: SECOND_ORGANIZER_EMAIL } });
    if (!existing) {
        await auth.api.signUpEmail({
            body: { email: SECOND_ORGANIZER_EMAIL, password: SECOND_ORGANIZER_PASSWORD, name: SECOND_ORGANIZER_NAME },
        });
        console.log(`   ✅ Created second organizer: ${SECOND_ORGANIZER_EMAIL}`);
    } else {
        console.log(`   ⏭️  Second organizer already exists — skipping creation.`);
    }

    // Assign the global ORGANIZER role + mark onboarding as complete
    const secondUser = await rawPrisma.user.findUniqueOrThrow({ where: { email: SECOND_ORGANIZER_EMAIL } });
    await rawPrisma.roleAssignment.upsert({
        where: { userId_role: { userId: secondUser.id, role: 'ORGANIZER' } },
        update: {},
        create: { userId: secondUser.id, role: 'ORGANIZER' },
    });
    await rawPrisma.user.update({
        where: { id: secondUser.id },
        data: {
            emailVerified: true,
            phonePrefix: '+99',
            phoneNumber: '99999',
            phonePromptLastChecked: new Date(),
            locale: 'en',
            localePromptLastChecked: new Date(),
            externalParticipantsLastChecked: new Date(),
            emailVerificationPromptLastChecked: new Date(),
            country: 'ES',
            postalCode: '99999',
            locationPromptLastChecked: new Date(),
        },
    });
    console.log(`   👤 ORGANIZER role assigned to ${SECOND_ORGANIZER_EMAIL}`);

    // Write test data
    const dir = dirname(fileURLToPath(import.meta.url));
    writeFileSync(join(dir, 'test-data.json'), JSON.stringify({
        competition: { id: competition.id, name: competition.name },
        secondOrganizer: {
            id: secondUser.id,
            email: SECOND_ORGANIZER_EMAIL,
            password: SECOND_ORGANIZER_PASSWORD,
            name: SECOND_ORGANIZER_NAME,
        },
        defaultOrganizer: {
            id: organizer.id,
            email: organizer.email,
        },
    }, null, 2), 'utf-8');

    console.log('✅ Not-creator-organizer seed complete');
    await rawPrisma.$disconnect();
    await ctx.prisma.$disconnect();
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
