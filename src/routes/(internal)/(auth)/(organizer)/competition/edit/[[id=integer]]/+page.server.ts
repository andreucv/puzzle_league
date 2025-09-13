import { fail } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { updateCompetition, getCompetitionWithCategories, getAllLeagues } from '$lib/database';
import { type Competition, type Category, type Prisma, CategoryType } from '@prisma/client';
import { auth } from '$lib/auth';

import { CompetitionUpdateInputSchema } from '../../../../../../../../prisma/generated/zod';

import { superValidate, message} from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: false
});

export const load: PageServerLoad = async (event) => {

    let competitionId = null;
    if (event.params.id) {
        competitionId = parseInt(event.params.id);
    }

    try {
        // Get the current session
        const session = await auth.api.getSession(event.request);
        if (!session?.user) {
            throw new Error('User not authenticated');
        }

        let competition = null;
        if (competitionId) {
            competition = await getCompetitionWithCategories(competitionId);

            if (!competition || isNaN(competitionId) || competitionId === undefined) {
                throw new Error(`Invalid competition id or competition ${competitionId} not found`);
            }

            if (competition.status !=  'UPCOMING') {
                throw new Error(`Competition ${competitionId} cannot be edited if it is not in upcoming status`);
            }

            // Check if the user is the creator of the competition
            if (competition.creatorId !== session.user.id) {
                console.error("competition/edit/+page.server.ts creatorId:", competition.creatorId, "!= session.user.id:", session.user.id);
                throw new Error('Not authorized to edit this competition');
            }
        }

        const categoryTypes = Object.values(CategoryType);
        const form = await superValidate(competition, zod4(CompetitionUpdateInputSchema));
        console.log('competition/edit: onload form:', form);
        console.log('competition/edit: onload form categories:', form.data.categories);

        return {
            form,
            props: {
                categoryTypes
            }
        };

    } catch (error) {
        console.error('Error loading competition for edit:', error);
        return fail(404, { error_message: error instanceof Error ? error.message : "Competition not found" });
    }
}

const create_update_competition: Action = async ({ request, params }) => {
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
    const form = await superValidate(request, zod4(CompetitionUpdateInputSchema));
    console.log('competition/edit/+page.server.ts: on action form', form);
    console.log('competition/edit/+page.server.ts: on action form categories', form.data.categories);

    if (!form.valid) {
        console.error('competition/edit/+page.server.ts: on action form not valid', JSON.stringify(form.errors, null, 2));
        return message(form, {success: false, message: "Form is not valid"});
    }

    // let's push now the image to the cloudinary server and then store the id in the database
    if (form.data.image_cld_id) {
        try {
            // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
            const base64Data = form.data.image_cld_id.split(',')[1];
            if (!base64Data) {
                throw new Error('Invalid image data format');
            }

            const buffer = Buffer.from(base64Data, 'base64');

            const upload_image_promise = new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        folder: 'competitions' // Optional: organize images in folders
                    },
                    function (error, result) {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                            return;
                        }
                        console.log('Cloudinary upload result:', result);
                        resolve(result);
                    }
                ).end(buffer);
            });

            const upload_image_promise_result = await upload_image_promise;
            console.log('upload_image_promise_result', upload_image_promise_result);
            form.data.image_cld_id = upload_image_promise_result.public_id;
        } catch (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return message(form, {success: false, message: "Failed to upload image"});
        }
    } else {
        // If no image provided, set to null or remove the field
        form.data.image_cld_id = null;
    }

    const result = await updateCompetition(competitionId, form.data);
    console.log('competition/edit/+page.server.ts: on action result', result);

    if (!result.success) {
        return message(form, {success: false, message: "Something went wrong"});
    }

    return message(form, {success: result.success, message: "Competition updated successfully", id: result.data?.competition.id});
}

export const actions: Actions = { create_update_competition }
