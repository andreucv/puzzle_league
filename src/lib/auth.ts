import "dotenv/config";
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from '$lib/database/create_prisma_client';
import { sendVerificationEmail } from '$lib/emails/send_verification_email';
import { sendPasswordResetEmail, sendSocialOnlyPasswordResetEmail } from '$lib/emails/send_password_reset_email';

export const auth = betterAuth({
    secret: `${process.env.BETTER_AUTH_SECRET}`,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            const accounts = await prisma.account.findMany({
                where: { userId: user.id },
                select: { providerId: true },
            });
            const hasCredential = accounts.some((a) => a.providerId === 'credential');

            if (!hasCredential) {
                // Social-only account: send an informational email explaining
                // they should sign in with their provider instead.
                const socialProviderIds = accounts.map((a) => a.providerId);
                void sendSocialOnlyPasswordResetEmail(user.email, socialProviderIds);
                return;
            }

            const hasSocialProvider = accounts.some((a) => a.providerId !== 'credential');

            // Fire-and-forget to avoid timing attacks
            void sendPasswordResetEmail(user.email, url, hasSocialProvider);
        },
        revokeSessionsOnPasswordReset: true,
        resetPasswordTokenExpiresIn: 600, // 10 minutes
    },
    emailVerification: {
        sendOnSignUp: false, // We'll send it manually during onboarding
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            // Fire-and-forget to avoid timing attacks
            void sendVerificationEmail(user.email, url);
        },
    },
    socialProviders: {
        google: {
            clientId: `${process.env.GOOGLE_CLIENT_ID}`,
            clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
        },
    },
    plugins: [
        jwt(),
    ]
});
