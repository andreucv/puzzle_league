import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from '$lib/database/create_prisma_client';

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: `${process.env.BETTER_AUTH_SECRET}`,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: `${process.env.GOOGLE_CLIENT_ID}`,
            clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
        },
    },
});
