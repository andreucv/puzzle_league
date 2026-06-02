import type { PageServerLoad } from "./$types";
import { getHomeDashboardData } from "$lib/database/db_competition";

export const load: PageServerLoad = async (event) => {
	// Custom dependency for targeted invalidation (avoids re-running root layout on back-navigation)
	event.depends('data:home-dashboard');

	const { user } = await event.parent();

	return {
		props: await getHomeDashboardData(user.id)
	};
};
