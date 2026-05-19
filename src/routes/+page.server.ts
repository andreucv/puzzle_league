import type { PageServerLoad } from "./$types";
import { getHomeDashboardData } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
	const { user } = await event.parent();

	// Custom dependency for targeted invalidation (avoids re-running root layout on back-navigation)
	event.depends('data:home-dashboard');

	if (!user) {
		return {
			props: {
				upcomingRegisteredCompetitions: null,
				participatedCompetitions: null,
				otherUpcomingCompetitions: null,
				lastResults: null,
				startedCompetitions: null,
				registrationStatuses: null,
			}
		};
	}

	return {
		props: await getHomeDashboardData(user.id)
	};
};
