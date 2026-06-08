import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCompetitionCategories } from "$lib/database/db_competition";
import { getCategoryEntriesFromCompetition, getRegisteredUserIdsByCategory } from "$lib/database/db_entry";
import { isRegistrationWorkflowError, submitRegistration, unregisterRegistration } from "$lib/services/registration-workflow";
import { redirect } from "@sveltejs/kit";
import { getCompetitionAccess } from "$lib/services/competition-access";
import { getAvailableTagsByCategory } from "$lib/database/db_participant_tags";

export const load: PageServerLoad = async (event) => {
    const user = event.locals.user;

    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    // Custom dependency for targeted invalidation (avoids re-running root layout)
    event.depends('data:registration');

    const competitionId = parseInt(event.params.id);
    const competition = await getCompetitionWithCategories(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const [existingEntries, registeredUserIds, categoriesWithCounts, competitionAccess, availableTagsByCategory] = await Promise.all([
        getCategoryEntriesFromCompetition(competitionId, user.id),
        getRegisteredUserIdsByCategory(competitionId),
        getCompetitionCategories(competitionId),
        getCompetitionAccess(competitionId, user.id),
        getAvailableTagsByCategory(competitionId)
    ]);

    return {
        competition,
        existingEntries: existingEntries || [],
        registeredUserIds,
        categoriesWithCounts,
        isOrganizer: competitionAccess.canManageCompetition,
        availableTagsByCategory,
    };
};

export const actions: Actions = {
    signup: async ({ request, locals, params }) => {
        const user = locals.user;

        if (!user) {
            return { success: false, message: 'You must be logged in to sign up' };
        }

        const data = await request.formData();
        const signupsJson = data.get('signups')?.toString();

        if (!signupsJson) {
            return { success: false, message: 'No signup data provided' };
        }

        try {
            const signups = JSON.parse(signupsJson);

            // Verify organizer status server-side (never trust the client)
            const competitionId = parseInt(params.id);
            const access = await getCompetitionAccess(competitionId, user.id);

            const result = await submitRegistration({
                competitionId,
                actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: access.canManageCompetition },
                signups,
            });

            return { success: true, summary: result.summary };
        } catch (error) {
            console.error('Error in signup action:', error);
            return {
                success: false,
                message: isRegistrationWorkflowError(error)
                    ? error.message
                    : error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    },

    unregister: async ({ request, locals }) => {
        const user = locals.user;

        if (!user) {
            return { success: false, message: 'You must be logged in' };
        }

        const data = await request.formData();
        const entryId = data.get('entry_id')?.toString();

        if (!entryId) {
            return { success: false, message: 'Missing entry ID' };
        }

        try {
            await unregisterRegistration({
                entryId,
                actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: false },
            });
            return { success: true, message: 'Successfully unregistered' };
        } catch (error) {
            console.error('Error in unregister action:', error);
            return {
                success: false,
                message: isRegistrationWorkflowError(error)
                    ? error.message
                    : error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
};
