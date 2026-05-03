import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetitionResults } from '$lib/database/db_competition';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const load: PageServerLoad = async ({ params, parent }) => {
    const competitionId = parseInt(params.id as string);

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    const competition = await getCompetitionResults(competitionId);

    if (!competition) {
        throw error(404, 'Competition not found');
    }

    let viewerIsPrivileged = false;
    const { user } = await parent();

    if (user && user.roleAssignments.some((r) => r.role === Role.ORGANIZER || r.role === Role.ADMIN)) {
        viewerIsPrivileged = true;
    }

    return {
        competition,
        viewerIsPrivileged
    };
};
