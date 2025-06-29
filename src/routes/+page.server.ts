import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";
import { getRoleAssignments, getUpcomingRegisteredCompetitions, getParticipatedCompetitions } from "$lib/database";

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	let roleAssignments = null;
	let upcomingRegisteredCompetitions = null;
	let participatedCompetitions = null;
	if (session) {
		roleAssignments = await getRoleAssignments(session.user.id);
		upcomingRegisteredCompetitions = await getUpcomingRegisteredCompetitions(session.user.id);
		participatedCompetitions = await getParticipatedCompetitions(session.user.id);
	}

	return {
		props: {
			session,
			roleAssignments: roleAssignments || null,
			upcomingRegisteredCompetitions: upcomingRegisteredCompetitions || null,
			participatedCompetitions: participatedCompetitions || null,
		}
	};
};
