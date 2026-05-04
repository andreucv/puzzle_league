import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus, CompetitionStatus, InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';
import { createNotificationForUsers } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { notifyTableAssignments, notifyPaymentReminder } from '$lib/notifications/inscription_notifications';
import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/inscription';
import type { AutoStopScheduler } from './auto-stop-scheduler';

interface AutoStopOptions {
	scheduler?: AutoStopScheduler;
	isAutoStop?: boolean;
}

interface StartAutoStopOptions extends AutoStopOptions {
	autoStop: true;
	deadline: Date;
}

export class CategoryNotFoundError extends Error {
	constructor(categoryId: number) {
		super(`Category ${categoryId} not found`);
		this.name = 'CategoryNotFoundError';
	}
}

export class InvalidStatusTransitionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidStatusTransitionError';
	}
}

interface CategoryWithCounts {
	id: number;
	competitionId: number;
	status: string;
	realStartTime: Date | null;
	realEndTime: Date | null;
	totalRecords: number;
	finishedRecords: number;
	[key: string]: unknown;
}

async function findCategoryOrThrow(categoryId: number) {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			status: true,
			competitionId: true,
			autoStop: true,
			startTime: true,
			endTime: true,
			extraMinutes: true,
			realStartTime: true,
		}
	});
	if (!category) throw new CategoryNotFoundError(categoryId);
	return category;
}

async function getRecordCounts(categoryId: number): Promise<{ totalRecords: number; finishedRecords: number }> {
	const [totalRecords, finishedRecords] = await Promise.all([
		prisma.record.count({
			where: { categoryId, status: InscriptionStatus.CONFIRMED }
		}),
		prisma.record.count({
			where: { categoryId, status: InscriptionStatus.CONFIRMED, finishTime: { not: null } }
		})
	]);
	return { totalRecords, finishedRecords };
}

async function publishStatusChanged(
	competitionId: number,
	categoryId: number,
	status: string,
	extra: Record<string, unknown> = {}
): Promise<void> {
	await publishCompetitionEvent(competitionId, 'category.status_changed', {
		categoryId,
		competitionId,
		status,
		...extra
	});
}

export async function startCategory(categoryId: number, options?: StartAutoStopOptions): Promise<CategoryWithCounts> {
	const { totalRecords, finishedRecords } = await getRecordCounts(categoryId);

	const updatedCategory = await prisma.category.update({
		where: { id: categoryId },
		data: {
			realStartTime: new Date(),
			status: CategoryStatus.LIVE
		}
	});

	// If this is the first category to start, mark the competition as STARTED
	const { count: competitionStarted } = await prisma.competition.updateMany({
		where: {
			id: updatedCategory.competitionId,
			status: CompetitionStatus.NOT_STARTED
		},
		data: { status: CompetitionStatus.STARTED }
	});

	// Notify participants when competition transitions to STARTED
	if (competitionStarted > 0) {
		const competition = await prisma.competition.findUnique({
			where: { id: updatedCategory.competitionId },
			select: { name: true }
		});

		const participantIds = await prisma.record.findMany({
			where: { category: { competitionId: updatedCategory.competitionId } },
			select: { users: { select: { id: true } } }
		});

		const uniqueUserIds = [...new Set(participantIds.flatMap(r => r.users.map(u => u.id)))];

		if (uniqueUserIds.length > 0 && competition) {
			await createNotificationForUsers(
				uniqueUserIds,
				NotificationType.COMPETITION_STARTED,
				'notifications.titles.competition_started',
				'notifications.messages.competition_started',
				`/competitions/competition_details/${updatedCategory.competitionId}`,
				{ competitionName: competition.name }
			);
		}
	}

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realStartTime: updatedCategory.realStartTime?.toISOString() ?? null
	});

	// Schedule auto-stop if requested
	if (options?.autoStop) {
		await options.scheduler.scheduleAutoStop(categoryId, updatedCategory.competitionId, options.deadline);
	}

	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function stopCategory(categoryId: number, options?: AutoStopOptions): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status !== CategoryStatus.LIVE) {
		throw new InvalidStatusTransitionError('Only LIVE categories can be stopped');
	}

	// When auto-stopping, use the exact deadline (realStartTime + duration + extraMinutes)
	// to avoid showing extra seconds from QStash delivery latency
	let endTime: Date;
	if (options?.isAutoStop && category.realStartTime) {
		const durationMs = new Date(category.endTime).getTime() - new Date(category.startTime).getTime();
		const extraMs = category.extraMinutes * 60_000;
		endTime = new Date(category.realStartTime.getTime() + durationMs + extraMs);
	} else {
		endTime = new Date();
	}

	const [updatedCategory, totalRecords, finishedRecords] = await prisma.$transaction([
		prisma.category.update({
			where: { id: categoryId },
			data: {
				realEndTime: endTime,
				status: CategoryStatus.STOPPED
			}
		}),
		prisma.record.count({
			where: { categoryId, status: InscriptionStatus.CONFIRMED }
		}),
		prisma.record.count({
			where: { categoryId, status: InscriptionStatus.CONFIRMED, finishTime: { not: null } }
		})
	]);

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realEndTime: updatedCategory.realEndTime?.toISOString() ?? null,
		autoStop: options?.isAutoStop ?? false
	});

	// Cancel any scheduled auto-stop
	if (options?.scheduler) {
		await options.scheduler.cancelAutoStop(categoryId);
	}

	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function cancelCategory(categoryId: number, options?: AutoStopOptions): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status === CategoryStatus.COMPLETE) {
		throw new InvalidStatusTransitionError('Cannot cancel a completed category');
	}
	if (category.status === CategoryStatus.CANCELED) {
		throw new InvalidStatusTransitionError('Category is already canceled');
	}

	const updatedCategory = await prisma.category.update({
		where: { id: categoryId },
		data: { status: CategoryStatus.CANCELED }
	});

	publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status);

	// Cancel any scheduled auto-stop
	if (options?.scheduler) {
		await options.scheduler.cancelAutoStop(categoryId);
	}

	const { totalRecords, finishedRecords } = await getRecordCounts(categoryId);
	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function completeCategory(categoryId: number): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status !== CategoryStatus.STOPPED) {
		throw new InvalidStatusTransitionError('Only STOPPED categories can be completed');
	}

	const updatedCategory = await prisma.$transaction(async (tx) => {
		const updated = await tx.category.update({
			where: { id: categoryId },
			data: { status: CategoryStatus.COMPLETE }
		});

		const remaining = await tx.category.count({
			where: {
				competitionId: category.competitionId,
				status: { notIn: [CategoryStatus.COMPLETE, CategoryStatus.CANCELED] }
			}
		});

		if (remaining === 0) {
			await tx.competition.update({
				where: { id: category.competitionId },
				data: { status: CompetitionStatus.FINISHED }
			});
		}

		return updated;
	});

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status);

	const { totalRecords, finishedRecords } = await getRecordCounts(categoryId);
	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function resumeCategory(categoryId: number): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status !== CategoryStatus.STOPPED) {
		throw new InvalidStatusTransitionError('Only STOPPED categories can be resumed');
	}

	const updatedCategory = await prisma.category.update({
		where: { id: categoryId },
		data: {
			status: CategoryStatus.LIVE,
			realEndTime: null
		}
	});

	const { totalRecords, finishedRecords } = await getRecordCounts(categoryId);

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realEndTime: null
	});

	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function restartCategory(categoryId: number, options?: AutoStopOptions): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (
		category.status !== CategoryStatus.COMPLETE &&
		category.status !== CategoryStatus.CANCELED &&
		category.status !== CategoryStatus.STOPPED
	) {
		throw new InvalidStatusTransitionError('Can only restart completed, canceled, or stopped categories');
	}

	const [updatedCategory] = await prisma.$transaction([
		prisma.category.update({
			where: { id: categoryId },
			data: {
				status: CategoryStatus.LIVE,
				realStartTime: new Date(),
				realEndTime: null
			}
		}),
		prisma.record.updateMany({
			where: { categoryId, status: InscriptionStatus.CONFIRMED },
			data: {
				finishTime: null,
				nPiecesCompleted: null
			}
		})
	]);

	const totalRecords = await prisma.record.count({
		where: { categoryId, status: InscriptionStatus.CONFIRMED }
	});

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realStartTime: updatedCategory.realStartTime?.toISOString() ?? null,
		realEndTime: null
	});

	// Cancel old auto-stop, then re-schedule if category has autoStop enabled
	if (options?.scheduler) {
		await options.scheduler.cancelAutoStop(categoryId);

		if (category.autoStop) {
			const durationMs = new Date(category.endTime).getTime() - new Date(category.startTime).getTime();
			const extraMs = category.extraMinutes * 60_000;
			const deadline = new Date(Date.now() + durationMs + extraMs);
			await options.scheduler.scheduleAutoStop(categoryId, updatedCategory.competitionId, deadline);
		}
	}

	return { ...updatedCategory, totalRecords, finishedRecords: 0 };
}

// ---------------------------------------------------------------------------
// Category operations (non-status-transition lifecycle actions)
// ---------------------------------------------------------------------------

const ALLOWED_ADD_TIME_MINUTES = [5, 10, 15];

/**
 * Add extra time to a LIVE category and optionally reschedule auto-stop.
 * @returns The updated extraMinutes value.
 */
export async function addTimeToCategory(
	categoryId: number,
	minutes: number,
	options?: { scheduler?: AutoStopScheduler }
) {
	if (!ALLOWED_ADD_TIME_MINUTES.includes(minutes)) {
		throw new InvalidStatusTransitionError(`Minutes must be one of: ${ALLOWED_ADD_TIME_MINUTES.join(', ')}`);
	}

	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			status: true,
			competitionId: true,
			autoStop: true,
			realStartTime: true,
			startTime: true,
			endTime: true,
			extraMinutes: true
		}
	});

	if (!category) throw new CategoryNotFoundError(categoryId);
	if (category.status !== CategoryStatus.LIVE) {
		throw new InvalidStatusTransitionError('Can only add time to LIVE categories');
	}

	const updatedCategory = await prisma.category.update({
		where: { id: categoryId },
		data: { extraMinutes: { increment: minutes } },
		select: { extraMinutes: true }
	});

	await publishCompetitionEvent(category.competitionId, 'category.time_extended', {
		categoryId,
		competitionId: category.competitionId,
		extraMinutes: updatedCategory.extraMinutes,
		addedMinutes: minutes
	});

	// Reschedule auto-stop if enabled
	if (category.autoStop && category.realStartTime && options?.scheduler) {
		const durationMs = category.endTime.getTime() - category.startTime.getTime();
		const newDeadline = new Date(
			category.realStartTime.getTime() + durationMs + updatedCategory.extraMinutes * 60_000
		);
		await options.scheduler.rescheduleAutoStop(categoryId, category.competitionId, newDeadline);
	}

	return { extraMinutes: updatedCategory.extraMinutes };
}

/**
 * Assign sequential table numbers to all confirmed records in a category,
 * compacting any gaps. Notifies only participants whose table number changed.
 */
export async function publishTableAssignments(categoryId: number) {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		include: { competition: { select: { name: true } } }
	});

	if (!category) throw new CategoryNotFoundError(categoryId);

	const records = await prisma.record.findMany({
		where: { categoryId, status: InscriptionStatus.CONFIRMED },
		orderBy: [{ confirmedAt: 'asc' }, { createdAt: 'asc' }],
		select: {
			id: true,
			tableNumber: true,
			creatorId: true,
			users: { select: { id: true, name: true } },
			userIntents: { select: { name: true } }
		}
	});

	if (records.length === 0) {
		return { assignedCount: 0, notifiedCount: 0 };
	}

	// Build a map of previous table numbers for change detection
	const previousTables = new Map(records.map((r) => [r.id, r.tableNumber]));

	// Reassign table numbers sequentially (compacting any gaps)
	await prisma.$transaction(
		records.map((record, index) =>
			prisma.record.update({
				where: { id: record.id },
				data: { tableNumber: index + 1 }
			})
		)
	);

	const recordsWithTables = records.map((record, index) => ({
		...record,
		tableNumber: index + 1
	}));

	// Only notify users whose table number actually changed
	const changedRecords = recordsWithTables.filter(
		(r) => r.tableNumber !== previousTables.get(r.id)
	);

	if (changedRecords.length > 0) {
		await notifyTableAssignments(changedRecords, category);
	}

	return { assignedCount: records.length, notifiedCount: changedRecords.length };
}

/**
 * Send payment reminders to all eligible pending-confirmation records in a category.
 * Respects a cooldown period to avoid spamming participants.
 */
export async function remindPendingPayments(
	categoryId: number,
	options?: { actorName?: string; note?: string }
) {
	const cooldownThreshold = new Date(Date.now() - PAYMENT_REMINDER_COOLDOWN_MS);

	const eligibleRecords = await prisma.record.findMany({
		where: {
			categoryId,
			status: InscriptionStatus.PENDING_CONFIRMATION,
			OR: [
				{ lastRemindedAt: null },
				{ lastRemindedAt: { lt: cooldownThreshold } }
			]
		},
		include: {
			category: {
				select: {
					competitionId: true,
					description: true,
					subname: true,
					type: true,
					competition: { select: { name: true } }
				}
			},
			users: { select: { id: true, name: true } },
			userIntents: { select: { name: true } }
		}
	});

	const totalPending = await prisma.record.count({
		where: { categoryId, status: InscriptionStatus.PENDING_CONFIRMATION }
	});

	const skippedCount = totalPending - eligibleRecords.length;

	if (eligibleRecords.length === 0) {
		return { remindedCount: 0, skippedCount };
	}

	const now = new Date();
	await prisma.record.updateMany({
		where: { id: { in: eligibleRecords.map((r) => r.id) } },
		data: { lastRemindedAt: now }
	});

	const remindedCount = await notifyPaymentReminder(
		eligibleRecords,
		options?.actorName,
		options?.note
	);

	return { remindedCount, skippedCount };
}
