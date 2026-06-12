import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private';

// Node cloudinary SDK — kept in a .server.ts module so it can never be pulled
// into a client bundle (it was previously in competition-form.ts next to
// schemas that client code could plausibly import).
cloudinary.config({
	cloud_name: CLOUDINARY_CLOUD_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET,
	secure: false
});

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
