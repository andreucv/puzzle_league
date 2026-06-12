// Lightweight Cloudinary delivery-URL builder, replacing svelte-cloudinary's CldImage
// (which pulled a ~550KB chunk into every page graph just to build these URLs).
// Reads the same env var svelte-cloudinary used, so deployment config is unchanged.
const CLOUD_NAME = import.meta.env.VITE_PUBLIC_CLOUDINARY_CLOUD_NAME as string;

export interface CldUrlOptions {
	width?: number;
	height?: number;
	/** Cloudinary crop mode. `fill` crops to exact dimensions, `limit` only downscales. */
	crop?: 'fill' | 'limit' | 'fit' | 'thumb';
	/** Only valid with cropping modes (`fill`/`thumb`); ignored by Cloudinary otherwise. */
	gravity?: 'auto' | 'face' | 'center';
}

export function cldUrl(publicId: string, options: CldUrlOptions = {}): string {
	const { width, height, crop = 'limit', gravity } = options;
	const parts: string[] = [];
	if (width || height) {
		parts.push(`c_${crop}`);
		if (gravity) parts.push(`g_${gravity}`);
		if (width) parts.push(`w_${width}`);
		if (height) parts.push(`h_${height}`);
	}
	parts.push('f_auto', 'q_auto');
	return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${parts.join(',')}/${publicId}`;
}
