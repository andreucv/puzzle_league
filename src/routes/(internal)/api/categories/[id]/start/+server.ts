import { json, type RequestEvent } from '@sveltejs/kit';
import { startCategory } from '$lib/database/database';
import { requireCategoryJudge } from '$lib/utils/api_auth';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Authorization check
    const auth = await requireCategoryJudge(event, categoryId);
    if (!auth.authorized) return auth.response;

    const updatedCategory = await startCategory(categoryId);

    console.log(`api/categories/${categoryId}/start: `, updatedCategory);
    return json({ category: updatedCategory });
  } catch (error) {
    console.error('Error starting category:', error);
    return json({ error: 'Failed to start category' }, { status: 500 });
  }
};
