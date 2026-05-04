import { z } from 'zod';
import { CategoryType } from '$lib/.prisma/generated/prisma/enums';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private';

cloudinary.config({
	cloud_name: CLOUDINARY_CLOUD_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET,
	secure: false
});

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const CategorySchema = z.object({
	description: z.string().max(60, 'Category description must be at most 60 characters'),
	subname: z
		.string()
		.max(60, 'Category subname must be at most 60 characters')
		.nullable()
		.optional(),
	type: z.nativeEnum(CategoryType, { error: 'Please select a category type' }),
	startTime: z.string().min(1, 'Start time is required'),
	endTime: z.string().min(1, 'End time is required'),
	maxParties: z.number().int().min(1, 'Max parties must be at least 1').nullable().optional(),
	maxPartySize: z.number().int().min(1, 'Party size must be at least 1').nullable().optional(),
	price: z.number().int().min(0, 'Price must be 0 or greater'),
	status: z.string().optional(),
	puzzleIds: z.array(z.string()).optional()
});

const CategoryUpdateSchema = z.object({
	where: z.object({ id: z.number() }),
	data: CategorySchema
});

export const CompetitionEditSchema = z.object({
	id: z.number().optional(),
	name: z
		.string()
		.min(3, 'Competition name must be at least 3 characters')
		.max(80, 'Competition name must be at most 80 characters'),
	description: z
		.string()
		.max(1000, 'Description must be at most 1000 characters')
		.nullable()
		.optional(),
	location: z
		.string()
		.max(120, 'Location must be at most 120 characters')
		.nullable()
		.optional(),
	country: z.string().max(2, 'Country code must be 2 characters').nullable().optional(),
	postalCode: z
		.string()
		.max(20, 'Postal code must be at most 20 characters')
		.nullable()
		.optional(),
	paymentMethod: z
		.string()
		.max(500, 'Payment method must be at most 500 characters')
		.nullable()
		.optional(),
	image_cld_id: z.string().nullable().optional(),
	startDate: z.string().min(1, 'Start date is required'),
	endDate: z.string().min(1, 'End date is required'),
	status: z.string(),
	registrationOpen: z.boolean().optional(),
	showPaymentWarning: z.boolean().optional(),
	categories: z
		.object({
			create: z.array(CategorySchema).optional(),
			update: z.array(CategoryUpdateSchema).optional(),
			delete: z.array(z.object({ id: z.number() })).optional()
		})
		.optional(),
	creator: z
		.object({
			connect: z.object({
				id: z.string()
			})
		})
		.optional()
});

export type CompetitionEditData = z.infer<typeof CompetitionEditSchema>;

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 25_000;

/**
 * Uploads a base64 data-URL image to Cloudinary, or returns the existing
 * public ID if the image is already hosted. Returns null when no image.
 */
export async function resolveImageUpload(
	imageCldId: string | null | undefined
): Promise<{ publicId: string | null; error?: string }> {
	if (!imageCldId) {
		return { publicId: null };
	}

	// Already a Cloudinary public ID — skip upload
	const isExisting = imageCldId.startsWith('competitions/') || !imageCldId.startsWith('data:');
	if (isExisting) {
		return { publicId: imageCldId };
	}

	const base64Data = imageCldId.split(',')[1];
	if (!base64Data) {
		return { publicId: null, error: 'Invalid image data format' };
	}

	try {
		const buffer = Buffer.from(base64Data, 'base64');

		const uploadPromise = new Promise<{ public_id: string }>((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{ resource_type: 'image', folder: 'competitions' },
					(error, result) => {
						if (error) {
							reject(error);
							return;
						}
						resolve(result as { public_id: string });
					}
				)
				.end(buffer);
		});

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(
				() =>
					reject(
						new Error(
							'Image upload timed out. Please try with a smaller image or try again later.'
						)
					),
				CLOUDINARY_UPLOAD_TIMEOUT_MS
			);
		});

		const result = await Promise.race([uploadPromise, timeoutPromise]);
		return { publicId: result.public_id };
	} catch (err) {
		const errorMessage =
			err instanceof Error && err.message.includes('timed out')
				? err.message
				: 'Failed to upload image. Please try with a smaller image or try again later.';
		return { publicId: null, error: errorMessage };
	}
}

// ---------------------------------------------------------------------------
// Data transforms
// ---------------------------------------------------------------------------

/** Transform puzzleIds arrays into Prisma connect/set operations. */
export function transformPuzzleIds(categories: CompetitionEditData['categories']) {
	if (!categories) return;

	if (categories.create) {
		categories.create = categories.create.map((cat: any) => {
			const { puzzleIds, ...catData } = cat;
			if (puzzleIds && puzzleIds.length > 0) {
				catData.puzzles = { connect: puzzleIds.map((pid: string) => ({ id: pid })) };
			}
			return catData;
		});
	}
	if (categories.update) {
		categories.update = categories.update.map((item: any) => {
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

/**
 * Ensures the competition startDate/endDate envelope encompasses all category times.
 * Mutates `competitionData` in place.
 */
export function autoComputeDateBounds(competitionData: {
	startDate: string;
	endDate: string;
	categories?: CompetitionEditData['categories'];
}) {
	const allStarts: Date[] = [];
	const allEnds: Date[] = [];

	if (competitionData.categories?.create) {
		for (const cat of competitionData.categories.create) {
			if (cat.startTime) allStarts.push(new Date(cat.startTime));
			if (cat.endTime) allEnds.push(new Date(cat.endTime));
		}
	}
	if (competitionData.categories?.update) {
		for (const item of competitionData.categories.update) {
			const catData = (item as any).data;
			if (catData.startTime) allStarts.push(new Date(catData.startTime));
			if (catData.endTime) allEnds.push(new Date(catData.endTime));
		}
	}

	if (allStarts.length === 0) return;

	const earliest = new Date(Math.min(...allStarts.map((d) => d.getTime())));
	const latest = new Date(Math.max(...allEnds.map((d) => d.getTime())));

	const currentStart = new Date(competitionData.startDate);
	const currentEnd = new Date(competitionData.endDate);

	if (earliest < currentStart) {
		competitionData.startDate = earliest.toISOString();
	}
	if (latest > currentEnd) {
		competitionData.endDate = latest.toISOString();
	}
}
