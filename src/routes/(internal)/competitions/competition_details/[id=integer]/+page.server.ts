import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCompetitionCategories} from "$lib/database/db_competition";
import { getCategoryEntriesFromCompetition } from "$lib/database/db_entry";
import { removeUserFromCategory } from "$lib/database/db_registration";
import { getDuringCompetitionAccess } from "$lib/database/db_competition";


export const load: PageServerLoad = async ( event ) => {
    const competitionId = parseInt(event.params.id);

    // Use session from hooks (event.locals) instead of calling auth.api.getSession() again
    const user = event.locals.user;

    // Return all data as unwrapped promises for streaming — server responds instantly
    return {
        props:
        {
            competition_and_categories: getCompetitionWithCategories(competitionId),
            records: user
                ? getCategoryEntriesFromCompetition(competitionId, user.id)
                : Promise.resolve(undefined),
            categoriesWithCounts: getCompetitionCategories(competitionId),
            access: user
                ? getDuringCompetitionAccess(competitionId, user.id)
                : Promise.resolve({ isOrganizer: false, isJudge: false, judgedCategoryIds: [] }),
        }
    }
}
