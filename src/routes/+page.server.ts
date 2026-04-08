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

	return {
		props: {
			upcomingRegisteredCompetitions: getUpcomingRegisteredCompetitions(user.id),
			participatedCompetitions: getParticipatedCompetitions(user.id),
			nearCompetitions: getNearCompetitions(6, user.country ?? undefined, user?.postalCode ?? undefined, false, user.id),
			lastResults: getLastUserResults(user.id, 5),
			startedCompetitions: getStartedRegisteredCompetitions(user.id),
			inscriptionStatuses: getUserInscriptionStatuses(user.id),
		}
	};
};
