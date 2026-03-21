import type { PageServerLoad } from "./$types";
import { getUpcomingRegisteredCompetitions, getParticipatedCompetitions } from "$lib/database/database";
import { getNearCompetitions, getLastUserResults } from "$lib/database/db_competition_utils";

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

	console.log("Loading dashboard data for user ", user.id, " with country ", user.country, " and postal code ", user.postalCode);
	const [upcomingRegisteredCompetitions, participatedCompetitions, nearCompetitions, lastResults] = await Promise.all([
		getUpcomingRegisteredCompetitions(user.id),
		getParticipatedCompetitions(user.id),
		getNearCompetitions(6, user.country ?? undefined, user?.postalCode ?? undefined, false, user.id),
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
