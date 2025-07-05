import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";
import { getRoleAssignments, getUpcomingRegisteredCompetitions, getParticipatedCompetitions } from "$lib/database";

export const load: PageServerLoad = async ({ request }) => {
	let session = null;
	try {
		session = await auth.api.getSession({
			headers: request.headers,
		});
	} catch (error) {
		console.error("(routes page.server.ts) Error fetching user session:", error);
	}

	let upcomingRegisteredCompetitions = null;
	let participatedCompetitions = null;
	if (session) {
		upcomingRegisteredCompetitions = await getUpcomingRegisteredCompetitions(session.user.id);
		participatedCompetitions = await getParticipatedCompetitions(session.user.id);
	}

	return {
		props: {
			upcomingRegisteredCompetitions: upcomingRegisteredCompetitions || null,
			participatedCompetitions: participatedCompetitions || null,
		}
	};
};
