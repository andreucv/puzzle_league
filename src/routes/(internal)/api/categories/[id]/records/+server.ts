import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { requireCategoryJudge } from '$lib/utils/api_auth';
import type { Prisma } from '$lib/.prisma/generated/prisma/client';

export const GET = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);
    const search = event.url.searchParams.get('search')?.trim() ?? '';
    const finishedFilter = event.url.searchParams.get('finished');

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Authorization check
    const auth = await requireCategoryJudge(event, categoryId);
    if (!auth.authorized) return auth.response;

    // Build where clause with optional search filtering
    const where: Prisma.RecordWhereInput = { categoryId };

    // Filter by finished status if specified
    if (finishedFilter === 'true') {
      where.finishTime = { not: null };
    } else if (finishedFilter === 'false') {
      where.finishTime = null;
    }

    if (search) {
      const searchAsInt = parseInt(search);
      const isNumeric = !isNaN(searchAsInt);

      where.AND = [
        // Only show unfinished records when searching (unless finishedFilter is set)
        ...(finishedFilter == null ? [{ finishTime: null }] : []),
        {
          OR: [
            // Search by participant name (partial, case-insensitive)
            {
              users: {
                some: {
                  name: { contains: search, mode: 'insensitive' }
                }
              }
            },
            // Search by user intent name (partial, case-insensitive)
            {
              userIntents: {
                some: {
                  name: { contains: search, mode: 'insensitive' }
                }
              }
            },
            // Search by table number (exact match)
            ...(isNumeric ? [{ tableNumber: searchAsInt }] : []),
            // Search by record ID (exact match)
            { id: search }
          ]
        }
      ];
    }

    // Fetch records
    const records = await prisma.record.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        userIntents: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { finishTime: 'asc' },
        { tableNumber: 'asc' }
      ]
    });

    return json({
      records: records.map(r => ({
        ...r,
        nPiecesCompleted: r.nPiecesCompleted
      }))
    });
  } catch (error) {
    console.error('Error fetching category entries:', error);
    return json({ error: 'Failed to fetch category entries' }, { status: 500 });
  }
};
