import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const competitionId = parseInt(params.id as string);
    const { userIds } = await request.json();

    if (isNaN(competitionId)) {
      return json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Verify competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId }
    });

    if (!competition) {
      return json({ error: 'Competition not found' }, { status: 404 });
    }

    // Check which users already have judge roles for this competition
    const existingJudges = await prisma.roleAssignment.findMany({
      where: {
        competitionId,
        role: 'JUDGE',
        userId: { in: userIds }
      }
    });

    const existingJudgeUserIds = existingJudges.map(ra => ra.userId);
    const newJudgeUserIds = userIds.filter((userId: string) => !existingJudgeUserIds.includes(userId));

    if (newJudgeUserIds.length === 0) {
      return json({ error: 'All selected users are already judges for this competition' }, { status: 400 });
    }

    // Create role assignments for new judges
    const newRoleAssignments = await prisma.roleAssignment.createMany({
      data: newJudgeUserIds.map((userId: string) => ({
        userId,
        role: 'JUDGE',
        competitionId
      })),
      skipDuplicates: true
    });

    // Fetch the newly added judges with user information
    const addedJudges = await prisma.roleAssignment.findMany({
      where: {
        competitionId,
        role: 'JUDGE',
        userId: { in: newJudgeUserIds }
      },
      include: {
        user: true
      }
    });

    return json({
      success: true,
      judges: addedJudges.map(ra => ra.user),
      message: `Successfully added ${newJudgeUserIds.length} judge${newJudgeUserIds.length !== 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('Error adding judges:', error);
    return json({ error: 'Failed to add judges' }, { status: 500 });
  }
};
