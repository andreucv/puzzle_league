/**
 * Restore seed for onboarding tests.
 *
 * Sets the participant user's onboarding-related fields back to
 * completed state so subsequent test suites are not affected.
 */
import "dotenv/config";
import { createSeedContext, writeSeedOutput } from '../seed_utils';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { participant } = ctx.baseUsers;

    // Restore all onboarding fields so the wizard is fully completed
    await ctx.prisma.user.update({
        where: { id: participant.id },
        data: {
            phonePrefix: '+99',
            phoneNumber: '99999',
            phonePromptLastChecked: new Date(),
            locale: 'en',
            localePromptLastChecked: new Date(),
            externalParticipantsLastChecked: new Date(),
            emailVerified: true,
            emailVerificationPromptLastChecked: new Date(),
            country: 'ES',
            postalCode: '99999',
            locationPromptLastChecked: new Date(),
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
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
