import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getHomeDashboardData } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
	// Custom dependency for targeted invalidation (avoids re-running root layout on back-navigation)
	event.depends('data:home-dashboard');

	// Read the user from locals (set by hooks) instead of awaiting parent(), so the
	// dashboard queries start immediately instead of after the layout loads resolve.
	const userId = event.locals.user?.id;
	if (!userId) {
		throw redirect(302, "/login");
	}

	return {
		props: await getHomeDashboardData(userId)
	};
};
