import { fail } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from '../$types';
import { updateCompetition, getCompetitionWithCategories } from '$lib/database/database';
import { CategoryType } from '$lib/.prisma/generated/prisma/enums';
import { auth } from '$lib/auth';
import { z } from 'zod';

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

// Category schema based on UX spec validation requirements
const CategorySchema = z.object({
    description: z.string().max(60, "Category description must be at most 60 characters"),
    subname: z.string().max(60, "Category subname must be at most 60 characters").nullable().optional(),
    type: z.nativeEnum(CategoryType, { error: "Please select a category type" }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    maxParties: z.number().int().min(1, "Max parties must be at least 1").nullable().optional(),
    maxPartySize: z.number().int().min(1, "Party size must be at least 1").nullable().optional(),
    price: z.number().int().min(0, "Price must be 0 or greater"),
    status: z.string().optional(),
    puzzleIds: z.array(z.string()).optional(),
});

const CategoryUpdateSchema = z.object({
    where: z.object({ id: z.number() }),
    data: CategorySchema,
});

// Competition schema based on UX spec validation requirements
const CompetitionEditSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(3, "Competition name must be at least 3 characters").max(80, "Competition name must be at most 80 characters"),
    description: z.string().max(1000, "Description must be at most 1000 characters").nullable().optional(),
    location: z.string().max(120, "Location must be at most 120 characters").nullable().optional(),
    country: z.string().max(2, "Country code must be 2 characters").nullable().optional(),
    postalCode: z.string().max(20, "Postal code must be at most 20 characters").nullable().optional(),
    paymentMethod: z.string().max(500, "Payment method must be at most 500 characters").nullable().optional(),
    image_cld_id: z.string().nullable().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.string(),
    registrationOpen: z.boolean().optional(),
    categories: z.object({
        create: z.array(CategorySchema).optional(),
        update: z.array(CategoryUpdateSchema).optional(),
        delete: z.array(z.object({ id: z.number() })).optional(),
    }).optional(),
    creator: z.object({
        connect: z.object({
            id: z.string()
        })
    }).optional()
});

type CompetitionEditData = z.infer<typeof CompetitionEditSchema>;

// Vercel serverless function config — allow enough time for image uploads
export const config = {
    maxDuration: 60
};

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 25_000; // 25 seconds

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
        let competitionData = null;
        if (competitionId) {
            competition = await getCompetitionWithCategories(competitionId);

            if (!competition || isNaN(competitionId) || competitionId === undefined) {
                throw new Error(`Invalid competition id or competition ${competitionId} not found`);
            }

            if (competition.status !=  'NOT_STARTED') {
                throw new Error(`Competition ${competitionId} cannot be edited if it is not in NOT_STARTED status`);
            }

            // Check if the user is the creator of the competition
            if (competition.creatorId !== session.user.id) {
                console.error("competition/edit/+page.server.ts creatorId:", competition.creatorId, "!= session.user.id:", session.user.id);
                throw new Error('Not authorized to edit this competition');
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

    const competitionId = parseInt(params.id ?? '0');
    const form = await superValidate(request, zod4(CompetitionEditSchema as any));
    const formData = form.data as CompetitionEditData;

    if (!form.valid) {
        console.error('competition/edit/+page.server.ts: on action form not valid', JSON.stringify(form.errors, null, 2));
        return message(form, {success: false, message: "Form is not valid"});
    }

    // let's push now the image to the cloudinary server and then store the id in the database
    if (formData.image_cld_id) {
        const imageCldId = formData.image_cld_id as string;
        // Check if it's already a Cloudinary public ID (existing image) - skip upload
        const isExistingCloudinaryImage = imageCldId.startsWith('competitions/') ||
                                          !imageCldId.startsWith('data:');

        if (isExistingCloudinaryImage) {
            // Image already exists in Cloudinary, no upload needed
            console.log('Image already exists in Cloudinary, skipping upload:', imageCldId);
        } else {
            try {
                // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
                const base64Data = imageCldId.split(',')[1];
                if (!base64Data) {
                    throw new Error('Invalid image data format');
                }

            const buffer = Buffer.from(base64Data, 'base64');

            const upload_image_promise = new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        folder: 'competitions'
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

            const timeout_promise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Image upload timed out. Please try with a smaller image or try again later.')), CLOUDINARY_UPLOAD_TIMEOUT_MS);
            });

            const upload_image_promise_result = await Promise.race([upload_image_promise, timeout_promise]) as { public_id: string };
            console.log('upload_image_promise_result', upload_image_promise_result);
            formData.image_cld_id = upload_image_promise_result.public_id;
        } catch (error) {
            console.error('Error uploading image to Cloudinary:', error);
            const errorMessage = error instanceof Error && error.message.includes('timed out')
                ? error.message
                : "Failed to upload image. Please try with a smaller image or try again later.";
            return message(form, {success: false, message: errorMessage});
        }
        }
    } else {
        // If no image provided, set to null or remove the field
        formData.image_cld_id = null;
    }

    // Remove id from form data as Prisma doesn't allow it in update data
    const { id, ...competitionData } = formData;

    // Transform puzzleIds into Prisma connect operations for each category
    if (competitionData.categories) {
        if (competitionData.categories.create) {
            competitionData.categories.create = competitionData.categories.create.map((cat: any) => {
                const { puzzleIds, ...catData } = cat;
                if (puzzleIds && puzzleIds.length > 0) {
                    catData.puzzles = { connect: puzzleIds.map((pid: string) => ({ id: pid })) };
                }
                return catData;
            });
        }
        if (competitionData.categories.update) {
            competitionData.categories.update = competitionData.categories.update.map((item: any) => {
                const { puzzleIds, ...catData } = item.data;
                const updateData: any = { where: item.where, data: catData };
                if (puzzleIds) {
                    updateData.data.puzzles = {
                        set: puzzleIds.map((pid: string) => ({ id: pid }))
                    };
                }
                return updateData;
            });
        }
    }

    // Auto-compute competition startDate/endDate from category datetimes
    // This ensures competition dates always encompass all category times
    const allCategoryStartTimes: Date[] = [];
    const allCategoryEndTimes: Date[] = [];

    if (competitionData.categories?.create) {
        for (const cat of competitionData.categories.create) {
            if (cat.startTime) allCategoryStartTimes.push(new Date(cat.startTime));
            if (cat.endTime) allCategoryEndTimes.push(new Date(cat.endTime));
        }
    }
    if (competitionData.categories?.update) {
        for (const item of competitionData.categories.update) {
            const catData = (item as any).data;
            if (catData.startTime) allCategoryStartTimes.push(new Date(catData.startTime));
            if (catData.endTime) allCategoryEndTimes.push(new Date(catData.endTime));
        }
    }

    if (allCategoryStartTimes.length > 0) {
        const earliest = new Date(Math.min(...allCategoryStartTimes.map(d => d.getTime())));
        const latest = new Date(Math.max(...allCategoryEndTimes.map(d => d.getTime())));

        // Only override if the client-sent dates don't encompass all categories
        const currentStart = new Date(competitionData.startDate);
        const currentEnd = new Date(competitionData.endDate);
        if (earliest < currentStart) {
            competitionData.startDate = earliest.toISOString();
        }
        if (latest > currentEnd) {
            competitionData.endDate = latest.toISOString();
        }
    }

    const result = await updateCompetition(competitionId, competitionData);
    console.log('competition/edit/+page.server.ts: on action result', result);

    if (!result.success) {
        return message(form, {success: false, message: "Something went wrong"});
    }

    return message(form, {success: result.success, message: "Competition updated successfully", id: result.data?.competition.id});
}

export const actions: Actions = { create_update_competition }
