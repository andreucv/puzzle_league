import { json, type RequestEvent } from '@sveltejs/kit';
import { getBatchedCategoryEntries } from '$lib/database/db_category_entries';
import { prisma } from '$lib/database/create_prisma_client';

/**
 * Batched competition entries endpoint.
 * Returns confirmed entries for all categories in a competition in a single request,
 * keyed by categoryId. Replaces N individual /api/categories/[id]/entries calls.
 */
export const GET = async (event: RequestEvent) => {
  try {
    const competitionId = parseInt(event.params.id as string);

    if (isNaN(competitionId)) {
      return json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    // Get all category IDs for this competition
    const categories = await prisma.category.findMany({
      where: { competitionId },
      select: { id: true }
    });

    const categoryIds = categories.map(c => c.id);
    const entriesMap = await getBatchedCategoryEntries(categoryIds);

    // Convert Map to plain object for JSON serialization
    const result: Record<number, any[]> = {};
    for (const [categoryId, entries] of entriesMap) {
      result[categoryId] = entries;
    }

    return json({ entries: result });
  } catch (error) {
    console.error('Error fetching competition entries:', error);
    return json({ error: 'Failed to fetch competition entries' }, { status: 500 });
  }
};
