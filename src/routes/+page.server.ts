import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getUpcomingCompetitions, getLandingStats } from "$lib/database/db_competition";

export const load: PageServerLoad = async ({ locals }) => {
	// locals.user is set by hooks before any load runs — checking it here instead of
	// awaiting parent() lets the landing queries start without waiting for the layout.
	if (locals.user) {
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
