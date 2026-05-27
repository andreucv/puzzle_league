import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus, NotificationType, RegistrationStatus, Role } from '$lib/.prisma/generated/prisma/enums';
import { getMaxEntriesPerCategory } from '$lib/utils/category_utils';
import {
	notifyRegistrationConfirmed,
	notifyRegistrationCreatedForTeammates,
	notifyRegistrationRefused,
	notifyRegistrationWaitlisted,
	notifyWaitlistPromotion,
} from '$lib/notifications/registration_notifications';
import type { PrismaClient } from '$lib/.prisma/generated/prisma/client';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const RESERVED_STATUSES = [RegistrationStatus.PENDING_CONFIRMATION, RegistrationStatus.CONFIRMED];

export interface RegistrationActor {
	userId: string;
	name?: string;
	isOrganizer: boolean;
}

export interface CategorySignup {
	categoryId: number;
	teammateIds: string[];
	externalParticipantNames?: string[];
	externalParticipantIds?: string[];
	registeredBySelf?: boolean;
}

export interface RegistrationSummary {
	totalEntries: number;
	perCategory: { name: string; type: string; count: number }[];
}

export interface PromotedEntry {
	id: string;
	categoryId: number;
	creatorId: string;
	status: RegistrationStatus;
	users: { id: string; name: string; email: string; image: string | null }[];
	externalParticipants: { name: string }[];
	category: {
		competitionId: number;
		description: string;
		subname: string | null;
		type: string;
		competition: { name: string };
	};
}

export type RegistrationWorkflowErrorCode =
	| 'REGISTRATION_CLOSED'
	| 'ENTRY_NOT_FOUND'
	| 'NOT_ALLOWED'
	| 'INVALID_STATUS'
	| 'VALIDATION_FAILED';

export class RegistrationWorkflowError extends Error {
	constructor(
		public code: RegistrationWorkflowErrorCode,
		message: string,
	) {
		super(message);
		this.name = 'RegistrationWorkflowError';
	}
}

export function isRegistrationWorkflowError(error: unknown): error is RegistrationWorkflowError {
	return error instanceof RegistrationWorkflowError;
}

export function registrationWorkflowHttpStatus(error: RegistrationWorkflowError): number {
	switch (error.code) {
		case 'ENTRY_NOT_FOUND':
			return 404;
		case 'NOT_ALLOWED':
			return 403;
		default:
			return 400;
	}
}

function assertActor(actor: RegistrationActor): void {
	if (!actor.userId) {
		throw new RegistrationWorkflowError('NOT_ALLOWED', 'You must be logged in');
	}
}

function assertValidSignups(signups: unknown): CategorySignup[] {
	if (!Array.isArray(signups) || signups.length === 0) {
		throw new RegistrationWorkflowError('VALIDATION_FAILED', 'No categories selected for signup');
	}

	return signups.map((signup) => {
		if (!signup || typeof signup !== 'object') {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Invalid signup payload');
		}

		const data = signup as Record<string, unknown>;
		if (typeof data.categoryId !== 'number' || !Number.isInteger(data.categoryId)) {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Invalid category ID');
		}
		if (!Array.isArray(data.teammateIds) || data.teammateIds.some((id) => typeof id !== 'string')) {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Invalid teammate list');
		}
		if (
			data.externalParticipantNames !== undefined &&
			(!Array.isArray(data.externalParticipantNames) || data.externalParticipantNames.some((name) => typeof name !== 'string'))
		) {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Invalid external participant names');
		}
		if (
			data.externalParticipantIds !== undefined &&
			(!Array.isArray(data.externalParticipantIds) || data.externalParticipantIds.some((id) => typeof id !== 'string'))
		) {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Invalid external participant IDs');
		}
		if (data.registeredBySelf !== undefined && typeof data.registeredBySelf !== 'boolean') {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Invalid registration ownership');
		}

		return {
			categoryId: data.categoryId,
			teammateIds: data.teammateIds,
			externalParticipantNames: data.externalParticipantNames,
			externalParticipantIds: data.externalParticipantIds,
			registeredBySelf: data.registeredBySelf,
		} as CategorySignup;
	});
}

function isFreeRegistration(category: { price: number }, competition: { showPaymentWarning: boolean }): boolean {
	return !competition.showPaymentWarning || category.price === 0;
}

async function countReservedSlots(tx: Tx, categoryId: number): Promise<number> {
	return tx.entry.count({
		where: { categoryId, status: { in: RESERVED_STATUSES } },
	});
}

async function promoteNextWaitlisted(
	tx: Tx,
	categoryId: number,
	maxParties: number | null,
): Promise<PromotedEntry | null> {
	if (!maxParties) return null;

	const reserved = await countReservedSlots(tx, categoryId);
	if (reserved >= maxParties) return null;

	const oldest = await tx.entry.findFirst({
		where: { categoryId, status: RegistrationStatus.WAITLISTED },
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		select: { id: true },
	});

	if (!oldest) return null;

	const category = await tx.category.findUniqueOrThrow({
		where: { id: categoryId },
		select: { price: true, competition: { select: { showPaymentWarning: true } } },
	});
	const promotedStatus = isFreeRegistration(category, category.competition)
		? RegistrationStatus.CONFIRMED
		: RegistrationStatus.PENDING_CONFIRMATION;

	return tx.entry.update({
		where: { id: oldest.id },
		data: {
			status: promotedStatus,
			...(promotedStatus === RegistrationStatus.CONFIRMED ? { confirmedAt: new Date() } : {}),
		},
		include: {
			users: { select: { id: true, name: true, email: true, image: true } },
			externalParticipants: { select: { name: true } },
			category: {
				select: {
					competitionId: true,
					description: true,
					subname: true,
					type: true,
					competition: { select: { name: true } },
				},
			},
		},
	});
}

async function ensureCanManageCompetition(tx: Tx, competitionId: number, actor: RegistrationActor): Promise<void> {
	const competition = await tx.competition.findUnique({
		where: { id: competitionId },
		select: { creatorId: true },
	});

	if (!competition) {
		throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Competition not found');
	}
	if (competition.creatorId === actor.userId) return;

	// Check global ADMIN or scoped competition ORGANIZER
	const [isAdmin, isScopedOrganizer] = await Promise.all([
		tx.roleAssignment.findFirst({
			where: { userId: actor.userId, role: Role.ADMIN },
			select: { id: true },
		}),
		tx.competitionCoorganizerRoleAssignment.findFirst({
			where: { userId: actor.userId, competitionId },
			select: { id: true },
		}),
	]);

	if (!isAdmin && !isScopedOrganizer) {
		throw new RegistrationWorkflowError('NOT_ALLOWED', 'Not authorized to manage this registration');
	}
}

async function runNotificationWork(label: string, work: () => Promise<void>): Promise<void> {
	try {
		await work();
	} catch (error) {
		console.error(`[registration-workflow] Failed to send ${label} notifications:`, error);
	}
}

function buildSummary(entries: Array<{ categoryId: number; category: { description: string | null; type: string } }>): RegistrationSummary {
	const perCategoryMap = new Map<number, { name: string; type: string; count: number }>();
	for (const entry of entries) {
		const existing = perCategoryMap.get(entry.categoryId);
		if (existing) {
			existing.count++;
		} else {
			perCategoryMap.set(entry.categoryId, {
				name: entry.category.description || entry.category.type,
				type: entry.category.type,
				count: 1,
			});
		}
	}

	return {
		totalEntries: entries.length,
		perCategory: Array.from(perCategoryMap.values()),
	};
}

export async function submitRegistration({
	competitionId,
	actor,
	signups,
}: {
	competitionId: number;
	actor: RegistrationActor;
	signups: unknown;
}) {
	assertActor(actor);
	const categorySignups = assertValidSignups(signups);

	const entries = await prisma.$transaction(async (tx) => {
		const competition = await tx.competition.findUnique({
			where: { id: competitionId },
			select: { id: true, name: true, registrationOpen: true, showPaymentWarning: true },
		});

		if (!competition) {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Competition not found');
		}
		if (!competition.registrationOpen && !actor.isOrganizer) {
			throw new RegistrationWorkflowError('REGISTRATION_CLOSED', 'Registration is currently closed for this competition');
		}

		const categoryIds = categorySignups.map((signup) => signup.categoryId);
		const uniqueCategoryIds = [...new Set(categoryIds)];
		const categories = await tx.category.findMany({
			where: { id: { in: uniqueCategoryIds } },
			include: { competition: true },
		});

		if (categories.length !== uniqueCategoryIds.length) {
			const foundIds = categories.map((category) => category.id);
			const missingIds = uniqueCategoryIds.filter((id) => !foundIds.includes(id));
			throw new RegistrationWorkflowError('VALIDATION_FAILED', `Categories not found: ${missingIds.join(', ')}`);
		}

		const wrongCompetitionIds = categories
			.filter((category) => category.competitionId !== competitionId)
			.map((category) => category.id);
		if (wrongCompetitionIds.length > 0) {
			throw new RegistrationWorkflowError('VALIDATION_FAILED', `Categories do not belong to this competition: ${wrongCompetitionIds.join(', ')}`);
		}

		const batchCountPerCategory = new Map<number, number>();
		for (const signup of categorySignups) {
			batchCountPerCategory.set(
				signup.categoryId,
				(batchCountPerCategory.get(signup.categoryId) || 0) + 1,
			);
		}

		if (!actor.isOrganizer) {
			for (const [categoryId, batchCount] of batchCountPerCategory) {
				const category = categories.find((item) => item.id === categoryId)!;
				const maxEntries = getMaxEntriesPerCategory(category.type);
				const existingCount = await tx.entry.count({
					where: {
						categoryId,
						creatorId: actor.userId,
					},
				});
				if (existingCount + batchCount > maxEntries) {
					throw new RegistrationWorkflowError(
						'VALIDATION_FAILED',
						`Maximum registrations reached for category ${category.description || category.type} (${maxEntries})`,
					);
				}
			}
		}

		const allUserIds = new Set([actor.userId]);
		categorySignups.forEach((signup) => {
			signup.teammateIds.forEach((id) => allUserIds.add(id));
		});

		const existingUsers = await tx.user.findMany({
			where: { id: { in: Array.from(allUserIds) } },
			select: { id: true },
		});

		if (existingUsers.length !== allUserIds.size) {
			const foundUserIds = existingUsers.map((user) => user.id);
			const missingUserIds = Array.from(allUserIds).filter((id) => !foundUserIds.includes(id));
			throw new RegistrationWorkflowError('VALIDATION_FAILED', `Users not found: ${missingUserIds.join(', ')}`);
		}

		const createdEntries = [];
		for (const signup of categorySignups) {
			const category = categories.find((item) => item.id === signup.categoryId)!;
			const allPartyUserIds = signup.registeredBySelf === false
				? [...signup.teammateIds]
				: [actor.userId, ...signup.teammateIds];
			const externalParticipantNames = signup.externalParticipantNames || [];
			const externalParticipantIds = signup.externalParticipantIds || [];
			const totalPartySize = allPartyUserIds.length + externalParticipantNames.length + externalParticipantIds.length;

			if (totalPartySize < 1) {
				throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Each registration needs at least one participant');
			}

			if (allPartyUserIds.length > 0) {
				const alreadyRegistered = await tx.entry.findMany({
					where: {
						categoryId: signup.categoryId,
						users: { some: { id: { in: allPartyUserIds } } },
					},
					include: {
						users: { select: { id: true, name: true } },
					},
				});
				if (alreadyRegistered.length > 0) {
					const duplicateUsers = alreadyRegistered
						.flatMap((entry) => entry.users)
						.filter((user) => allPartyUserIds.includes(user.id));
					const uniqueNames = [...new Set(duplicateUsers.map((user) => user.name))];
					throw new RegistrationWorkflowError(
						'VALIDATION_FAILED',
						`User(s) already registered in category ${category.description || category.type}: ${uniqueNames.join(', ')}`,
					);
				}
			}

			if (externalParticipantIds.length > 0) {
				const validExternalParticipants = await tx.externalParticipant.findMany({
					where: { id: { in: externalParticipantIds }, claimedById: null, createdById: actor.userId },
					select: { id: true },
				});
				if (validExternalParticipants.length !== externalParticipantIds.length) {
					throw new RegistrationWorkflowError('VALIDATION_FAILED', 'Some external participants were not found or are already claimed');
				}
			}

			if (category.maxPartySize && totalPartySize > category.maxPartySize) {
				throw new RegistrationWorkflowError(
					'VALIDATION_FAILED',
					`Party size (${totalPartySize}) exceeds maximum for category ${category.description || category.type} (${category.maxPartySize})`,
				);
			}

			if (category.status !== CategoryStatus.NOT_STARTED) {
				throw new RegistrationWorkflowError('INVALID_STATUS', `Registration closed for category: ${category.description || category.type}`);
			}

			let initialStatus: RegistrationStatus = actor.isOrganizer || isFreeRegistration(category, competition)
				? RegistrationStatus.CONFIRMED
				: RegistrationStatus.PENDING_CONFIRMATION;

			if (category.maxParties) {
				const reservedCount = await countReservedSlots(tx, signup.categoryId);
				if (reservedCount >= category.maxParties) {
					initialStatus = RegistrationStatus.WAITLISTED;
				}
			}

			const entry = await tx.entry.create({
				data: {
					categoryId: signup.categoryId,
					creatorId: actor.userId,
					status: initialStatus,
					...(initialStatus === RegistrationStatus.CONFIRMED ? { confirmedAt: new Date() } : {}),
					users: {
						connect: allPartyUserIds.map((id) => ({ id })),
					},
					externalParticipants: (externalParticipantNames.length > 0 || externalParticipantIds.length > 0) ? {
						...(externalParticipantNames.length > 0 ? {
							create: externalParticipantNames.map((name) => ({
								name,
								createdById: actor.userId,
							})),
						} : {}),
						...(externalParticipantIds.length > 0 ? {
							connect: externalParticipantIds.map((id) => ({ id })),
						} : {}),
					} : undefined,
				},
				include: {
					users: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					externalParticipants: {
						select: {
							id: true,
							name: true,
						},
					},
					category: {
						include: {
							competition: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			createdEntries.push(entry);
		}

		return createdEntries;
	});

	await runNotificationWork('registration submission', async () => {
		for (const entry of entries) {
			if (entry.status === RegistrationStatus.WAITLISTED) {
				await notifyRegistrationWaitlisted(entry);
			} else {
				await notifyRegistrationCreatedForTeammates(entry, actor.userId, actor.name);
			}
		}
	});

	return {
		entries,
		summary: buildSummary(entries),
	};
}

export async function unregisterRegistration({
	entryId,
	actor,
}: {
	entryId: string;
	actor: RegistrationActor;
}) {
	assertActor(actor);

	const result = await prisma.$transaction(async (tx) => {
		const entry = await tx.entry.findUnique({
			where: { id: entryId },
			include: {
				users: { select: { id: true } },
				category: { select: { maxParties: true } },
			},
		});

		if (!entry) {
			throw new RegistrationWorkflowError('ENTRY_NOT_FOUND', 'Entry not found');
		}

		const isCreator = entry.creatorId === actor.userId;
		const isParticipant = entry.users.some((user) => user.id === actor.userId);

		if (!isCreator && !isParticipant) {
			throw new RegistrationWorkflowError('NOT_ALLOWED', 'Not authorized to delete this entry');
		}

		if (
			entry.status !== RegistrationStatus.PENDING_CONFIRMATION &&
			entry.status !== RegistrationStatus.CONFIRMED &&
			entry.status !== RegistrationStatus.WAITLISTED
		) {
			throw new RegistrationWorkflowError('INVALID_STATUS', 'Cannot unregister an entry that is not pending confirmation, confirmed, or waitlisted');
		}

		const releasesSlot = entry.status === RegistrationStatus.PENDING_CONFIRMATION ||
			entry.status === RegistrationStatus.CONFIRMED;

		await tx.entry.delete({ where: { id: entryId } });

		let promotedEntry: PromotedEntry | null = null;
		if (releasesSlot) {
			promotedEntry = await promoteNextWaitlisted(tx, entry.categoryId, entry.category.maxParties);
		}

		return { promotedEntry };
	});

	const promotedEntry = result.promotedEntry;
	if (promotedEntry) {
		await runNotificationWork('waitlist promotion', async () => {
			await notifyWaitlistPromotion(promotedEntry);
		});
	}

	return result;
}

export async function confirmRegistration({
	entryId,
	actor,
}: {
	entryId: string;
	actor: RegistrationActor;
}) {
	assertActor(actor);

	const result = await prisma.$transaction(async (tx) => {
		const existingEntry = await tx.entry.findUnique({
			where: { id: entryId },
			include: {
				category: {
					select: {
						competitionId: true,
						description: true,
						subname: true,
						type: true,
						competition: { select: { name: true } },
					},
				},
				users: { select: { id: true, name: true } },
				externalParticipants: { select: { name: true } },
			},
		});

		if (!existingEntry) {
			throw new RegistrationWorkflowError('ENTRY_NOT_FOUND', 'Entry not found');
		}

		await ensureCanManageCompetition(tx, existingEntry.category.competitionId, actor);

		if (existingEntry.status !== RegistrationStatus.PENDING_CONFIRMATION) {
			throw new RegistrationWorkflowError('INVALID_STATUS', 'Only pending confirmation registrations can be confirmed');
		}

		const updatedEntry = await tx.entry.update({
			where: { id: entryId },
			data: {
				status: RegistrationStatus.CONFIRMED,
				confirmedAt: new Date(),
			},
			include: {
				category: {
					select: {
						competitionId: true,
						description: true,
						subname: true,
						type: true,
						competition: { select: { name: true } },
					},
				},
				users: { select: { id: true, name: true, email: true, image: true } },
				externalParticipants: { select: { name: true } },
			},
		});

		return { entry: updatedEntry, notificationEntry: existingEntry };
	});

	await runNotificationWork('registration confirmation', async () => {
		await notifyRegistrationConfirmed(result.notificationEntry, actor.name);
	});

	return { entry: result.entry };
}

export async function refuseRegistration({
	entryId,
	actor,
}: {
	entryId: string;
	actor: RegistrationActor;
}) {
	assertActor(actor);

	const result = await prisma.$transaction(async (tx) => {
		const entry = await tx.entry.findUnique({
			where: { id: entryId },
			include: {
				users: {
					select: { id: true, name: true, email: true, image: true },
				},
				externalParticipants: {
					select: { name: true },
				},
				category: {
					select: {
						description: true,
						competitionId: true,
						maxParties: true,
						subname: true,
						type: true,
						competition: { select: { name: true } },
					},
				},
			},
		});

		if (!entry) {
			throw new RegistrationWorkflowError('ENTRY_NOT_FOUND', 'Entry not found');
		}

		await ensureCanManageCompetition(tx, entry.category.competitionId, actor);

		if (
			entry.status !== RegistrationStatus.PENDING_CONFIRMATION &&
			entry.status !== RegistrationStatus.CONFIRMED &&
			entry.status !== RegistrationStatus.WAITLISTED
		) {
			throw new RegistrationWorkflowError('INVALID_STATUS', 'Only pending, confirmed, or waitlisted registrations can be refused');
		}

		const releasesSlot = entry.status === RegistrationStatus.PENDING_CONFIRMATION ||
			entry.status === RegistrationStatus.CONFIRMED;

		await tx.entry.delete({ where: { id: entryId } });

		let promotedEntry: PromotedEntry | null = null;
		if (releasesSlot) {
			promotedEntry = await promoteNextWaitlisted(tx, entry.categoryId, entry.category.maxParties);
		}

		return { entry, promotedEntry };
	});

	await runNotificationWork('registration refusal', async () => {
		await notifyRegistrationRefused(result.entry, actor.name);
	});

	const promotedEntry = result.promotedEntry;
	if (promotedEntry) {
		await runNotificationWork('waitlist promotion', async () => {
			await notifyWaitlistPromotion(promotedEntry, actor.name);
		});
	}

	return result;
}
