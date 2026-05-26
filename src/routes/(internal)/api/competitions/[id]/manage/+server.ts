import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';

export const GET = async (event: RequestEvent) => {
  try {
    const competitionId = parseInt(event.params.id as string);

    if (isNaN(competitionId)) {
      return json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        categories: {
          include: {
            entries: {
              include: {
                users: true
              }
            },
            judges: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    });

    if (!competition) {
      return json({ error: 'Competition not found' }, { status: 404 });
    }

    // Collect unique judges across all categories
    const judgeMap = new Map<string, { id: string; name: string; email: string; image: string | null }>();
    for (const category of competition.categories) {
      for (const judge of category.judges) {
        judgeMap.set(judge.id, judge);
      }
    }

    return json({
      competition,
      judges: Array.from(judgeMap.values())
    });
  } catch (error) {
    console.error('Error fetching competition data:', error);
    return json({ error: 'Failed to fetch competition data' }, { status: 500 });
  }
};
