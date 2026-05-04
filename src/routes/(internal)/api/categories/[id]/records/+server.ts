import { json, type RequestEvent } from '@sveltejs/kit';
import { getCategoryRecords } from '$lib/database/db_category_entries';

export const GET = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);
    const search = event.url.searchParams.get('search')?.trim() ?? '';
    const finishedFilter = event.url.searchParams.get('finished') as 'true' | 'false' | undefined;

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const records = await getCategoryRecords(categoryId, {
      search: search || undefined,
      finished: finishedFilter ?? undefined
    });

    return json({ records });
  } catch (error) {
    console.error('Error fetching category entries:', error);
    return json({ error: 'Failed to fetch category entries' }, { status: 500 });
  }
};
