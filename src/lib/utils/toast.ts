import { toaster } from '$lib/stores/toaster';

export function showSuccessToast(title: string, description?: string) {
	toaster.success({ title, description: description ?? '' });
}

export function showErrorToast(title: string, description?: string) {
	toaster.error({ title, description: description ?? '' });
}
