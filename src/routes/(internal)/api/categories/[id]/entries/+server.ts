import { json, type RequestEvent } from '@sveltejs/kit';
import { getCategoryEntries } from '$lib/database/db_category_entries';

export const GET = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);
    const search = event.url.searchParams.get('search')?.trim() ?? '';
    const finishedFilter = event.url.searchParams.get('finished') as 'true' | 'false' | undefined;

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const entries = await getCategoryEntries(categoryId, {
      search: search || undefined,
      finished: finishedFilter ?? undefined
    });

    // Response uses "records" key for backward compatibility with existing clients
    return json({ records: entries });
  } catch (error) {
    console.error('Error fetching category entries:', error);
    return json({ error: 'Failed to fetch category entries' }, { status: 500 });
  }
};
