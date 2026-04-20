import type { CategoryData } from '$lib/types/category';

export type CategoryAction = 'start' | 'stop' | 'cancel' | 'complete' | 'resume' | 'restart';

export type CategoryActionResult =
	| { ok: true; category: CategoryData }
	| { ok: false; error: string };

export async function executeCategoryAction(
	categoryId: number,
	action: CategoryAction
): Promise<CategoryActionResult> {
	try {
		const res = await fetch(`/api/categories/${categoryId}/${action}`, { method: 'POST' });
		const body = await res.json();

		if (res.ok) {
			return { ok: true, category: body.category };
		}

		return { ok: false, error: body.error ?? `Failed to ${action} category` };
	} catch {
		return { ok: false, error: `Network error while trying to ${action} category` };
	}
}
