import type { SeedContext, CompetitionSeedInput, SeededCompetition } from '../types';
import { CategoryType } from '../../../src/lib/.prisma/generated/prisma/enums';

/**
 * Creates a competition with nested categories in a single transaction.
 * Returns the created competition and its category IDs.
 */
export async function createCompetition(
    ctx: SeedContext,
    input: CompetitionSeedInput,
): Promise<SeededCompetition> {
    const competition = await ctx.prisma.competition.create({
        data: {
            // runId suffix keeps parallel suites/workers/runs from colliding;
            // tests must assert on the returned name, never the input name.
            name: ctx.unique(input.name),
            description: input.description,
            location: input.location,
            country: input.country,
            postalCode: input.postalCode,
            startDate: input.startDate,
            endDate: input.endDate,
            status: 'NOT_STARTED',
            registrationOpen: input.registrationOpen ?? false,
            creatorId: input.creatorId,
            showPaymentWarning: input.showPaymentWarning ?? false,
            categories: {
                create: input.categories.map(cat => ({
                    description: cat.description,
                    type: CategoryType[cat.type],
                    maxPartySize: cat.maxPartySize,
                    maxParties: cat.maxParties,
                    startTime: cat.startTime,
                    endTime: cat.endTime,
                    status: 'NOT_STARTED',
                    price: cat.price ?? 0,
                })),
            },
        },
        include: { categories: { orderBy: { id: 'asc' } } },
    });

    const result: SeededCompetition = {
        id: competition.id,
        name: competition.name,
        categories: competition.categories.map(c => ({
            id: c.id,
            description: c.description,
        })),
    };

    console.log(`🏆 Competition: ${result.name} (ID: ${result.id}) — ${result.categories.length} categories`);
    return result;
}
