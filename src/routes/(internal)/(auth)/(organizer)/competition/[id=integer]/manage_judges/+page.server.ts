import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/database/create_prisma_client";
import { redirect } from "@sveltejs/kit";
import { Role } from "$lib/.prisma/generated/prisma/enums";
import { getCompetitionWithJudges } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
    const competitionId = parseInt(event.params.id);

    // Custom dependency for targeted invalidation (avoids re-running root layout)
    event.depends('data:manage-judges');

    if (isNaN(competitionId)) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const result = await getCompetitionWithJudges(competitionId);

    if (!result) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const userId = event.locals.user?.id;
    if (!userId) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    const isCreator = result.competition.creatorId === userId;
    if (!isCreator) {
        const hasAccess = await prisma.roleAssignment.findFirst({
            where: {
                userId,
                OR: [
                    { role: Role.ADMIN },
                    { role: Role.ORGANIZER, competitionId }
                ]
            }
        });

        if (!hasAccess) {
            throw redirect(302, '/error/no_permission/');
        }
    }

    return {
        competition: result.competition,
        categoriesWithJudges: result.categoriesWithJudges,
    };
};
