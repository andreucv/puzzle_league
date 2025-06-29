import type { PageServerLoad, Actions } from '../$types';
import { getCompetitionWithCategories, signUpUsersToCompetition } from '$lib/database';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({url}) => {
    const competitionId = Number(url.pathname.split('/')[2]);
    console.log(`sign_up_competition&competition_id=${competitionId}`);
    // Fetch competition details using the competitionId
    const competitionDetails = await getCompetitionWithCategories(competitionId);
    console.log(`sign_up_competition&competition_id=${competitionId} competitionDetails`, competitionDetails);
    return {
        props: {
            competitionDetails
        }
    }
};

export const actions: Actions = {
    signup: async ({request}) => {
        try {
            // Get the current user session
            const session = await auth.api.getSession({
                headers: request.headers
            });

            if (!session?.user) {
                return {
                    success: false,
                    error: 'You must be logged in to sign up for competitions'
                };
            }

            const data = await request.formData();
            console.log('signUp data', data);

            const competitionId = data.get('competition_id')?.toString();
            const selectedCategoriesJson = data.get('selected_categories')?.toString();

            // Parse the JSON string to get the actual data structure
            const selectedCategories = selectedCategoriesJson ? JSON.parse(selectedCategoriesJson) : [];

            console.log('Parsed data:', {
                competition_id: competitionId,
                selected_categories: selectedCategories
            });

            // Transform the data to match the new interface
            const categorySignups = [];
            for (const categoryData of selectedCategories) {
                const categoryId = parseInt(Object.keys(categoryData)[0]);
                const teammates = categoryData[categoryId] || [];

                categorySignups.push({
                    categoryId,
                    teammateIds: teammates.map((t: any) => t.user_id)
                });

                console.log(`Category ${categoryId} has ${teammates.length} teammates:`, teammates);
            }

            // Call the database function to sign up users
            const result = await signUpUsersToCompetition(categorySignups, session.user.id);

            if (result.success) {
                console.log('Signup successful:', result.message);
                // You can redirect to a success page or back to the competition details
                return {
                    success: true,
                    message: result.message
                }
            } else {
                console.error('Signup failed:', result.error);
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            console.error('Error in signup action:', error);

            // Handle redirect errors (these are expected)
            if (error instanceof Response) {
                throw error;
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
};
