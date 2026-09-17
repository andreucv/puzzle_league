import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEntryCategoryRef } from '$lib/database/db_entry';
import { getCompetitionAccess } from '$lib/services/competition-access';

// QR resolver for printed entry cards. Lives outside (auth) so anonymous scans work.
// Organizer/judge-of-the-category → during_competition with the entry preselected;
// everyone else (participants, other judges, anonymous) → the category's results page.
export const GET: RequestHandler = async ({ params, locals }) => {
    const entry = await getEntryCategoryRef(params.entryId);
    if (!entry) throw error(404, 'Entry not found');

    const competitionId = entry.category.competitionId;
    let location = `/competitions/competition_details/${competitionId}/results?category=${entry.categoryId}`;

    if (locals.user) {
        const access = await getCompetitionAccess(competitionId, locals.user.id);
        if (access.canManageCompetition || access.judgedCategoryIds.includes(entry.categoryId)) {
            location = `/competition/${competitionId}/during_competition?category=${entry.categoryId}&entry=${params.entryId}`;
        }
    }

    // Role-dependent redirect: never let an intermediary cache one user's target for another.
    return new Response(null, {
        status: 302,
        headers: { Location: location, 'Cache-Control': 'no-store' }
    });
};
