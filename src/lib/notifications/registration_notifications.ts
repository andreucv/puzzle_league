import type { NotificationIntent } from './dispatcher';
import { NotificationType, RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';
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
		type: string;
		competition: { name: string };
	};
}

interface SubmittedRegistrationEntry extends RegistrationEntry {
	status: RegistrationStatus;
	category: RegistrationEntry['category'] & {
		competition: { id?: number; name: string };
	};
}

function competitionDetailsLink(category: RegistrationEntry['category'] & { competition?: { id?: number } }): string {
	return `/competitions/competition_details/${category.competitionId ?? category.competition?.id}`;
}

/**
 * Intents for teammates after a submitted Entry is created. The registering actor
 * is not notified here because their form submission already confirms the
 * outcome; waitlisted Entries use notificationsForRegistrationWaitlisted instead.
 */
export function notificationsForRegistrationCreated(
	entry: SubmittedRegistrationEntry,
	actorUserId: string,
	actorName?: string,
): NotificationIntent[] {
	if (entry.status === RegistrationStatus.WAITLISTED) return [];

	const otherUserIds = entry.users
		.map((user) => user.id)
		.filter((id) => id !== actorUserId);

	if (otherUserIds.length === 0) return [];

	const categoryName = entry.category.description || entry.category.type;
	const competitionName = entry.category.competition.name;
	const link = competitionDetailsLink(entry.category);

	if (entry.status === RegistrationStatus.CONFIRMED) {
		const confirmedBy = actorName || entry.users.find((user) => user.id === actorUserId)?.name || 'the organizer';
		return [
			{
				userIds: otherUserIds,
				type: NotificationType.REGISTRATION_CONFIRMED,
				title: 'notifications.titles.registration_confirmed',
				message: 'notifications.messages.registration_confirmed',
				link,
				data: {
					categoryName,
					competitionName,
					confirmedBy,
				},
			},
		];
	}

	const registeredBy = actorName || entry.users.find((user) => user.id === actorUserId)?.name || 'a teammate';
	return [
		{
			userIds: otherUserIds,
			type: NotificationType.REGISTRATION_CREATED,
			title: 'notifications.titles.registration_created',
			message: 'notifications.messages.registration_created',
			link,
			data: {
				categoryName,
				competitionName,
				registeredBy,
			},
		},
	];
}

/** Intents for platform users on a newly waitlisted Entry. */
export function notificationsForRegistrationWaitlisted(entry: SubmittedRegistrationEntry): NotificationIntent[] {
	const userIds = entry.users.map((user) => user.id);
	if (userIds.length === 0) return [];

	return [
		{
			userIds,
			type: NotificationType.REGISTRATION_WAITLISTED,
			title: 'notifications.titles.registration_waitlisted',
			message: 'notifications.messages.registration_waitlisted',
			link: competitionDetailsLink(entry.category),
			data: { categoryName: entry.category.description ?? entry.category.type },
		},
	];
}

/**
 * Registration-confirmed intents based on the entry composition:
 *
 * 1. Creator IS a participant (and sole user) → one notification to that user.
 * 2. Creator is NOT a participant:
 *    2.1 Entry has real platform users → notify each real user + notify creator.
 *    2.2 Entry has only external participants → notify creator (mentioning non-platform names).
 *
 * Each intent may also trigger an email when the type is email-enabled.
 */
export function notificationsForRegistrationConfirmed(
	entry: RegistrationEntry,
	actorName?: string,
): NotificationIntent[] {
	const typeLabel = getCategoryTypeName(entry.category.type as CategoryType);
	// @: prefix marks the value as a translation key to be resolved at render time
	const categoryName = entry.category.subname
		? `@:${typeLabel} - ${entry.category.subname}`
		: `@:${typeLabel}`;
	const competitionName = entry.category.competition.name;
	const link = competitionDetailsLink(entry.category);
	const confirmedBy = actorName || '';

	const realUserIds = entry.users.map((u) => u.id);
	const creatorIsParticipant = realUserIds.includes(entry.creatorId);

	const intents: NotificationIntent[] = [];

	// Notify every real platform user on the entry
	for (const user of entry.users) {
		const teammates = [
			...entry.users.filter((u) => u.id !== user.id).map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		];
		const teammateNames = teammates.join(', ');
		const hasTeammates = teammates.length > 0;

		intents.push({
			userIds: [user.id],
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
		});
	}

	// If the creator is NOT already a participant, they still need a notification
	if (!creatorIsParticipant) {
		const allParticipantNames = [
			...entry.users.map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		].join(', ');
		intents.push({
			userIds: [entry.creatorId],
			type: NotificationType.REGISTRATION_CONFIRMED,
			title: 'notifications.titles.registration_confirmed_nonplatform',
			message: 'notifications.messages.registration_confirmed_nonplatform',
			link,
			data: { participantNames: allParticipantNames, categoryName, competitionName, confirmedBy },
			actorName,
			translationKey: 'registration_confirmed_nonplatform',
		});
	}

	return intents;
}

// ---------------------------------------------------------------------------
// Registration refusal notification
// ---------------------------------------------------------------------------

/**
 * Registration-refused intents following the same recipient pattern as
 * notificationsForRegistrationConfirmed:
 *
 * 1. Every real platform user on the entry receives a notification.
 * 2. Creator NOT a participant → creator receives a separate notification.
 * 3. External-only entries (no platform users) → creator receives the notification.
 */
export function notificationsForRegistrationRefused(
	entry: RegistrationEntry,
	actorName?: string,
): NotificationIntent[] {
	const typeLabel = getCategoryTypeName(entry.category.type as CategoryType);
	const categoryName = entry.category.subname
		? `@:${typeLabel} - ${entry.category.subname}`
		: `@:${typeLabel}`;
	const competitionName = entry.category.competition.name;
	const link = competitionDetailsLink(entry.category);

	const realUserIds = entry.users.map((u) => u.id);
	const creatorIsParticipant = realUserIds.includes(entry.creatorId);

	const intents: NotificationIntent[] = [];

	// Notify every real platform user on the entry
	for (const user of entry.users) {
		const teammates = [
			...entry.users.filter((u) => u.id !== user.id).map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		];
		const teammateNames = teammates.join(', ');
		const hasTeammates = teammates.length > 0;

		intents.push({
			userIds: [user.id],
			type: NotificationType.REGISTRATION_REFUSED,
			title: hasTeammates
				? 'notifications.titles.registration_refused_team'
				: 'notifications.titles.registration_refused',
			message: hasTeammates
				? 'notifications.messages.registration_refused_team'
				: 'notifications.messages.registration_refused',
			link,
			data: { categoryName, competitionName, teammateNames },
			actorName,
			translationKey: hasTeammates ? 'registration_refused_team' : undefined,
		});
	}

	// If the creator is NOT already a participant, they still need a notification
	if (!creatorIsParticipant) {
		const allParticipantNames = [
			...entry.users.map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		].join(', ');
		intents.push({
			userIds: [entry.creatorId],
			type: NotificationType.REGISTRATION_REFUSED,
			title: 'notifications.titles.registration_refused_nonplatform',
			message: 'notifications.messages.registration_refused_nonplatform',
			link,
			data: { participantNames: allParticipantNames, categoryName, competitionName },
			actorName,
			translationKey: 'registration_refused_nonplatform',
		});
	}

	return intents;
}

// ---------------------------------------------------------------------------
// Waitlist promotion notification
// ---------------------------------------------------------------------------

import type { PromotedEntry } from '$lib/services/registration-workflow';

/**
 * Intents for when a waitlisted entry is promoted because a slot opened up.
 * Free categories (auto-confirmed) → REGISTRATION_CONFIRMED notification.
 * Paid categories (pending confirmation) → REGISTRATION_PROMOTED notification.
 *
 * Follows the same recipient pattern as notificationsForRegistrationConfirmed:
 * 1. Creator IS a participant → one notification to that user.
 * 2. Creator is NOT a participant:
 *    2.1 Has real platform users → notify each user + notify creator.
 *    2.2 Only external participants → notify creator.
 */
export function notificationsForWaitlistPromotion(
	entry: PromotedEntry,
	actorName?: string,
): NotificationIntent[] {
	const typeLabel = getCategoryTypeName(entry.category.type as CategoryType);
	const categoryName = entry.category.subname
		? `@:${typeLabel} - ${entry.category.subname}`
		: `@:${typeLabel}`;
	const competitionName = entry.category.competition.name;
	const link = competitionDetailsLink(entry.category);

	// Auto-confirmed promotions (free categories) use REGISTRATION_CONFIRMED;
	// pending promotions use REGISTRATION_PROMOTED.
	const isAutoConfirmed = entry.status === RegistrationStatus.CONFIRMED;
	const notificationType = isAutoConfirmed
		? NotificationType.REGISTRATION_CONFIRMED
		: NotificationType.REGISTRATION_PROMOTED;
	const titleKey = isAutoConfirmed ? 'registration_confirmed' : 'registration_promoted';
	const titleKeyTeam = isAutoConfirmed ? 'registration_confirmed_team' : 'registration_promoted_team';
	const titleKeyNonplatform = isAutoConfirmed ? 'registration_confirmed_nonplatform' : 'registration_promoted_nonplatform';

	const realUserIds = entry.users.map((u) => u.id);
	const creatorIsParticipant = realUserIds.includes(entry.creatorId);

	const intents: NotificationIntent[] = [];

	// Notify every real platform user on the entry
	for (const user of entry.users) {
		const teammates = [
			...entry.users.filter((u) => u.id !== user.id).map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		];
		const teammateNames = teammates.join(', ');
		const hasTeammates = teammates.length > 0;

		const selectedTitleKey = hasTeammates ? titleKeyTeam : titleKey;

		intents.push({
			userIds: [user.id],
			type: notificationType,
			title: `notifications.titles.${selectedTitleKey}`,
			message: `notifications.messages.${selectedTitleKey}`,
			link,
			data: {
				categoryName,
				competitionName,
				teammateNames,
				...(isAutoConfirmed ? { confirmedBy: '' } : {}),
			},
			actorName,
			translationKey: hasTeammates ? selectedTitleKey : undefined,
		});
	}

	// If the creator is NOT already a participant, they still need a notification
	if (!creatorIsParticipant) {
		const allParticipantNames = [
			...entry.users.map((u) => u.name),
			...entry.externalParticipants.map((ui) => ui.name),
		].join(', ');
		intents.push({
			userIds: [entry.creatorId],
			type: notificationType,
			title: `notifications.titles.${titleKeyNonplatform}`,
			message: `notifications.messages.${titleKeyNonplatform}`,
			link,
			data: {
				participantNames: allParticipantNames,
				categoryName,
				competitionName,
				...(isAutoConfirmed ? { confirmedBy: '' } : {}),
			},
			actorName,
			translationKey: titleKeyNonplatform,
		});
	}

	return intents;
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
 * PAYMENT_REMINDER intents for all platform users on the given entries.
 * Creators who are NOT participants receive a per-entry notification that
 * includes participant names so they can distinguish between entries.
 * Optionally includes an organizer note appended to the message.
 *
 * Callers derive the distinct notified-user count from the returned intents'
 * `userIds` (e.g. `new Set(intents.flatMap((i) => i.userIds)).size`).
 */
export function notificationsForPaymentReminder(
	entries: PaymentReminderEntry[],
	actorName?: string,
	note?: string,
): NotificationIntent[] {
	if (entries.length === 0) return [];

	// All entries share the same category context
	const firstEntry = entries[0];
	const typeLabel = getCategoryTypeName(firstEntry.category.type as CategoryType);
	const categoryName = firstEntry.category.subname
		? `@:${typeLabel} - ${firstEntry.category.subname}`
		: `@:${typeLabel}`;
	const competitionName = firstEntry.category.competition.name;
	const link = competitionDetailsLink(firstEntry.category);

	const hasNote = !!note?.trim();
	const baseData: Record<string, string> = { categoryName, competitionName };
	if (hasNote) baseData.organizerNote = note!.trim();

	const intents: NotificationIntent[] = [];

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
			intents.push({
				userIds: [user.id],
				type: NotificationType.PAYMENT_REMINDER,
				title: hasNote
					? 'notifications.titles.payment_reminder_with_note'
					: 'notifications.titles.payment_reminder',
				message: messageKey,
				link,
				data: userData,
				actorName,
				translationKey,
			});
		}

		// Notify creators who aren't participants with per-entry messages including participant names
		if (!creatorIsParticipant) {
			const allParticipantNames = [
				...entry.users.map((u) => u.name),
				...entry.externalParticipants.map((ui) => ui.name),
			].join(', ');
			const creatorData = { ...baseData, participantNames: allParticipantNames };
			intents.push({
				userIds: [entry.creatorId],
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
			});
		}
	}

	return intents;
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
 * TABLE_ASSIGNED intents for every user on each record.
 * Built after the organizer publishes / compacts table assignments.
 */
export function notificationsForTableAssignment(
	records: TableAssignmentRecord[],
	category: TableAssignmentCategory,
): NotificationIntent[] {
	const typeLabel = getCategoryTypeName(category.type as CategoryType);
	const categoryName = category.subname
		? `@:${typeLabel} - ${category.subname}`
		: `@:${typeLabel}`;
	const competitionName = category.competition.name;
	const link = competitionDetailsLink(category);

	const intents: NotificationIntent[] = [];

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
			intents.push({
				userIds: [user.id],
				type: NotificationType.TABLE_ASSIGNED,
				title: 'notifications.titles.table_assigned',
				message: hasTeammates
					? 'notifications.messages.table_assigned_team'
					: 'notifications.messages.table_assigned',
				link,
				data: { participantName: user.name, categoryName, competitionName, tableNumber, teammateNames: teammates.join(', ') },
			});
		}

		// If the creator is NOT already a participant, still notify them
		const realUserIds = record.users.map((u) => u.id);
		if (!realUserIds.includes(record.creatorId)) {
			intents.push({
				userIds: [record.creatorId],
				type: NotificationType.TABLE_ASSIGNED,
				title: 'notifications.titles.table_assigned',
				message: 'notifications.messages.table_assigned_creator',
				link,
				data: { participantNames: allParticipantNames, categoryName, competitionName, tableNumber },
			});
		}
	}

	return intents;
}
