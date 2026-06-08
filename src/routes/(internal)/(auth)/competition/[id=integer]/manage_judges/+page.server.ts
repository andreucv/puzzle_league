import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getCompetitionWithJudges } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
    const { competitionId, access } = await event.parent();

    // Custom dependency for targeted invalidation (avoids re-running root layout)
    event.depends('data:manage-judges');

    if (!access.canManageCompetition) {
        throw redirect(302, '/error/no_permission/');
    }

    const result = await getCompetitionWithJudges(competitionId);

    if (!result) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    return {
        competition: result.competition,
        categoriesWithJudges: result.categoriesWithJudges,
    };
};
