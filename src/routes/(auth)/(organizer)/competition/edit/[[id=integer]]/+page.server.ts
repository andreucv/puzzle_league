import { fail } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { updateCompetition, getCompetitionWithCategories, getAllLeagues } from '$lib/database';
import { type Competition, type Category, type Prisma, CategoryType } from '@prisma/client';
import { auth } from '$lib/auth';

import { CompetitionCreateInputSchema } from '../../../../../../../prisma/generated/zod';

import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async (event) => {
    const competitionId = parseInt(event.params.id);

    try {
        // Get the current session
        const session = await auth.api.getSession(event.request);
        if (!session?.user) {
            throw new Error('User not authenticated');
        }

        let competition: Competition;
        if (competitionId === undefined || isNaN(competitionId)) {
            // we are creating a new competition
            competition = {} as Competition;
        } else {
            // Load the competition with categories
            competition = await getCompetitionWithCategories(competitionId);
            if (!competition) {
                throw new Error('Competition not found');
            }

            // Check if the user is the creator of the competition
            if (competition.creatorId !== session.user.id) {
                throw new Error('Not authorized to edit this competition');
            }
        }

        const categoryTypes = Object.values(CategoryType);
        const form = await superValidate(competition, zod4(CompetitionCreateInputSchema));
        console.log('form:', form);
        return {
            form,
            props: {
                competition,
                categoryTypes
            }
        };

    } catch (error) {
        console.error('Error loading competition for edit:', error);
        return fail(404, { error_message: error instanceof Error ? error.message : "Competition not found" });
    }
}

const update_competition: Action = async ({ locals, request, url, params }) => {
    let user = null;
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        user = session?.user;
    } catch (error) {
        console.error('Error getting user session:', error);
        return fail(401, { error_message: "User not authenticated" });
    }

    const competitionId = parseInt(params.id);
    const formData = await request.formData();

    // Extract form data
    const competitionJson = formData.get('updated_competition')?.toString();
    let competition: Prisma.CompetitionUpdateInput | undefined = undefined;
    if (competitionJson) {
        try {
            competition = JSON.parse(competitionJson) as Prisma.CompetitionUpdateInput;
        } catch (error) {
            return fail(400, { error_message: "Invalid competition data format." });
        }
    }

    const categoriesJson = formData.get('updated_categories')?.toString();
    let categories: Prisma.CategoryUncheckedCreateInput[] = [];
    if (categoriesJson) {
        try {
            categories = JSON.parse(categoriesJson) as Prisma.CategoryUncheckedCreateInput[];
        } catch (error) {
            return fail(400, { error_message: "Invalid categories data format." });
        }
    }

    // Validate required fields
    if (competition && (!competition.name || !competition.startDate)) {
        return fail(400, {error_message: "Competition name or start date are missing"});
    }

    // Validate that we have both competition and categories data
    if (!competition || !categories || !Array.isArray(categories)) {
        return fail(400, { error_message: "Missing competition or categories data" });
    }

    try {
        // Update competition with categories
        const result = await updateCompetition(competitionId, competition, categories);
        if (!result.success) {
            return fail(400, {
                success: false,
                message: "An error occurred while updating the competition."
            });
        }

        // Return success with competition details
        return {
            success: true,
            message: "Competition updated successfully!",
            competitionId: result.data?.competition.id,
        };
    } catch (error) {
        console.error('Error updating competition:', error);
        return fail(500, {
            success: false,
            message: "An error occurred while updating the competition."
        });
    }
}

export const actions: Actions = { update_competition }
