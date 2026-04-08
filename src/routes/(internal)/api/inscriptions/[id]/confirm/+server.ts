import { json, type RequestEvent } from '@sveltejs/kit';
import { confirmInscription } from '$lib/database/db_inscription_utils';
import { prisma } from '$lib/database/create_prisma_client';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { createNotification, createNotificationForUsers } from '$lib/notifications/notifications';
import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const record = await prisma.record.findUnique({
			where: { id: recordId },
			include: {
				category: {
					select: {
						competitionId: true,
						description: true,
						type: true,
						competition: { select: { name: true } }
					}
				},
				users: { select: { id: true, name: true } },
				userIntents: { select: { name: true } }
			}
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const result = await confirmInscription(recordId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		const categoryTypeNames: Record<CategoryType, string> = {
			INDIVIDUAL: 'Individual', PAIRS: 'Pairs', TEAM: 'Team',
			JUNIOR_INDIVIDUAL: 'Junior Individual', JUNIOR_PAIRS: 'Junior Pairs',
			PUZZLE_CHESS: 'Puzzle Chess', OTHER: 'Other'
		};
		const categoryTypeName = categoryTypeNames[record.category.type] || record.category.type;
		const competitionName = record.category.competition.name;
		const link = `/competitions/competition_details/${record.category.competitionId}`;

		// Notify all participants on this record
		const userIds = record.users.map((u) => u.id);
		await createNotificationForUsers(
			userIds,
			NotificationType.INSCRIPTION_CONFIRMED,
			'notifications.titles.inscription_confirmed',
			'notifications.messages.inscription_confirmed',
			link,
			{ categoryName: categoryTypeName, competitionName },
		);

		// If non-platform users were inscribed, also notify the creator (if not already a participant)
		const hasNonPlatformUsers = record.userIntents.length > 0;
		const creatorIsParticipant = userIds.includes(record.creatorId);
		if (hasNonPlatformUsers && !creatorIsParticipant) {
			const nonPlatformNames = record.userIntents.map((ui) => ui.name).join(', ');
			await createNotification({
				userId: record.creatorId,
				type: NotificationType.INSCRIPTION_CONFIRMED,
				title: 'notifications.titles.inscription_confirmed_nonplatform',
				message: 'notifications.messages.inscription_confirmed_nonplatform',
				link,
				data: { nonPlatformNames, categoryName: categoryTypeName, competitionName },
			});
		}

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error confirming inscription:', error);
		return json({ error: 'Failed to confirm inscription' }, { status: 500 });
	}
};
