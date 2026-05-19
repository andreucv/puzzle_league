import { fail } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { createCompetition } from '$lib/database/db_competition';
import { getAllLeagues } from '$lib/database/db_league';
import type { Competition, Category, Prisma } from '$lib/.prisma/generated/prisma/client';
import { CategoryType } from '$lib/.prisma/generated/prisma/enums';

export const load: PageServerLoad = async (event) => {
    // Load all leagues so the user can select which league to create the competition in
    try {
        const leagues = await getAllLeagues();
        const categoryTypes = Object.values(CategoryType);
        return {
            props: {
                leagues,
                categoryTypes
            }
        };

    } catch (error) {
        console.error('Error loading leagues:', error);
        return {
            props: {
                leagues: [],
            }
        };
    }
}

const create_competition: Action = async ({ locals, request, url }) => {
    const user = locals.user;
    if (!user) {
        return fail(401, { error_message: "User not authenticated" });
    }

    const formData = await request.formData();
    console.log('(auth)/(organizer)/create_competition/+page.server.ts formData:', formData);

    // Extract form data
    const competitionJson = formData.get('new_competition')?.toString();
    let competition: Prisma.CompetitionCreateInput | undefined = undefined;
    if (competitionJson) {
        try {
            competition = JSON.parse(competitionJson) as Prisma.CompetitionCreateInput
        } catch (error) {
            return fail(400, { error_message: "Invalid competition data format." });
        }
    }

    const categoriesJson = formData.get('new_categories')?.toString();
    let categories: Prisma.CategoryCreateInput[] = [];
    if (categoriesJson) {
        try {
            categories = JSON.parse(categoriesJson) as Prisma.CategoryCreateInput[];
        } catch (error) {
            return fail(400, { error_message: "Invalid categories data format." });
        }
    }

    // Validate required fields
    if (competition && (!competition.name || !competition.startDate)) {
        return fail(400, {error_message: "Competition name or start date are missing"});
    }

    console.log('(auth)/(organizer)/create_competition/+page.server.ts competition:', competition);
    console.log('(auth)/(organizer)/create_competition/+page.server.ts categories:', categories);

    // Validate that we have both competition and categories data
    if (!competition || !categories || !Array.isArray(categories)) {
        return fail(400, { error_message: "Missing competition or categories data" });
    }

    try {
        // Create competition with categories
        const result = await createCompetition(competition, categories);
        if (!result.success) {
            return fail(400, {
                success: false,
                message: "An error occurred while creating the competition."
            });
        }
        // Return success with competition details
        return {
            success: true,
            message: "Competition created successfully!",
            competitionId: result.data?.competition.id
        };
    } catch (error) {
        console.error('Error creating competition:', error);
        return fail(500, {
            success: false,
            message: "An error occurred while creating the competition."
        });
    }
}

export const actions: Actions = { create_competition }
