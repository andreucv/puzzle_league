import type { PageServerLoad } from "./$types";
import { getUpcomingCompetitions, getPastCompetitions } from "$lib/database/db_competition_utils";

export const load: PageServerLoad = async (event) => {
    const BATCH_SIZE = 10;

    const past_competitions: Competition[]      = await getPastCompetitions(BATCH_SIZE, 0);
    console.log("past_competitions", past_competitions);
    return {
        props: {
            past_competitions
        }
    }
}
