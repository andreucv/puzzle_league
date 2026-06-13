/**
 * Suite seed for profile tests.
 *
 * Creates a fresh, fully-onboarded dedicated user so the suite can edit
 * profile fields (name, phone) without mutating the shared bootstrap
 * participant that other suites rely on.
 */
import "dotenv/config";
import { createSeedContext, createAuthUser } from '../seed_utils';

export default async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);

    const user = await createAuthUser(ctx, {
        name: 'Profile Test User',
        email: 'profile_e2e@test.com',
        password: 'profile-pass!',
    });

    const result = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPassword: user.password,
    };
    return result;
}
