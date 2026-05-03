import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getUpcomingCompetitions, getPastCompetitions } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
    const BATCH_SIZE = 10;

    try {
        const past_competitions: Competition[]      = await getPastCompetitions(BATCH_SIZE, 0);
        console.log("past_competitions", past_competitions);
        return {
            props: {
                past_competitions
            }
        }
    } catch (err) {
        console.error('Error loading past competitions:', err);
        throw error(500, { message: 'Unable to load past competitions. Please try again later.', code: 'DB_ERROR' });
    }
}
