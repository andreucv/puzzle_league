import { prisma } from '$lib/database/create_prisma_client';
import { EntryTagStatus, type ParticipantTagType } from '$lib/.prisma/generated/prisma/enums';
import { getCompetitionAccess } from '$lib/services/competition-access';
import { isTagClaimableInCategory } from '$lib/database/db_participant_tags';
import { notificationsForTagRejected } from '$lib/notifications/tag_notifications';
import { dispatchNotifications } from '$lib/notifications/dispatcher';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type EntryTagErrorCode =
	| 'NOT_FOUND'
	| 'NOT_ALLOWED'
	| 'REGISTRATION_CLOSED'
	| 'INVALID_STATUS'
	| 'VALIDATION_FAILED';

export class EntryTagError extends Error {
	constructor(
		public code: EntryTagErrorCode,
		message: string,
	) {
		super(message);
		this.name = 'EntryTagError';
	}
}

export function isEntryTagError(error: unknown): error is EntryTagError {
	return error instanceof EntryTagError;
}

export function entryTagHttpStatus(error: EntryTagError): number {
	switch (error.code) {
		case 'NOT_FOUND':
			return 404;
		case 'NOT_ALLOWED':
			return 403;
		default:
			return 400;
	}
}

export interface EntryTagActor {
	userId: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function loadEntryTag(entryTagId: string) {
	const entryTag = await prisma.entryTag.findUnique({
		where: { id: entryTagId },
		include: {
			entry: {
				select: {
					creatorId: true,
					category: {
						select: {
							id: true,
							description: true,
							type: true,
							competitionId: true,
							competition: { select: { name: true, registrationOpen: true } },
						},
					},
				},
			},
		},
	});
	if (!entryTag) throw new EntryTagError('NOT_FOUND', 'Tag claim not found');
	return entryTag;
}

async function assertOrganizer(competitionId: number, userId: string) {
	const access = await getCompetitionAccess(competitionId, userId);
	if (!access.canManageCompetition) {
		throw new EntryTagError('NOT_ALLOWED', 'Only organizers can manage tag claims');
	}
}

/** Throw unless the tag is available (claimable) in the category. */
async function assertTagClaimableInCategory(tag: ParticipantTagType, categoryId: number) {
	if (!(await isTagClaimableInCategory(tag, categoryId))) {
		throw new EntryTagError('VALIDATION_FAILED', 'This tag is not available for the selected category');
	}
}

// ---------------------------------------------------------------------------
// Organizer actions
// ---------------------------------------------------------------------------

/** Organizer confirms a PENDING claim. */
export async function confirmEntryTag(entryTagId: string, actor: EntryTagActor) {
	const entryTag = await loadEntryTag(entryTagId);
	await assertOrganizer(entryTag.entry.category.competitionId, actor.userId);
	if (entryTag.status === EntryTagStatus.CONFIRMED) return entryTag;

	return prisma.entryTag.update({
		where: { id: entryTagId },
		data: { status: EntryTagStatus.CONFIRMED },
	});
}

/** Organizer rejects a claim and notifies the entry creator. */
export async function rejectEntryTag(entryTagId: string, actor: EntryTagActor) {
	const entryTag = await loadEntryTag(entryTagId);
	const category = entryTag.entry.category;
	await assertOrganizer(category.competitionId, actor.userId);

	const updated = await prisma.entryTag.update({
		where: { id: entryTagId },
		data: { status: EntryTagStatus.REJECTED },
	});

	await dispatchNotifications(
		notificationsForTagRejected({
			creatorId: entryTag.entry.creatorId,
			competitionId: category.competitionId,
			competitionName: category.competition.name,
			categoryName: category.description || category.type,
		}),
	);

	return updated;
}

/**
 * Organizer directly assigns a tag to an entry, created straight as CONFIRMED.
 * Respects one-tag-per-entry: an existing claim slot is repointed.
 */
export async function assignEntryTag(entryId: string, tag: ParticipantTagType, actor: EntryTagActor) {
	const entry = await prisma.entry.findUnique({
		where: { id: entryId },
		select: { categoryId: true, category: { select: { competitionId: true } } },
	});
	if (!entry) throw new EntryTagError('NOT_FOUND', 'Entry not found');
	await assertOrganizer(entry.category.competitionId, actor.userId);
	await assertTagClaimableInCategory(tag, entry.categoryId);

	return prisma.entryTag.upsert({
		where: { entryId },
		create: { entryId, tag, status: EntryTagStatus.CONFIRMED },
		update: { tag, status: EntryTagStatus.CONFIRMED },
	});
}

// ---------------------------------------------------------------------------
// Shared: participant-or-organizer mutations
// ---------------------------------------------------------------------------

/**
 * Change the tag on an existing claim slot. The entry creator may do this only
 * while the claim is PENDING and registration is open; organizers any time.
 * Re-claiming after a rejection repoints the slot back to PENDING.
 */
export async function changeEntryTag(entryTagId: string, tag: ParticipantTagType, actor: EntryTagActor) {
	const entryTag = await loadEntryTag(entryTagId);
	const category = entryTag.entry.category;
	const access = await getCompetitionAccess(category.competitionId, actor.userId);

	if (!access.canManageCompetition) {
		if (entryTag.entry.creatorId !== actor.userId) {
			throw new EntryTagError('NOT_ALLOWED', 'You can only change your own tag claim');
		}
		if (entryTag.status === EntryTagStatus.CONFIRMED) {
			throw new EntryTagError('INVALID_STATUS', 'A confirmed tag can only be changed by an organizer');
		}
		if (!category.competition.registrationOpen) {
			throw new EntryTagError('REGISTRATION_CLOSED', 'Registration is closed');
		}
	}

	await assertTagClaimableInCategory(tag, category.id);

	const nextStatus = access.canManageCompetition ? entryTag.status : EntryTagStatus.PENDING;
	return prisma.entryTag.update({
		where: { id: entryTagId },
		data: { tag, status: nextStatus },
	});
}

/** Remove a claim. Entry creator only while PENDING & registration open; organizers any time. */
export async function removeEntryTag(entryTagId: string, actor: EntryTagActor) {
	const entryTag = await loadEntryTag(entryTagId);
	const category = entryTag.entry.category;
	const access = await getCompetitionAccess(category.competitionId, actor.userId);

	if (!access.canManageCompetition) {
		if (entryTag.entry.creatorId !== actor.userId) {
			throw new EntryTagError('NOT_ALLOWED', 'You can only remove your own tag claim');
		}
		if (entryTag.status === EntryTagStatus.CONFIRMED) {
			throw new EntryTagError('INVALID_STATUS', 'A confirmed tag can only be removed by an organizer');
		}
		if (!category.competition.registrationOpen) {
			throw new EntryTagError('REGISTRATION_CLOSED', 'Registration is closed');
		}
	}

	await prisma.entryTag.delete({ where: { id: entryTagId } });
}
