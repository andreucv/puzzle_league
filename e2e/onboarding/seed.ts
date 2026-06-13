/**
 * Suite seed for onboarding tests.
 *
 * Creates a fresh, dedicated user with no onboarding fields set, so the
 * wizard is triggered on next page load. Each invocation creates a new
 * runId-unique user, so re-seeding (one per journey) needs no reset and
 * parallel suites are unaffected.
 */
import "dotenv/config";
import { createSeedContext, createAuthUser } from '../seed_utils';

export default async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);

    const user = await createAuthUser(ctx, {
        name: 'Onboarding Test User',
        email: 'onboarding_e2e@test.com',
        password: 'onboarding-pass!',
        onboarded: false,
    });

    const result = {
        participantId: user.id,
        participantName: user.name,
        participantEmail: user.email,
        participantPassword: user.password,
    };
    return result;
}
