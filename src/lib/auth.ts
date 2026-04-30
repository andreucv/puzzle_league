import "dotenv/config";
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from '$lib/database/create_prisma_client';
import { sendVerificationEmail } from '$lib/emails/send_verification_email';

export const auth = betterAuth({
    secret: `${process.env.BETTER_AUTH_SECRET}`,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true
    },
    emailVerification: {
        sendOnSignUp: true,
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
