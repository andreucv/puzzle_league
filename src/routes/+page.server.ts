import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getUpcomingCompetitions, getLandingStats } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
	const { user } = await event.parent();

	if (user) {
		throw redirect(307, "/home");
	}

	const [featuredCompetitions, landingStats] = await Promise.all([
		getUpcomingCompetitions(6, 0),
		getLandingStats(),
	]);

	return {
		featuredCompetitions,
		landingStats,
	};
};
