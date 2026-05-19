import { error, fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from '../$types';
import { updateCompetition, getCompetitionWithCategories } from '$lib/database/db_competition';
import { CategoryType, CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';

import { superValidate, message} from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import {
    CompetitionEditSchema,
    type CompetitionEditData,
    resolveImageUpload,
    transformPuzzleIds,
    autoComputeDateBounds,
} from '../services/competition-form';

// Vercel serverless function config — allow enough time for image uploads
export const config = {
    maxDuration: 60
};

export const load: PageServerLoad = async (event) => {

    let competitionId = null;
    if (event.params.id) {
        competitionId = parseInt(event.params.id);
    }

    try {
        const user = event.locals.user;
        if (!user) {
            throw error(401, { message: 'You need to be signed in to edit competitions.', code: 'AUTH_REQUIRED' });
        }

        let competition = null;
        let competitionData = null;
        if (competitionId) {
            competition = await getCompetitionWithCategories(competitionId);

            if (!competition || isNaN(competitionId) || competitionId === undefined) {
                throw error(404, { message: `Competition not found.`, code: 'NOT_FOUND' });
            }

            if (competition.status !== CompetitionStatus.NOT_STARTED) {
                const categoryTypes = Object.values(CategoryType);
                const form = await superValidate(null, zod4(CompetitionEditSchema as any));
                return {
                    form,
                    props: { categoryTypes },
                    notEditable: {
                        competitionId,
                        competitionName: competition.name,
                        status: competition.status
                    }
                };
            }

            // Check if the user is the creator of the competition
            if (competition.creatorId !== user.id) {
                console.error("competition/edit/+page.server.ts creatorId:", competition.creatorId, "!= user.id:", user.id);
                throw error(403, { message: 'You are not authorized to edit this competition.', code: 'FORBIDDEN' });
            }

            // Convert Date objects to ISO strings for the form
            competitionData = {
                ...competition,
                startDate: competition.startDate.toISOString(),
                endDate: competition.endDate.toISOString(),
                categories: competition.categories.map(cat => ({
                    ...cat,
                    startTime: cat.startTime.toISOString(),
                    endTime: cat.endTime.toISOString(),
                    puzzleIds: (cat as any).puzzles?.map((p: any) => p.id) || [],
                }))
            };
        }

        const categoryTypes = Object.values(CategoryType);
        const form = await superValidate(competitionData, zod4(CompetitionEditSchema as any));

        return {
            form,
            props: {
                categoryTypes
            }
        };

    } catch (err) {
        if (err && typeof err === 'object' && 'status' in err) throw err;
        console.error('Error loading competition for edit:', err);
        throw error(500, { message: 'Unable to load competition. Please try again later.', code: 'DB_ERROR' });
    }
}

const create_update_competition: Action = async ({ locals, request, params }) => {
    const user = locals.user;
    if (!user) {
        return fail(401, { error_message: "User not authenticated" });
    }

    const competitionId = parseInt(params.id ?? '0');
    const form = await superValidate(request, zod4(CompetitionEditSchema as any));
    const formData = form.data as CompetitionEditData;

    if (!form.valid) {
        console.error('competition/edit/+page.server.ts: on action form not valid', JSON.stringify(form.errors, null, 2));
        return message(form, {success: false, message: "Form is not valid"});
    }

    // Upload or resolve existing Cloudinary image
    const imageResult = await resolveImageUpload(formData.image_cld_id);
    if (imageResult.error) {
        return message(form, {success: false, message: imageResult.error});
    }
    formData.image_cld_id = imageResult.publicId;

    // Remove id from form data as Prisma doesn't allow it in update data
    const { id, ...competitionData } = formData;

    // Transform puzzleIds into Prisma connect operations for each category
    transformPuzzleIds(competitionData.categories);

    // Auto-compute competition startDate/endDate from category datetimes
    autoComputeDateBounds(competitionData);

    const result = await updateCompetition(competitionId, competitionData);
    console.log('competition/edit/+page.server.ts: on action result', result);

    if (!result.success) {
        return message(form, {success: false, message: "Something went wrong"});
    }

    return message(form, {success: result.success, message: "Competition updated successfully", id: result.data?.competition.id});
}

export const actions: Actions = { create_update_competition }
