import { toaster } from '$lib/stores/toaster';

export interface RegistrationSummary {
	totalEntries: number;
	perCategory: { name: string; type: string; count: number }[];
}

export function showSuccessToast(title: string, description?: string) {
	toaster.success({ title, description: description ?? '' });
}

export function showErrorToast(title: string, description?: string) {
	toaster.error({ title, description: description ?? '' });
}

/**
 * Show a success toast with rich HTML content in the description area.
 */
export function showRichSuccessToast(title: string, descriptionHtml: string, duration = 5000) {
	toaster.success({
		title,
		description: '',
		duration,
		meta: { descriptionHtml }
	});
}
