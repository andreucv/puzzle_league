import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/database";

export const load: PageServerLoad = async (event) => {
    // Fetch all competitions with categories, sorted by startDate (soonest first)
    const competitions = await prisma.competition.findMany({
        include: {
            categories: true,
        },
        orderBy: {
            startDate: 'asc'
        },
    });

    // Get user's location for "Near Me" filtering
    const user = event.locals.user;
    const userCountry = user?.country ?? null;
    const userPostalCode = user?.postalCode ?? null;

    return {
        competitions,
        userCountry,
        userPostalCode,
    };
};
