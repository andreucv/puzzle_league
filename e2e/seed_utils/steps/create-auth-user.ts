import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from '../../../src/lib/.prisma/generated/prisma/client';
import type { SeedContext, AuthUserSeedInput, SeededAuthUser } from '../types';

/**
 * One Better Auth instance per Prisma client (which is itself per-worker — see
 * database_seed_context.ts). Building it is heavy crypto/adapter setup, so we
 * memoise it instead of constructing one per createAuthUser call.
 *
 * `betterAuth` is generic over the exact options shape, so the concrete instance
 * type is inferred from this factory rather than the wider `ReturnType<typeof
 * betterAuth>`.
 */
function createAuthInstance(prisma: PrismaClient) {
    return betterAuth({
        baseURL: 'http://localhost',
        secret: process.env.BETTER_AUTH_SECRET!,
        database: prismaAdapter(prisma, { provider: 'postgresql' }),
        emailAndPassword: { enabled: true },
    });
}

type AuthInstance = ReturnType<typeof createAuthInstance>;

const authCache = new WeakMap<PrismaClient, AuthInstance>();

function getAuth(prisma: PrismaClient): AuthInstance {
    let auth = authCache.get(prisma);
    if (!auth) {
        auth = createAuthInstance(prisma);
        authCache.set(prisma, auth);
    }
    return auth;
}

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

    const auth = getAuth(ctx.prisma);

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
