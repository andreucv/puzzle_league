import { json, type RequestEvent } from '@sveltejs/kit';
import { acceptInscription } from '$lib/database/db_inscription_utils';
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

		const result = await acceptInscription(recordId);

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
			NotificationType.INSCRIPTION_ACCEPTED,
			'Inscription accepted',
			`Your inscription for the '${categoryTypeName}' category in the '${competitionName}' competition has been accepted.`,
			link
		);

		// If non-platform users were inscribed, also notify the creator (if not already a participant)
		const hasNonPlatformUsers = record.userIntents.length > 0;
		const creatorIsParticipant = userIds.includes(record.creatorId);
		if (hasNonPlatformUsers && !creatorIsParticipant) {
			const nonPlatformNames = record.userIntents.map((ui) => ui.name).join(', ');
			await createNotification({
				userId: record.creatorId,
				type: NotificationType.INSCRIPTION_ACCEPTED,
				title: 'Inscription accepted',
				message: `The inscription for '${nonPlatformNames}' in the '${categoryTypeName}' category of the '${competitionName}' competition has been accepted.`,
				link
			});
		}

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error accepting inscription:', error);
		return json({ error: 'Failed to accept inscription' }, { status: 500 });
	}
};
