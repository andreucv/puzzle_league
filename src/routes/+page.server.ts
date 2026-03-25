import type { PageServerLoad } from "./$types";
import { getUpcomingRegisteredCompetitions, getParticipatedCompetitions, getStartedRegisteredCompetitions } from "$lib/database/database";
import { getNearCompetitions, getLastUserResults, getUserInscriptionStatuses } from "$lib/database/db_competition_utils";

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (!user) {
		return {
			props: {
				upcomingRegisteredCompetitions: null,
				participatedCompetitions: null,
				nearCompetitions: null,
				lastResults: null,
				startedCompetitions: null,
				inscriptionStatuses: null,
			}
		};
	}

	const [upcomingRegisteredCompetitions, participatedCompetitions, nearCompetitions, lastResults, startedCompetitions, inscriptionStatuses] = await Promise.all([
		getUpcomingRegisteredCompetitions(user.id),
		getParticipatedCompetitions(user.id),
		getNearCompetitions(6, user.country ?? undefined, user?.postalCode ?? undefined, false, user.id),
		getLastUserResults(user.id, 5),
		getStartedRegisteredCompetitions(user.id),
		getUserInscriptionStatuses(user.id),
	]);

	return {
		props: {
			upcomingRegisteredCompetitions: upcomingRegisteredCompetitions || null,
			participatedCompetitions: participatedCompetitions || null,
			nearCompetitions: nearCompetitions || null,
			lastResults: lastResults || null,
			startedCompetitions: startedCompetitions || null,
			inscriptionStatuses: inscriptionStatuses || null,
		}
	};
};
