import type { NotificationIntent } from './dispatcher';
import { NotificationType } from '$prisma/enums';

interface RejectedTagEntry {
	creatorId: string;
	competitionId: number;
	competitionName: string;
	categoryName: string;
}

/**
 * Intent for notifying the entry creator when an organizer rejects their tag
 * claim. This is the one tag outcome with a real consequence for the participant:
 * they lose the sub-prize eligibility and any price override reverts to the base
 * price, with the difference reconciled off-platform. Confirmation is not notified.
 */
export function notificationsForTagRejected(entry: RejectedTagEntry): NotificationIntent[] {
	return [
		{
			userIds: [entry.creatorId],
			type: NotificationType.TAG_REJECTED,
			title: 'notifications.titles.tag_rejected',
			message: 'notifications.messages.tag_rejected',
			link: `/competitions/competition_details/${entry.competitionId}`,
			data: {
				competitionName: entry.competitionName,
				categoryName: entry.categoryName,
			},
		},
	];
}
