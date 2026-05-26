import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getCompetitionWithJudges } from "$lib/database/db_competition";
import { getCompetitionAccess } from "$lib/services/competition-access";

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

    const access = await getCompetitionAccess(competitionId, userId);
    if (!access.isOrganizer) {
        throw redirect(302, '/error/no_permission/');
    }

    return {
        competition: result.competition,
        categoriesWithJudges: result.categoriesWithJudges,
    };
};
