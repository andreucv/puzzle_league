import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCategoryEntriesFromCompetition, removeUserFromCategory, createEntries} from "$lib/database";
import { auth } from "$lib/auth";

export const load: PageServerLoad = async ( event ) => {
    const competition_id = event.url.pathname.split('/')[3];
    const competition_and_categories = await getCompetitionWithCategories(parseInt(competition_id));

    let records = undefined;
    let session = undefined;
    try {
        session = await auth.api.getSession(event.request);
    } catch (e) {
        console.log(`competitions/competition_details/id=${competition_id} error while getting session`, e);
    }

    if (session != undefined && session?.user && competition_and_categories) {
        const user_id = session.user.id;
        records = await getCategoryEntriesFromCompetition(parseInt(competition_id), user_id);
    }

    const competition_image_url = undefined; //await cloudinary.url(competition_and_categories.image);
    return {
        props:
        {
            competition_and_categories,
            records,
            competition_image_url,
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

    save_entries: async ({ request }) => {
        try {
            // Get the current user session
            const session = await auth.api.getSession(request);

            if (!session?.user) {
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
