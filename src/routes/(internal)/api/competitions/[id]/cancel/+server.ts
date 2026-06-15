import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';
import { dispatchNotifications } from '$lib/notifications/dispatcher';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
  try {
    const competitionId = parseInt(event.params.id as string);

    if (isNaN(competitionId)) {
      return json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    // Only allow cancelling competitions that are NOT_STARTED or STARTED
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { name: true, status: true }
    });

    if (!competition) {
      return json({ error: 'Competition not found' }, { status: 404 });
    }

    if (competition.status === CompetitionStatus.CANCELLED) {
      return json({ error: 'Competition is already cancelled' }, { status: 400 });
    }

    if (competition.status === CompetitionStatus.FINISHED) {
      return json({ error: 'Cannot cancel a finished competition' }, { status: 400 });
    }

    // Cancel the competition
    await prisma.competition.update({
      where: { id: competitionId },
      data: { status: CompetitionStatus.CANCELLED }
    });

    // Notify all registered participants
    const participantIds = await prisma.entry.findMany({
      where: {
        category: { competitionId },
      },
      select: {
        users: { select: { id: true } }
      }
    });

    const uniqueUserIds = [...new Set(participantIds.flatMap(r => r.users.map(u => u.id)))];

    if (uniqueUserIds.length > 0) {
      await dispatchNotifications([
        {
          userIds: uniqueUserIds,
          type: NotificationType.COMPETITION_CANCELLED,
          title: 'notifications.titles.competition_cancelled',
          message: 'notifications.messages.competition_cancelled',
          link: `/competitions/competition_details/${competitionId}`,
          data: { competitionName: competition.name },
        },
      ]);
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: event.locals.user?.id ?? 'server',
      event: 'competition_cancelled',
      properties: {
        competition_id: competitionId,
        competition_name: competition.name,
        notified_participants: uniqueUserIds.length
      }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error cancelling competition:', error);
    return json({ error: 'Failed to cancel competition' }, { status: 500 });
  }
};
