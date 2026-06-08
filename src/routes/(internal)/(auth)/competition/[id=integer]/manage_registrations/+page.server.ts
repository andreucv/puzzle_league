import type { PageServerLoad } from "./$types";
import { getCompetition } from "$lib/database/db_competition";
import { getRegistrationsForCompetition } from "$lib/database/db_entry";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
    const { competitionId, access } = await event.parent();

    // Custom dependency for targeted invalidation (avoids re-running root layout)
    event.depends('data:manage-registrations');

    if (!access.canManageCompetition) {
        throw redirect(302, '/error/no_permission/');
    }

    const competition = await getCompetition(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const categoriesWithRegistrations = await getRegistrationsForCompetition(competitionId);

    return {
        competition,
        categoriesWithRegistrations,
    };
};
