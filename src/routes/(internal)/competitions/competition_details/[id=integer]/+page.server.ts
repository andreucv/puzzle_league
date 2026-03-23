import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCompetitionCategories} from "$lib/database/database";
import { getCategoryEntriesFromCompetition, removeUserFromCategory } from "$lib/database/db_inscription_utils";
import { getDuringCompetitionAccess } from "$lib/database/db_competition_utils";


export const load: PageServerLoad = async ( event ) => {
    const competition_id = event.url.pathname.split('/')[3];
    const competitionId = parseInt(competition_id);
    const competition_and_categories = await getCompetitionWithCategories(competitionId);

    // Use session from hooks (event.locals) instead of calling auth.api.getSession() again
    const user = event.locals.user;

    // Run independent queries in parallel
    const [records, categoriesWithCounts, access] = await Promise.all([
        // User records (only if authenticated and competition exists)
        (user && competition_and_categories)
            ? getCategoryEntriesFromCompetition(competitionId, user.id)
            : Promise.resolve(undefined),
        // Category counts (always if competition exists)
        competition_and_categories
            ? getCompetitionCategories(competitionId)
            : Promise.resolve(undefined),
        // Organizer/judge access (only if authenticated)
        user
            ? getDuringCompetitionAccess(competitionId, user.id)
            : Promise.resolve({ isOrganizer: false, isJudge: false, judgedCategoryIds: [] }),
    ]);

    return {
        props:
        {
            competition_and_categories,
            records,
            categoriesWithCounts,
            isJudge: access.isJudge,
            isOrganizer: access.isOrganizer,
        }
    }
}

export const actions: Actions = {
    signup_to_category: async ({ request }) => {
        const data = await request.formData();
        const category_id = data.get('category_id')?.toString();
        const user_id = data.get('user_id')?.toString();

        if (!category_id || !user_id) {
            return {
                success: false,
                message: 'Missing required fields'
            }
        }


    },

    remove_entry: async ({ request }) => {
        const data = await request.formData();
        const category_id = data.get('category_id')?.toString();
        const user_id = data.get('user_id')?.toString();

        if (!category_id || !user_id) {
            return {
                success: false,
                message: 'Missing required fields'
            }
        }

        const result = await removeUserFromCategory(parseInt(category_id), user_id);
        if (result) {
            return {
                success: true,
                message: 'Party removed successfully'
            }
        } else {
            return {
                success: false,
                message: 'Failed to remove party'
            }
        }
    },

    save_entries: async ({ request, locals }) => {
        try {
            const user = locals.user;

            if (!user) {
                return {
                    success: false,
                    message: 'You must be logged in to create entries'
                };
            }

            const data = await request.formData();
            const entriesJson = data.get('records')?.toString();

            if (!entriesJson) {
                return {
                    success: false,
                    message: 'No entries data provided'
                };
            }

            // Parse the entries data
            const entriesData = JSON.parse(entriesJson);

            // Create the entries
            const result = await createEntries(entriesData);
            console.log('compeititon_details save_entries result', result);
            if (result.success) {
                return {
                    success: true,
                    message: result.message
                };
            } else {
                return {
                    success: false,
                    message: result.error
                };
            }

        } catch (error) {
            console.error('Error in save_entries action:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
}
