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
    session: {
        // Serve the session from a short-lived signed cookie instead of hitting the
        // DB on every request. Trade-off: session revocation can lag up to maxAge.
        cookieCache: {
            enabled: true,
            maxAge: 300, // 5 minutes
        },
    },
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
            // Await the send so the serverless function is not frozen/killed by
            // Vercel before the email actually goes out (see issue #79). The
            // timing-attack concern that justifies fire-and-forget on the public
            // password-reset endpoint does not apply here: the user is already
            // authenticated and verifying their own address.
            await sendVerificationEmail(user.email, url);
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
