import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPuzzleById, createPuzzle, updatePuzzle, deletePuzzle } from '$lib/database/database';
import { auth } from '$lib/auth';
import { z } from 'zod';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: false
});

const PuzzleEditSchema = z.object({
    id: z.string().optional(),
    name: z.string().max(120, 'Name must be at most 120 characters').nullable().optional(),
    pieces: z.number().int().min(1, 'Pieces must be at least 1'),
    brand: z.string().min(1, 'Brand is required').max(120, 'Brand must be at most 120 characters'),
    serialNumber: z.string().max(120, 'Serial number must be at most 120 characters').nullable().optional(),
    barcode: z.string().min(1, 'Barcode is required').max(120, 'Barcode must be at most 120 characters'),
    image_cld_id: z.string().nullable().optional(),
});

type PuzzleEditData = z.infer<typeof PuzzleEditSchema>;

export const load: PageServerLoad = async (event) => {
    const session = await auth.api.getSession(event.request);
    if (!session?.user) {
        throw fail(401, { error_message: 'User not authenticated' });
    }

    let puzzleData = null;
    if (event.params.id) {
        const puzzle = await getPuzzleById(event.params.id);
        if (!puzzle) {
            throw fail(404, { error_message: 'Puzzle not found' });
        }
        puzzleData = puzzle;
    }

    const form = await superValidate(puzzleData, zod4(PuzzleEditSchema as any));

    return { form };
};

export const actions: Actions = {
    save_puzzle: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return fail(401, { error_message: 'User not authenticated' });
        }

        const form = await superValidate(request, zod4(PuzzleEditSchema as any));
        const formData = form.data as PuzzleEditData;

        if (!form.valid) {
            return message(form, { success: false, message: 'Form is not valid' });
        }

        // Handle Cloudinary image upload
        if (formData.image_cld_id) {
            const imageCldId = formData.image_cld_id;
            const isExisting = imageCldId.startsWith('puzzles/') || !imageCldId.startsWith('data:');

            if (!isExisting) {
                try {
                    const base64Data = imageCldId.split(',')[1];
                    if (!base64Data) throw new Error('Invalid image data format');

                    const buffer = Buffer.from(base64Data, 'base64');
                    const result = await new Promise<{ public_id: string }>((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            { resource_type: 'image', folder: 'puzzles' },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result as { public_id: string });
                            }
                        ).end(buffer);
                    });
                    formData.image_cld_id = result.public_id;
                } catch (error) {
                    console.error('Error uploading puzzle image:', error);
                    return message(form, { success: false, message: 'Failed to upload image' });
                }
            }
        } else {
            formData.image_cld_id = null;
        }

        const { id, ...data } = formData;
        const puzzleId = params.id;

        if (puzzleId) {
            const result = await updatePuzzle(puzzleId, data);
            if (!result.success) {
                return message(form, { success: false, message: result.message });
            }
            return message(form, { success: true, message: 'Puzzle updated successfully', id: puzzleId });
        } else {
            const result = await createPuzzle(data as any);
            if (!result.success) {
                return message(form, { success: false, message: result.message });
            }
            return message(form, { success: true, message: 'Puzzle created successfully', id: result.data?.id });
        }
    },

    delete_puzzle: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return fail(401, { error_message: 'User not authenticated' });
        }

        const puzzleId = params.id;
        if (!puzzleId) {
            return fail(400, { error_message: 'Puzzle ID required' });
        }

        const result = await deletePuzzle(puzzleId);
        if (!result.success) {
            return fail(500, { error_message: result.message });
        }

        return { success: true, deleted: true };
    }
};
