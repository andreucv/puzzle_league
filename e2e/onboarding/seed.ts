/**
 * Suite seed for onboarding tests.
 *
 * Resets the participant user's onboarding-related fields so the
 * onboarding wizard is triggered on next page load.
 */
import "dotenv/config";
import { createSeedContext, writeSeedOutput } from '../seed_utils';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { participant } = ctx.baseUsers;

    // Reset all onboarding fields so the wizard shows language + phone + verify-email steps
    await ctx.prisma.user.update({
        where: { id: participant.id },
        data: {
            locale: null,
            localePromptLastChecked: null,
            phonePrefix: null,
            phoneNumber: null,
            phonePromptLastChecked: null,
            userIntentsLastChecked: null,
            emailVerified: false,
            emailVerificationPromptLastChecked: null,
        },
    });

    const output = {
        participantId: participant.id,
        participantName: participant.name,
        participantEmail: participant.email,
    };

    writeSeedOutput(import.meta.url, output);
    await ctx.prisma.$disconnect();
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
