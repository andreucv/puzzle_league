import type { PageServerLoad } from "./$types";
import { getCompetition } from "$lib/database/db_competition";
import { getInscriptionsForCompetition } from "$lib/database/db_entry";
import { prisma } from "$lib/database/create_prisma_client";
import { redirect } from "@sveltejs/kit";
import { Role } from "$lib/.prisma/generated/prisma/enums";

export const load: PageServerLoad = async (event) => {
    const competitionId = parseInt(event.params.id);

    if (isNaN(competitionId)) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const competition = await getCompetition(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    // Check the user is the creator, has an ORGANIZER role for this competition, or is an ADMIN
    const userId = event.locals.user?.id;
    if (!userId) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    const isCreator = competition.creatorId === userId;
    if (!isCreator) {
        const hasAccess = await prisma.roleAssignment.findFirst({
            where: {
                userId,
                OR: [
                    { role: Role.ADMIN},
                    { role: Role.ORGANIZER, competitionId }
                ]
            }
        });

        if (!hasAccess) {
            throw redirect(302, '/error/no_permission/');
        }
    }

    const categoriesWithInscriptions = await getInscriptionsForCompetition(competitionId);

    return {
        competition,
        categoriesWithInscriptions,
    };
};
