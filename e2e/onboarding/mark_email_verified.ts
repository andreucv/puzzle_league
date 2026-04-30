/**
 * Helper script to mark a user's email as verified in the database.
 * Called mid-test to simulate email verification (since e2e tests
 * cannot click real verification links from emails).
 *
 * Usage: npx tsx e2e/onboarding/mark_email_verified.ts <userId>
 */
import "dotenv/config";
import { createPrismaClient } from '../seed_utils';

async function main() {
    const userId = process.argv[2];
    if (!userId) {
        console.error('Usage: npx tsx e2e/onboarding/mark_email_verified.ts <userId>');
        process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const prisma = createPrismaClient(databaseUrl);

    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
    });

    console.log(`✅ Email verified for user ${userId}`);
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
