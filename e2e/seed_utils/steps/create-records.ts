import type { SeedContext, RecordSeedInput, SeededRecord } from '../types';
import { RegistrationStatus } from '../../../src/lib/.prisma/generated/prisma/enums';

/**
 * Creates registration records for a category.
 * Each record connects to one or more users as participants.
 */
export async function createRecords(
    ctx: SeedContext,
    inputs: RecordSeedInput[],
): Promise<SeededRecord[]> {
    console.log(`📝 Creating ${inputs.length} records...`);

    const records: SeededRecord[] = [];

    for (const input of inputs) {
        const record = await ctx.prisma.record.create({
            data: {
                categoryId: input.categoryId,
                creatorId: input.creatorId,
                status: RegistrationStatus[input.status],
                users: {
                    connect: input.userIds.map(id => ({ id })),
                },
            },
        });

        records.push({
            id: record.id,
            categoryId: record.categoryId,
            creatorId: record.creatorId,
        });
    }

    console.log(`   ✅ ${records.length} records created`);
    return records;
}
