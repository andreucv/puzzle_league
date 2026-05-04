import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getExploreCompetitionsData } from "$lib/database/db_competition";

export const load: PageServerLoad = async ({ locals }) => {
    const userId = locals.user?.id;

    try {
        const { competitions, registeredCategoryIds } = await getExploreCompetitionsData(userId);

        return {
            competitions,
            registeredCategoryIds,
        };
    } catch (err) {
        console.error('Error loading competitions:', err);
        throw error(500, { message: 'Unable to load competitions. Please try again later.', code: 'DB_ERROR' });
    }
};
