import { createNotification, createNotificationForUsers } from './notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
import { getCategoryTypeName } from '$lib/utils/category_utils';

interface RegistrationEntry {
	creatorId: string;
	users: { id: string; name: string }[];
	externalParticipants: { name: string }[];
	category: {
		competitionId: number;
		description: string;
		subname: string | null;
		type: CategoryType;
		competition: { name: string };
	};
}

/**
 * Send registration-confirmed notifications based on the entry composition:
 *
 * 1. Creator IS a participant (and sole user) → one notification to that user.
 * 2. Creator is NOT a participant:
 *    2.1 Entry has real platform users → notify each real user + notify creator.
 *    2.2 Entry has only external participants → notify creator (mentioning non-platform names).
 *
 * Each notification may also trigger an email when the type is email-enabled.
 */
export async function notifyRegistrationConfirmed(
	entry: RegistrationEntry,
	actorName?: string,
): Promise<void> {
	const typeLabel = getCategoryTypeName(entry.category.type);
	const categoryName = entry.category.subname
		? `${typeLabel} - ${entry.category.subname}`
		: typeLabel;
	const competitionName = entry.category.competition.name;
	const link = `/competitions/competition_details/${entry.category.competitionId}`;
	const confirmedBy = actorName || '';

	const realUserIds = entry.users.map((u) => u.id);
	const creatorIsParticipant = realUserIds.includes(entry.creatorId);

	const promises: Promise<unknown>[] = [];

	// Notify every real platform user on the entry
	for (const user of entry.users) {
		const teammates = [
			...entry.users.filter((u) => u.id !== user.id).map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		];
		const teammateNames = teammates.join(', ');
		const hasTeammates = teammates.length > 0;

		promises.push(
			createNotification({
				userId: user.id,
				type: NotificationType.REGISTRATION_CONFIRMED,
				title: hasTeammates
					? 'notifications.titles.registration_confirmed_team'
					: 'notifications.titles.registration_confirmed',
				message: hasTeammates
					? 'notifications.messages.registration_confirmed_team'
					: 'notifications.messages.registration_confirmed',
				link,
				data: { categoryName, competitionName, confirmedBy, teammateNames },
				actorName,
				translationKey: hasTeammates ? 'registration_confirmed_team' : undefined,
			}),
		);
	}

	// If the creator is NOT already a participant, they still need a notification
	if (!creatorIsParticipant) {
		const allParticipantNames = [
			...entry.users.map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		].join(', ');
		promises.push(
			createNotification({
				userId: entry.creatorId,
				type: NotificationType.REGISTRATION_CONFIRMED,
				title: 'notifications.titles.registration_confirmed_nonplatform',
				message: 'notifications.messages.registration_confirmed_nonplatform',
				link,
				data: { participantNames: allParticipantNames, categoryName, competitionName, confirmedBy },
				actorName,
				translationKey: 'registration_confirmed_nonplatform',
			}),
		);
	}

	await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// Payment reminder notification
// ---------------------------------------------------------------------------

interface PaymentReminderEntry {
	creatorId: string;
	users: { id: string; name: string }[];
	externalParticipants: { name: string }[];
	category: {
		competitionId: number;
		description: string;
		subname: string | null;
		type: CategoryType;
		competition: { name: string };
	};
}

/**
 * Send PAYMENT_REMINDER notifications to all platform users on the given entries.
 * Creators who are NOT participants receive a per-entry notification that
 * includes participant names so they can distinguish between entries.
 * Optionally includes an organizer note appended to the message.
 */
export async function notifyPaymentReminder(
	entries: PaymentReminderEntry[],
	actorName?: string,
	note?: string,
): Promise<number> {
	if (entries.length === 0) return 0;

	// All entries share the same category context
	const firstEntry = entries[0];
	const typeLabel = getCategoryTypeName(firstEntry.category.type);
	const categoryName = firstEntry.category.subname
		? `${typeLabel} - ${firstEntry.category.subname}`
		: typeLabel;
	const competitionName = firstEntry.category.competition.name;
	const link = `/competitions/competition_details/${firstEntry.category.competitionId}`;

	const hasNote = !!note?.trim();
	const baseData: Record<string, string> = { categoryName, competitionName };
	if (hasNote) baseData.organizerNote = note!.trim();

	const notifiedUserIds = new Set<string>();
	const promises: Promise<unknown>[] = [];

	for (const entry of entries) {
		const realUserIds = entry.users.map((u) => u.id);
		const creatorIsParticipant = realUserIds.includes(entry.creatorId);

		// Notify each participant with their teammates listed
		for (const user of entry.users) {
			const teammates = [
				...entry.users.filter((u) => u.id !== user.id).map((u) => u.name),
				...entry.externalParticipants.map((ui) => ui.name),
			];
			const hasTeammates = teammates.length > 0;
			const teammateNames = teammates.join(', ');

			let messageKey: string;
			let translationKey: string | undefined;
			if (hasNote && hasTeammates) {
				messageKey = 'notifications.messages.payment_reminder_team_with_note';
				translationKey = 'payment_reminder_team_with_note';
			} else if (hasTeammates) {
				messageKey = 'notifications.messages.payment_reminder_team';
				translationKey = 'payment_reminder_team';
			} else if (hasNote) {
				messageKey = 'notifications.messages.payment_reminder_with_note';
				translationKey = 'payment_reminder_with_note';
			} else {
				messageKey = 'notifications.messages.payment_reminder';
				translationKey = undefined;
			}

			const userData = { ...baseData, teammateNames };
			promises.push(
				createNotification({
					userId: user.id,
					type: NotificationType.PAYMENT_REMINDER,
					title: hasNote
						? 'notifications.titles.payment_reminder_with_note'
						: 'notifications.titles.payment_reminder',
					message: messageKey,
					link,
					data: userData,
					actorName,
					translationKey,
				}),
			);
			notifiedUserIds.add(user.id);
		}

		// Notify creators who aren't participants with per-entry messages including participant names
		if (!creatorIsParticipant) {
			const allParticipantNames = [
				...entry.users.map((u) => u.name),
				...entry.externalParticipants.map((ui) => ui.name),
			].join(', ');
			const creatorData = { ...baseData, participantNames: allParticipantNames };
			promises.push(
				createNotification({
					userId: entry.creatorId,
					type: NotificationType.PAYMENT_REMINDER,
					title: hasNote
						? 'notifications.titles.payment_reminder_creator_with_note'
						: 'notifications.titles.payment_reminder_creator',
					message: hasNote
						? 'notifications.messages.payment_reminder_creator_with_note'
						: 'notifications.messages.payment_reminder_creator',
					link,
					data: creatorData,
					actorName,
					translationKey: hasNote ? 'payment_reminder_creator_with_note' : 'payment_reminder_creator',
				}),
			);
			notifiedUserIds.add(entry.creatorId);
		}
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
	externalParticipants: { name: string }[];
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
			...record.externalParticipants.map((ui) => ui.name),
		].join(', ');

		// Notify every real platform user on the record
		for (const user of record.users) {
			const teammates = [
				...record.users.filter((u) => u.id !== user.id).map((u) => u.name),
				...record.externalParticipants.map((ui) => ui.name),
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
