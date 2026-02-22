import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCategoryEntriesFromCompetition, signUpUsersToCompetition, removeUserFromCategory } from "$lib/database/database";
import { auth } from "$lib/auth";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
    const session = await auth.api.getSession(event.request);

    if (!session?.user) {
        throw redirect(302, '/login');
    }

    const competitionId = parseInt(event.params.id);
    const competition = await getCompetitionWithCategories(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const existingRecords = await getCategoryEntriesFromCompetition(competitionId, session.user.id);

    return {
        competition,
        existingRecords: existingRecords || [],
    };
};

export const actions: Actions = {
    signup: async ({ request }) => {
        const session = await auth.api.getSession(request);

        if (!session?.user) {
            return { success: false, message: 'You must be logged in to sign up' };
        }

        const data = await request.formData();
        const signupsJson = data.get('signups')?.toString();

        if (!signupsJson) {
            return { success: false, message: 'No signup data provided' };
        }

        try {
            const signups = JSON.parse(signupsJson);

            if (!Array.isArray(signups) || signups.length === 0) {
                return { success: false, message: 'No categories selected for signup' };
            }

            const result = await signUpUsersToCompetition(signups, session.user.id);

            if (result.success) {
                return { success: true, message: result.message };
            } else {
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Error in signup action:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    },

    unregister: async ({ request }) => {
        const session = await auth.api.getSession(request);

        if (!session?.user) {
            return { success: false, message: 'You must be logged in' };
        }

        const data = await request.formData();
        const categoryId = data.get('category_id')?.toString();

        if (!categoryId) {
            return { success: false, message: 'Missing category ID' };
        }

        try {
            const result = await removeUserFromCategory(parseInt(categoryId), session.user.id);
            if (result) {
                return { success: true, message: 'Successfully unregistered' };
            }
            return { success: false, message: 'Failed to unregister' };
        } catch (error) {
            console.error('Error in unregister action:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
};
