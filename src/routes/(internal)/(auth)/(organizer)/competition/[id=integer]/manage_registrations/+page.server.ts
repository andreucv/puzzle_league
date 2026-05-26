import type { PageServerLoad } from "./$types";
import { getCompetition } from "$lib/database/db_competition";
import { getRegistrationsForCompetition } from "$lib/database/db_entry";
import { redirect } from "@sveltejs/kit";
import { getCompetitionAccess } from "$lib/services/competition-access";

export const load: PageServerLoad = async (event) => {
    const competitionId = parseInt(event.params.id);

    // Custom dependency for targeted invalidation (avoids re-running root layout)
    event.depends('data:manage-registrations');

    if (isNaN(competitionId)) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const competition = await getCompetition(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    // Check the user is the creator, has a scoped ORGANIZER role for this competition, or is an ADMIN
    const userId = event.locals.user?.id;
    if (!userId) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    const access = await getCompetitionAccess(competitionId, userId);
    if (!access.isOrganizer) {
        throw redirect(302, '/error/no_permission/');
    }

    const categoriesWithRegistrations = await getRegistrationsForCompetition(competitionId);

    return {
        competition,
        categoriesWithRegistrations,
    };
};
