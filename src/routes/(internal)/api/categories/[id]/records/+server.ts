import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database';
import { requireCategoryJudge } from '$lib/utils/api_auth';

export const GET = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);
    const limit = parseInt(event.url.searchParams.get('limit') ?? '0');

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Authorization check
    const auth = await requireCategoryJudge(event, categoryId);
    if (!auth.authorized) return auth.response;

    // Fetch all records ordered by finishTime or tableNumber
    const records = await prisma.record.findMany({
      where: { categoryId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { finishTime: 'asc' },
        { tableNumber: 'asc' }
      ]
    });

    return json({
      records: records
    });
  } catch (error) {
    console.error('Error fetching category entries:', error);
    return json({ error: 'Failed to fetch category entries' }, { status: 500 });
  }
};
