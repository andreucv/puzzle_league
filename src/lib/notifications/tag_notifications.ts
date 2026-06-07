import { createNotification } from './notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

interface RejectedTagEntry {
	creatorId: string;
	competitionId: number;
	competitionName: string;
	categoryName: string;
}

/**
 * Notify the entry creator when an organizer rejects their tag claim. This is
 * the one tag outcome with a real consequence for the participant: they lose
 * the sub-prize eligibility and any price override reverts to the base price,
 * with the difference reconciled off-platform. Confirmation is not notified.
 */
export async function notifyTagRejected(entry: RejectedTagEntry): Promise<void> {
	await createNotification({
		userId: entry.creatorId,
		type: NotificationType.TAG_REJECTED,
		title: 'notifications.titles.tag_rejected',
		message: 'notifications.messages.tag_rejected',
		link: `/competitions/competition_details/${entry.competitionId}`,
		data: {
			competitionName: entry.competitionName,
			categoryName: entry.categoryName,
		},
	});
}
