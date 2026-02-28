import type { PageServerLoad } from "./$types";
import { getUpcomingRegisteredCompetitions, getParticipatedCompetitions } from "$lib/database/database";

export const load: PageServerLoad = async ({ parent }) => {
	// Wait for layout data to avoid Prisma connection pool contention
	const { user } = await parent();

	if (!user) {
		return {
			props: {
				upcomingRegisteredCompetitions: null,
				participatedCompetitions: null,
			}
		};
	}

	const [upcomingRegisteredCompetitions, participatedCompetitions] = await Promise.all([
		getUpcomingRegisteredCompetitions(user.id),
		getParticipatedCompetitions(user.id),
	]);

	return {
		props: {
			upcomingRegisteredCompetitions: upcomingRegisteredCompetitions || null,
			participatedCompetitions: participatedCompetitions || null,
		}
	};
};
