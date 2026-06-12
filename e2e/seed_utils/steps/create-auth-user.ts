import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { SeedContext, AuthUserSeedInput, SeededAuthUser } from '../types';

/** User fields that mark every onboarding prompt as completed. */
const ONBOARDED_FIELDS = {
    emailVerified: true,
    locale: 'en',
    localePromptLastChecked: new Date(),
    country: 'ES',
    postalCode: '08001',
    locationPromptLastChecked: new Date(),
    phonePrefix: '+99',
    phoneNumber: '99999',
    phonePromptLastChecked: new Date(),
    externalParticipantsLastChecked: new Date(),
    emailVerificationPromptLastChecked: new Date(),
};

/**
 * Creates a suite-private user with login credentials via Better Auth (which
 * handles password hashing and the account row, exactly like the bootstrap
 * users in scripts/db_migration/action_seed_local_users.ts).
 *
 * The email is suffixed with the context runId, so every seed invocation
 * creates a fresh user — suites never share or reset users, and tests log in
 * with the returned credentials via the `actor` fixture.
 */
export async function createAuthUser(
    ctx: SeedContext,
    input: AuthUserSeedInput,
): Promise<SeededAuthUser> {
    const [local, domain] = input.email.split('@');
    const email = `${local}-${ctx.runId}@${domain}`;

    const auth = betterAuth({
        baseURL: 'http://localhost',
        secret: process.env.BETTER_AUTH_SECRET!,
        database: prismaAdapter(ctx.prisma, { provider: 'postgresql' }),
        emailAndPassword: { enabled: true },
    });

    const res = await auth.api.signUpEmail({
        body: { email, password: input.password, name: input.name },
    });
    if (!res?.user) {
        throw new Error(`Failed to create auth user ${email}`);
    }

    if (input.role) {
        await ctx.prisma.roleAssignment.create({
            data: { userId: res.user.id, role: input.role },
        });
    }

    if (input.onboarded !== false) {
        await ctx.prisma.user.update({
            where: { id: res.user.id },
            data: ONBOARDED_FIELDS,
        });
    }

    console.log(`👤 Auth user: ${input.name} <${email}>${input.role ? ` (${input.role})` : ''}`);
    return { id: res.user.id, name: input.name, email, password: input.password };
}
