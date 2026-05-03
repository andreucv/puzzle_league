import type { CategoryData } from '$lib/types/category';

export type CategoryAction = 'start' | 'stop' | 'cancel' | 'complete' | 'resume' | 'restart';

export type CategoryActionResult =
	| { ok: true; category: CategoryData }
	| { ok: false; error: string };

export async function executeCategoryAction(
	categoryId: number,
	action: CategoryAction,
	body?: Record<string, unknown>
): Promise<CategoryActionResult> {
	try {
		const res = await fetch(`/api/categories/${categoryId}/${action}`, {
			method: 'POST',
			headers: body ? { 'Content-Type': 'application/json' } : undefined,
			body: body ? JSON.stringify(body) : undefined,
		});
		const responseBody = await res.json();

		if (res.ok) {
			return { ok: true, category: responseBody.category };
		}

		return { ok: false, error: responseBody.error ?? `Failed to ${action} category` };
	} catch {
		return { ok: false, error: `Network error while trying to ${action} category` };
	}
}
