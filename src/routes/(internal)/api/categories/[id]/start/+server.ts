import { json, type RequestEvent } from '@sveltejs/kit';
import { startCategory } from '$lib/database/database';
import { prisma } from '$lib/database/create_prisma_client';
import { createNotificationForUsers } from '$lib/notifications/notifications';
import { CompetitionStatus, NotificationType } from '$lib/.prisma/generated/prisma/enums';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const updatedCategory = await startCategory(categoryId);

    // If this is the first category to start, mark the competition as STARTED
    const { count: competitionStarted } = await prisma.competition.updateMany({
      where: {
        id: updatedCategory.competitionId,
        status: CompetitionStatus.NOT_STARTED
      },
      data: { status: CompetitionStatus.STARTED }
    });

    // Notify participants when competition transitions to STARTED
    if (competitionStarted > 0) {
      const competition = await prisma.competition.findUnique({
        where: { id: updatedCategory.competitionId },
        select: { name: true }
      });

      const participantIds = await prisma.record.findMany({
        where: { category: { competitionId: updatedCategory.competitionId } },
        select: { users: { select: { id: true } } }
      });

      const uniqueUserIds = [...new Set(participantIds.flatMap(r => r.users.map(u => u.id)))];

      if (uniqueUserIds.length > 0 && competition) {
        await createNotificationForUsers(
          uniqueUserIds,
          NotificationType.COMPETITION_STARTED,
          'Competition started',
          `The competition "${competition.name}" has started!`,
          `/competitions/competition_details/${updatedCategory.competitionId}`,
        );
      }
    }

    console.log(`api/categories/${categoryId}/start: `, updatedCategory);
    return json({ category: updatedCategory });
  } catch (error) {
    console.error('Error starting category:', error);
    return json({ error: 'Failed to start category' }, { status: 500 });
  }
};
