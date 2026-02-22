import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { Role } from '$lib/.prisma/generated/prisma/client';
import { requireCompetitionRole } from '$lib/utils/api_auth';

export const GET = async (event: RequestEvent) => {
  try {
    const competitionId = parseInt(event.params.id as string);

    if (isNaN(competitionId)) {
      return json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    // Authorization check
    const auth = await requireCompetitionRole(event, competitionId, [Role.ORGANIZER]);
    if (!auth.authorized) return auth.response;

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        categories: {
          include: {
            records: {
              include: {
                users: true
              }
            }
          }
        },
        roleAssignments: {
          where: {
            role: 'JUDGE'
          },
          include: {
            user: true
          }
        }
      }
    });

    if (!competition) {
      return json({ error: 'Competition not found' }, { status: 404 });
    }

    return json({
      competition,
      judges: competition.roleAssignments.map(ra => ra.user)
    });
  } catch (error) {
    console.error('Error fetching competition data:', error);
    return json({ error: 'Failed to fetch competition data' }, { status: 500 });
  }
};
