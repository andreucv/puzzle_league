import type { PageServerLoad } from "./$types";
import type { Competition } from "$prisma/browser";
import { error } from "@sveltejs/kit";
import { getUpcomingCompetitions } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
    const BATCH_SIZE = 10;

    try {
        const upcoming_competitions : Competition[] = await getUpcomingCompetitions(BATCH_SIZE, 0);
        console.log("upcoming_competitions", upcoming_competitions);
        return {
            props: {
                upcoming_competitions,
            }
        }
    } catch (err) {
        console.error('Error loading upcoming competitions:', err);
        throw error(500, { message: 'Unable to load upcoming competitions. Please try again later.', code: 'DB_ERROR' });
    }
}
