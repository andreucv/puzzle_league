import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/database/database";

export const load: PageServerLoad = async ({ locals }) => {
    const userId = locals.user?.id;

    // Fetch all competitions with categories and records (for per-category registration display)
    const [competitions, registeredCategoryIds] = await Promise.all([
        prisma.competition.findMany({
            include: {
                categories: {
                    orderBy: { startTime: 'asc' },
                    include: {
                        records: {
                            include: {
                                users: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                startDate: 'asc'
            },
        }),
        // Fetch category IDs where the current user has a record (is registered)
        userId
            ? prisma.record.findMany({
                where: { users: { some: { id: userId } } },
                select: { categoryId: true },
            }).then(records => records.map(r => r.categoryId))
            : Promise.resolve([] as number[]),
    ]);

    return {
        competitions,
        registeredCategoryIds,
    };
};
