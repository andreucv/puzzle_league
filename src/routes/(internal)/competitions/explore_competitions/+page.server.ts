import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/database";

export const load: PageServerLoad = async () => {
    // Fetch all competitions with categories, sorted by startDate (soonest first)
    const competitions = await prisma.competition.findMany({
        include: {
            categories: true,
        },
        orderBy: {
            startDate: 'asc'
        },
    });

    return {
        competitions,
    };
};
