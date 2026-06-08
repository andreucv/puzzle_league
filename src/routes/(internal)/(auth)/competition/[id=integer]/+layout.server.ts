import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getCompetitionAccess } from '$lib/services/competition-access';

/**
 * Shared layout for all competition management pages (manage_judges, manage_registrations,
 * during_competition). Resolves competition access once so child pages can use `parent()`
 * instead of making redundant DB queries.
 *
 * This layout does NOT enforce a specific access policy — each child page decides its own
 * guard (e.g. organizer-only vs judge-or-organizer) using the `access` object.
 */
export const load: LayoutServerLoad = async ({ params, locals, url }) => {
	const competitionId = parseInt(params.id);

	if (isNaN(competitionId)) {
		throw error(400, 'Invalid competition ID');
	}

	const user = locals.user;
	if (!user) {
		throw redirect(302, '/login?redirect=' + encodeURIComponent(url.pathname));
	}

	const access = await getCompetitionAccess(competitionId, user.id);

	return {
		competitionId,
		access,
	};
};
