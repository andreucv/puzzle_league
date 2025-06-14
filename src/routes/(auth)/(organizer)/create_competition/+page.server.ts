import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { createCompetition, getAllLeagues } from '$lib/database';
import { CategoryType } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
    // Load all leagues so the user can select which league to create the competition in
    try {
        const leagues = await getAllLeagues();
        const categories = Object.values(CategoryType);
        console.log('leagues:', leagues);
        console.log('categories:', categories);

        return {
            props: {
                leagues,
                categories
            }
        };

    } catch (error) {
        console.error('Error loading leagues:', error);
        return {
            props: {
                leagues: [],
                categories: []
            }
        };
    }
}

const create_competition: Action = async ({ locals, request, url }) => {
    const formData = await request.formData();
    console.log('(auth)/(organizer)/create_competition/+page.server.ts formData:', formData);

    // Extract form data
    const competitionName = formData.get('competition_name')?.toString();
    const description = formData.get('description')?.toString() || null;
    const location = formData.get('location')?.toString() || null;
    const startDate = formData.get('start_date')?.toString();
    const endDate = formData.get('end_date')?.toString();
    const leagueId = formData.get('league_id')?.toString();
    const selectedCategoriesJson = formData.get('selected_categories')?.toString();
    const categoryConfigsJson = formData.get('category_configs')?.toString();

    // Validate required fields
    if (!competitionName || !startDate) {
        return fail(400, {
            error_message: "Competition name, start date, and league are required."
        });
    }

    // Parse categories
    let selectedCategories: string[] = [];
    let categoryConfigs: any[] = [];

    try {
        selectedCategories = selectedCategoriesJson ? JSON.parse(selectedCategoriesJson) : [];
        categoryConfigs = categoryConfigsJson ? JSON.parse(categoryConfigsJson) : [];
        console.log('(auth)/(organizer)/create_competition/+page.server.ts selectedCategories:', selectedCategories);
        console.log('(auth)/(organizer)/create_competition/+page.server.ts categoryConfigs:', categoryConfigs);
    } catch (error) {
        return fail(400, {
            error_message: "Invalid category data format."
        });
    }

    if (selectedCategories.length === 0) {
        return fail(400, {
            error_message: "At least one category must be selected."
        });
    }

    // Format categories for database
    const formattedCategories = categoryConfigs
        .filter(config => config.id) // Only include categories with a selected type
        .map(config => {
            console.log("(auth)/(organizer)/create_competition/+page.server.ts config:", config);
            const categoryDate = config.date || startDate;
            // Combine category date with start time
            const [hours, minutes] = config.startTime.split(':').map(Number);
            const startDateTime = new Date(categoryDate);
            startDateTime.setHours(hours, minutes, 0, 0);

            // Combine category date with end time
            const [endHours, endMinutes] = config.endTime.split(':').map(Number);
            const endDateTime = new Date(categoryDate);
            endDateTime.setHours(endHours, endMinutes, 0, 0);

            return {
                name: config.categoryName,
                type: config.type, // This is now the categoryType value
                startTime: startDateTime,
                endTime: endDateTime,
                startDate: new Date(categoryDate),
                endDate: new Date(categoryDate),
                participationFee: config.participationFee || 0
            };
        });
    console.log('(auth)/(organizer)/create_competition/+page.server.ts formattedCategories:', formattedCategories);
    try {
        // Handle image upload if provided
        // let imageUrl = null;
        // if (competitionImage && competitionImage.size > 0) {
        //     // TODO: Implement image upload logic
        //     // imageUrl = await uploadImage(competitionImage);
        // }

        // Create competition with categories
        const result = await createCompetition(
            competitionName,
            description,
            new Date(startDate),
            new Date(endDate || startDate),
            leagueId || '',
            formattedCategories
        );

        console.log('Competition created successfully:', result.competition.id);

        // Redirect to the new competition's detail page
        throw redirect(303, `/competitions/competition_details/${result.competition.id}`);

    } catch (error) {
        console.error('Error creating competition:', error);
        return fail(500, {
            error_message: "An error occurred while creating the competition."
        });
    }
}

export const actions: Actions = { create_competition }
