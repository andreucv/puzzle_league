import type { SeedContext, EntrySeedInput, SeededEntry } from '../types';
import { RegistrationStatus } from '../../../src/lib/.prisma/generated/prisma/enums';

/**
 * Creates registration entries for a category.
 * Each entry connects to one or more users as participants.
 */
export async function createEntries(
    ctx: SeedContext,
    inputs: EntrySeedInput[],
): Promise<SeededEntry[]> {
    console.log(`📝 Creating ${inputs.length} entries...`);

    const entries: SeededEntry[] = [];

    for (const input of inputs) {
        const entry = await ctx.prisma.entry.create({
            data: {
                categoryId: input.categoryId,
                creatorId: input.creatorId,
                status: RegistrationStatus[input.status],
                users: {
                    connect: input.userIds.map(id => ({ id })),
                },
            },
        });

        entries.push({
            id: entry.id,
            categoryId: entry.categoryId,
            creatorId: entry.creatorId,
        });
    }

    console.log(`   ✅ ${entries.length} entries created`);
    return entries;
}
