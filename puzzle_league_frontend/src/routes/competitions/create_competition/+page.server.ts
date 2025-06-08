import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { createCompetition, getAllLeagues } from '$lib/database';

export const load: PageServerLoad = async (event) => {
    // Load all leagues so the user can select which league to create the competition in
    try {
        const leagues = await getAllLeagues();
        return {
            leagues
        };
    } catch (error) {
        console.error('Error loading leagues:', error);
        return {
            leagues: []
        };
    }
}

const create_competition: Action = async ({ locals, request, url }) => {
    const formData = await request.formData();

    // Extract form data
    const competitionName = formData.get('competition_name')?.toString();
    const description = formData.get('description')?.toString() || null;
    const startDate = formData.get('start_date')?.toString();
    const endDate = formData.get('end_date')?.toString();
    const leagueId = formData.get('league_id')?.toString();
    const categoriesJson = formData.get('categories')?.toString();

    // Validate required fields
    if (!competitionName || !startDate || !leagueId) {
        return fail(400, {
            error_message: "Competition name, start date, and league are required."
        });
    }

    // Parse categories
    let categories: any[] = [];
    if (categoriesJson) {
        try {
            categories = JSON.parse(categoriesJson);
        } catch (error) {
            return fail(400, {
                error_message: "Invalid categories format."
            });
        }
    }

    // Convert categories to the format expected by our database function
    const formattedCategories = categories.map(category => {
        const categoryDate = category.date || startDate;
        const categoryStartTime = new Date(`${categoryDate}T${category.start_time || '09:00'}`);
        const categoryEndTime = new Date(`${categoryDate}T${category.end_time || '17:00'}`);

        return {
            type: category.category_type as 'INDIVIDUAL' | 'PAIRS' | 'TEAM' | 'JUNIOR_INDIVIDUAL' | 'JUNIOR_PAIRS' | 'PUZZLE_CHESS',
            startTime: categoryStartTime,
            endTime: categoryEndTime,
            startDate: new Date(categoryDate),
            endDate: new Date(categoryDate)
        };
    });

    try {
        // Create competition with categories
        const result = await createCompetition(
            competitionName,
            description,
            new Date(startDate),
            new Date(endDate || startDate),
            leagueId,
            formattedCategories
        );

        console.log('Competition created successfully:', result.competition.id);

        // Redirect to the competitions page or the new competition's detail page
        throw redirect(303, `/competitions/competition_details/${result.competition.id}`);

    } catch (error) {
        console.error('Error creating competition:', error);
        return fail(500, {
            error_message: "An error occurred while creating the competition."
        });
    }
}

export const actions: Actions = { create_competition }
