import { createNotification, createNotificationForUsers } from './notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
import { getCategoryTypeName } from '$lib/utils/category_utils';

interface InscriptionRecord {
	creatorId: string;
	users: { id: string; name: string }[];
	userIntents: { name: string }[];
	category: {
		competitionId: number;
		description: string;
		subname: string | null;
		type: CategoryType;
		competition: { name: string };
	};
}

/**
 * Send inscription-confirmed notifications based on the record composition:
 *
 * 1. Creator IS a participant (and sole user) → one notification to that user.
 * 2. Creator is NOT a participant:
 *    2.1 Record has real platform users → notify each real user + notify creator.
 *    2.2 Record has only user-intents → notify creator (mentioning non-platform names).
 *
 * Each notification may also trigger an email when the type is email-enabled.
 */
export async function notifyInscriptionConfirmed(
	record: InscriptionRecord,
	actorName?: string,
): Promise<void> {
	const typeLabel = getCategoryTypeName(record.category.type);
	const categoryName = record.category.subname
		? `${typeLabel} - ${record.category.subname}`
		: typeLabel;
	const competitionName = record.category.competition.name;
	const link = `/competitions/competition_details/${record.category.competitionId}`;
	const confirmedBy = actorName || '';

	const realUserIds = record.users.map((u) => u.id);
	const creatorIsParticipant = realUserIds.includes(record.creatorId);

	const promises: Promise<unknown>[] = [];

	// Notify every real platform user on the record
	for (const user of record.users) {
		const teammates = [
			...record.users.filter((u) => u.id !== user.id).map((u) => u.name),
			...record.userIntents.map((ui) => ui.name),
		];
		const teammateNames = teammates.join(', ');
		const hasTeammates = teammates.length > 0;

		promises.push(
			createNotification({
				userId: user.id,
				type: NotificationType.INSCRIPTION_CONFIRMED,
				title: hasTeammates
					? 'notifications.titles.inscription_confirmed_team'
					: 'notifications.titles.inscription_confirmed',
				message: hasTeammates
					? 'notifications.messages.inscription_confirmed_team'
					: 'notifications.messages.inscription_confirmed',
				link,
				data: { categoryName, competitionName, confirmedBy, teammateNames },
				actorName,
				translationKey: hasTeammates ? 'inscription_confirmed_team' : undefined,
			}),
		);
	}

	// If the creator is NOT already a participant, they still need a notification
	if (!creatorIsParticipant) {
		const allParticipantNames = [
			...record.users.map((u) => u.name),
			...record.userIntents.map((ui) => ui.name),
		].join(', ');
		promises.push(
			createNotification({
				userId: record.creatorId,
				type: NotificationType.INSCRIPTION_CONFIRMED,
				title: 'notifications.titles.inscription_confirmed_nonplatform',
				message: 'notifications.messages.inscription_confirmed_nonplatform',
				link,
				data: { participantNames: allParticipantNames, categoryName, competitionName, confirmedBy },
				actorName,
				translationKey: 'inscription_confirmed_nonplatform',
			}),
		);
	}

	await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// Payment reminder notification
// ---------------------------------------------------------------------------

interface PaymentReminderRecord {
	creatorId: string;
	users: { id: string; name: string }[];
	userIntents: { name: string }[];
	category: {
		competitionId: number;
		description: string;
		subname: string | null;
		type: CategoryType;
		competition: { name: string };
	};
}

/**
 * Send PAYMENT_REMINDER notifications to all platform users on the given records.
 * Creators who are NOT participants receive a per-record notification that
 * includes participant names so they can distinguish between records.
 * Optionally includes an organizer note appended to the message.
 */
export async function notifyPaymentReminder(
	records: PaymentReminderRecord[],
	actorName?: string,
	note?: string,
): Promise<number> {
	if (records.length === 0) return 0;

	// All records share the same category context
	const firstRecord = records[0];
	const typeLabel = getCategoryTypeName(firstRecord.category.type);
	const categoryName = firstRecord.category.subname
		? `${typeLabel} - ${firstRecord.category.subname}`
		: typeLabel;
	const competitionName = firstRecord.category.competition.name;
	const link = `/competitions/competition_details/${firstRecord.category.competitionId}`;

	const hasNote = !!note?.trim();
	const baseData: Record<string, string> = { categoryName, competitionName };
	if (hasNote) baseData.organizerNote = note!.trim();

	const notifiedUserIds = new Set<string>();
	const promises: Promise<unknown>[] = [];

	// Collect participant user IDs (users on records) and creator IDs that aren't participants
	const participantIds = new Set<string>();
	const creatorRecords: { creatorId: string; participantNames: string }[] = [];

	for (const record of records) {
		const realUserIds = record.users.map((u) => u.id);

		for (const uid of realUserIds) {
			participantIds.add(uid);
			notifiedUserIds.add(uid);
		}

		const creatorIsParticipant = realUserIds.includes(record.creatorId);
		if (!creatorIsParticipant) {
			const allParticipantNames = [
				...record.users.map((u) => u.name),
				...record.userIntents.map((ui) => ui.name),
			].join(', ');
			creatorRecords.push({ creatorId: record.creatorId, participantNames: allParticipantNames });
			notifiedUserIds.add(record.creatorId);
		}
	}

	// Notify all participants with the standard message (bulk)
	if (participantIds.size > 0) {
		promises.push(
			createNotificationForUsers(
				[...participantIds],
				NotificationType.PAYMENT_REMINDER,
				'notifications.titles.payment_reminder',
				hasNote
					? 'notifications.messages.payment_reminder_with_note'
					: 'notifications.messages.payment_reminder',
				link,
				baseData,
				actorName,
				hasNote ? 'payment_reminder_with_note' : undefined,
			),
		);
	}

	// Notify creators who aren't participants with per-record messages
	for (const { creatorId, participantNames } of creatorRecords) {
		const creatorData = { ...baseData, participantNames };
		promises.push(
			createNotification({
				userId: creatorId,
				type: NotificationType.PAYMENT_REMINDER,
				title: hasNote
					? 'notifications.titles.payment_reminder_with_note'
					: 'notifications.titles.payment_reminder',
				message: hasNote
					? 'notifications.messages.payment_reminder_creator_with_note'
					: 'notifications.messages.payment_reminder_creator',
				link,
				data: creatorData,
				actorName,
				translationKey: hasNote ? 'payment_reminder_creator_with_note' : 'payment_reminder_creator',
			}),
		);
	}

	await Promise.all(promises);

	return notifiedUserIds.size;
}

// ---------------------------------------------------------------------------
// Table assignment notification
// ---------------------------------------------------------------------------

interface TableAssignmentRecord {
	id: string;
	tableNumber: number;
	users: { id: string; name: string }[];
	userIntents: { name: string }[];
	creatorId: string;
}

interface TableAssignmentCategory {
	competitionId: number;
	description: string;
	subname: string | null;
	type: CategoryType;
	competition: { name: string };
}

/**
 * Send TABLE_ASSIGNED notifications to every user on each record.
 * Called after the organizer publishes / compacts table assignments.
 */
export async function notifyTableAssignments(
	records: TableAssignmentRecord[],
	category: TableAssignmentCategory,
): Promise<void> {
	const typeLabel = getCategoryTypeName(category.type);
	const categoryName = category.subname
		? `${typeLabel} - ${category.subname}`
		: typeLabel;
	const competitionName = category.competition.name;
	const link = `/competitions/competition_details/${category.competitionId}`;

	const promises: Promise<unknown>[] = [];

	for (const record of records) {
		const tableNumber = record.tableNumber;

		const allParticipantNames = [
			...record.users.map((u) => u.name),
			...record.userIntents.map((ui) => ui.name),
		].join(', ');

		// Notify every real platform user on the record
		for (const user of record.users) {
			const teammates = [
				...record.users.filter((u) => u.id !== user.id).map((u) => u.name),
				...record.userIntents.map((ui) => ui.name),
			];
			const hasTeammates = teammates.length > 0;
			promises.push(
				createNotification({
					userId: user.id,
					type: NotificationType.TABLE_ASSIGNED,
					title: 'notifications.titles.table_assigned',
					message: hasTeammates
						? 'notifications.messages.table_assigned_team'
						: 'notifications.messages.table_assigned',
					link,
					data: { participantName: user.name, categoryName, competitionName, tableNumber, teammateNames: teammates.join(', ') },
				}),
			);
		}

		// If the creator is NOT already a participant, still notify them
		const realUserIds = record.users.map((u) => u.id);
		if (!realUserIds.includes(record.creatorId)) {
			promises.push(
				createNotification({
					userId: record.creatorId,
					type: NotificationType.TABLE_ASSIGNED,
					title: 'notifications.titles.table_assigned',
					message: 'notifications.messages.table_assigned_creator',
					link,
					data: { participantNames: allParticipantNames, categoryName, competitionName, tableNumber },
				}),
			);
		}
	}

	await Promise.all(promises);
}
