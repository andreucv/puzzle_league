import type { PageServerLoad } from "./$types";
import { getUpcomingRegisteredCompetitions, getParticipatedCompetitions } from "$lib/database/database";
import { getUpcomingCompetitions, getLastUserResults } from "$lib/database/db_competition_utils";

export const load: PageServerLoad = async ({ parent }) => {
	// Wait for layout data to avoid Prisma connection pool contention
	const { user } = await parent();

	if (!user) {
		return {
			props: {
				upcomingRegisteredCompetitions: null,
				participatedCompetitions: null,
				nearCompetitions: null,
				lastResults: null,
			}
		};
	}

	const [upcomingRegisteredCompetitions, participatedCompetitions, nearCompetitions, lastResults] = await Promise.all([
		getUpcomingRegisteredCompetitions(user.id),
		getParticipatedCompetitions(user.id),
		getUpcomingCompetitions(10, 0),
		getLastUserResults(user.id, 5),
	]);

	return {
		props: {
			upcomingRegisteredCompetitions: upcomingRegisteredCompetitions || null,
			participatedCompetitions: participatedCompetitions || null,
			nearCompetitions: nearCompetitions || null,
			lastResults: lastResults || null,
		}
	};
};
