import type { PageServerLoad } from "./$types";
import { getUpcomingCompetitions } from "$lib/database/db_competition_utils";

export const load: PageServerLoad = async (event) => {
    const BATCH_SIZE = 10;

    const upcoming_competitions : Competition[] = await getUpcomingCompetitions(BATCH_SIZE, 0);
    console.log("upcoming_competitions", upcoming_competitions);
    return {
        props: {
            upcoming_competitions,
        }
    }
}
