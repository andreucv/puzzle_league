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
import { createSeedContext, createCompetition, createAuthUser } from '../seed_utils';

export default async function seed() {
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

    // 2. Create a second organizer who does not own the competition
    const secondOrganizer = await createAuthUser(ctx, {
        name: 'Second Organizer',
        email: 'second_organizer_e2e@test.com',
        password: 'second-org-pass!',
        role: 'ORGANIZER',
    });

    const result = {
        competition: { id: competition.id, name: competition.name },
        secondOrganizer,
        defaultOrganizer: {
            id: organizer.id,
            email: organizer.email,
        },
    };

    console.log('✅ Not-creator-organizer seed complete');
    return result;
}
