import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus, CompetitionStatus, RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';
import { createNotificationForUsers } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { notifyTableAssignments, notifyPaymentReminder } from '$lib/notifications/registration_notifications';
import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/registration';
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
	totalEntries: number;
	finishedEntries: number;
	[key: string]: unknown;
}

async function findCategoryOrThrow(categoryId: number) {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			status: true,
			competitionId: true,
			autoStopMessageId: true,
			startTime: true,
			endTime: true,
			extraMinutes: true,
			realStartTime: true,
			realEndTime: true,
		}
	});
	if (!category) throw new CategoryNotFoundError(categoryId);
	return category;
}

async function getEntryCounts(categoryId: number): Promise<{ totalEntries: number; finishedEntries: number }> {
	const [totalEntries, finishedEntries] = await Promise.all([
		prisma.entry.count({
			where: { categoryId, status: RegistrationStatus.CONFIRMED }
		}),
		prisma.entry.count({
			where: { categoryId, status: RegistrationStatus.CONFIRMED, finishTime: { not: null } }
		})
	]);
	return { totalEntries, finishedEntries };
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

async function publishAutoStopChanged(
	competitionId: number,
	categoryId: number,
	armed: boolean
): Promise<void> {
	await publishCompetitionEvent(competitionId, 'category.auto_stop_changed', {
		categoryId,
		competitionId,
		armed
	});
}

export async function startCategory(categoryId: number, options?: StartAutoStopOptions): Promise<CategoryWithCounts> {
	const { totalEntries, finishedEntries } = await getEntryCounts(categoryId);

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

		const participantIds = await prisma.entry.findMany({
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
	if (options?.autoStop && options.scheduler) {
		await options.scheduler.scheduleAutoStop(categoryId, updatedCategory.competitionId, options.deadline);
	}

	return { ...updatedCategory, totalEntries, finishedEntries };
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

	const [updatedCategory, totalEntries, finishedEntries] = await prisma.$transaction([
		prisma.category.update({
			where: { id: categoryId },
			data: {
				realEndTime: endTime,
				status: CategoryStatus.STOPPED
			}
		}),
		prisma.entry.count({
			where: { categoryId, status: RegistrationStatus.CONFIRMED }
		}),
		prisma.entry.count({
			where: { categoryId, status: RegistrationStatus.CONFIRMED, finishTime: { not: null } }
		})
	]);

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realEndTime: updatedCategory.realEndTime?.toISOString() ?? null,
		autoStop: options?.isAutoStop ?? false
	});

	// NOTE: stop intentionally does NOT cancel the scheduled auto-stop. The webhook is
	// idempotent for non-LIVE categories, so a message that fires during a pause no-ops.
	// Leaving the message keeps `autoStopMessageId` (intent) alive across stop → resume.

	return { ...updatedCategory, totalEntries, finishedEntries };
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

	const { totalEntries, finishedEntries } = await getEntryCounts(categoryId);
	return { ...updatedCategory, totalEntries, finishedEntries };
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

	const { totalEntries, finishedEntries } = await getEntryCounts(categoryId);
	return { ...updatedCategory, totalEntries, finishedEntries };
}

export async function resumeCategory(categoryId: number, options?: AutoStopOptions): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status !== CategoryStatus.STOPPED) {
		throw new InvalidStatusTransitionError('Only STOPPED categories can be resumed');
	}

	// Capture armed-state and the time that was frozen at stop BEFORE we clear realEndTime.
	const wasArmed = category.autoStopMessageId !== null;
	let remainingMs = -1;
	if (wasArmed && category.realStartTime && category.realEndTime) {
		const durationMs = category.endTime.getTime() - category.startTime.getTime();
		const extraMs = category.extraMinutes * 60_000;
		remainingMs = category.realStartTime.getTime() + durationMs + extraMs - category.realEndTime.getTime();
	}

	const updatedCategory = await prisma.category.update({
		where: { id: categoryId },
		data: {
			status: CategoryStatus.LIVE,
			realEndTime: null
		}
	});

	const { totalEntries, finishedEntries } = await getEntryCounts(categoryId);

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realEndTime: null
	});

	// Re-arm auto-stop carrying the paused time. If no time is left (the category had
	// auto-stopped at its deadline) do not re-arm — clear any stale message instead.
	if (wasArmed && options?.scheduler) {
		if (remainingMs > 0) {
			const newDeadline = new Date(Date.now() + remainingMs);
			await options.scheduler.rescheduleAutoStop(categoryId, updatedCategory.competitionId, newDeadline);
			await publishAutoStopChanged(updatedCategory.competitionId, categoryId, true);
		} else {
			await options.scheduler.cancelAutoStop(categoryId);
			await publishAutoStopChanged(updatedCategory.competitionId, categoryId, false);
		}
	}

	return { ...updatedCategory, totalEntries, finishedEntries };
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
		prisma.entry.updateMany({
			where: { categoryId, status: RegistrationStatus.CONFIRMED },
			data: {
				finishTime: null,
				nPiecesCompleted: null
			}
		})
	]);

	const totalEntries = await prisma.entry.count({
		where: { categoryId, status: RegistrationStatus.CONFIRMED }
	});

	await publishStatusChanged(updatedCategory.competitionId, updatedCategory.id, updatedCategory.status, {
		realStartTime: updatedCategory.realStartTime?.toISOString() ?? null,
		realEndTime: null
	});

	// Cancel old auto-stop, then re-schedule if category has autoStop enabled
	if (options?.scheduler) {
		const wasArmed = category.autoStopMessageId !== null;
		await options.scheduler.cancelAutoStop(categoryId);

		if (wasArmed) {
			const durationMs = new Date(category.endTime).getTime() - new Date(category.startTime).getTime();
			const extraMs = category.extraMinutes * 60_000;
			const deadline = new Date(Date.now() + durationMs + extraMs);
			await options.scheduler.scheduleAutoStop(categoryId, updatedCategory.competitionId, deadline);
		}
	}

	return { ...updatedCategory, totalEntries, finishedEntries: 0 };
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
			autoStopMessageId: true,
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

	// Reschedule auto-stop if currently armed
	if (category.autoStopMessageId !== null && category.realStartTime && options?.scheduler) {
		const durationMs = category.endTime.getTime() - category.startTime.getTime();
		const newDeadline = new Date(
			category.realStartTime.getTime() + durationMs + updatedCategory.extraMinutes * 60_000
		);
		await options.scheduler.rescheduleAutoStop(categoryId, category.competitionId, newDeadline);
	}

	return { extraMinutes: updatedCategory.extraMinutes };
}

/**
 * Enable or disable auto-stop on a LIVE category. Schedules or cancels the QStash message
 * against the current deadline (realStartTime + duration + extraMinutes). Rejects when
 * enabling with no time remaining — the organizer must add time first.
 */
export async function setAutoStop(
	categoryId: number,
	enabled: boolean,
	options: { scheduler: AutoStopScheduler }
): Promise<{ armed: boolean }> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status !== CategoryStatus.LIVE) {
		throw new InvalidStatusTransitionError('Auto-stop can only be toggled on LIVE categories');
	}

	if (enabled) {
		if (!category.realStartTime) {
			throw new InvalidStatusTransitionError('Category has no real start time');
		}
		const durationMs = category.endTime.getTime() - category.startTime.getTime();
		const extraMs = category.extraMinutes * 60_000;
		const deadline = new Date(category.realStartTime.getTime() + durationMs + extraMs);
		if (deadline.getTime() <= Date.now()) {
			throw new InvalidStatusTransitionError('No time remaining; add time before enabling auto-stop');
		}
		await options.scheduler.scheduleAutoStop(categoryId, category.competitionId, deadline);
	} else {
		await options.scheduler.cancelAutoStop(categoryId);
	}

	await publishAutoStopChanged(category.competitionId, categoryId, enabled);

	return { armed: enabled };
}

/**
 * Assign sequential table numbers to all confirmed entries in a category,
 * compacting any gaps. Notifies only participants whose table number changed.
 */
export async function publishTableAssignments(categoryId: number) {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		include: { competition: { select: { name: true } } }
	});

	if (!category) throw new CategoryNotFoundError(categoryId);

	const entries = await prisma.entry.findMany({
		where: { categoryId, status: RegistrationStatus.CONFIRMED },
		orderBy: [{ confirmedAt: 'asc' }, { createdAt: 'asc' }],
		select: {
			id: true,
			tableNumber: true,
			creatorId: true,
			users: { select: { id: true, name: true } },
			externalParticipants: { select: { name: true } }
		}
	});

	if (entries.length === 0) {
		return { assignedCount: 0, notifiedCount: 0 };
	}

	// Build a map of previous table numbers for change detection
	const previousTables = new Map(entries.map((r) => [r.id, r.tableNumber]));

	// Reassign table numbers sequentially (compacting any gaps)
	await prisma.$transaction(
		entries.map((record, index) =>
			prisma.entry.update({
				where: { id: record.id },
				data: { tableNumber: index + 1 }
			})
		)
	);

	const entriesWithTables = entries.map((record, index) => ({
		...record,
		tableNumber: index + 1
	}));

	// Only notify users whose table number actually changed
	const changedEntries = entriesWithTables.filter(
		(r) => r.tableNumber !== previousTables.get(r.id)
	);

	if (changedEntries.length > 0) {
		await notifyTableAssignments(changedEntries, category);
	}

	return { assignedCount: entries.length, notifiedCount: changedEntries.length };
}

/**
 * Send payment reminders to all eligible pending-confirmation entries in a category.
 * Respects a cooldown period to avoid spamming participants.
 */
export async function remindPendingPayments(
	categoryId: number,
	options?: { actorName?: string; note?: string }
) {
	const cooldownThreshold = new Date(Date.now() - PAYMENT_REMINDER_COOLDOWN_MS);

	const eligibleEntries = await prisma.entry.findMany({
		where: {
			categoryId,
			status: RegistrationStatus.PENDING_CONFIRMATION,
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
			externalParticipants: { select: { name: true } }
		}
	});

	const totalPending = await prisma.entry.count({
		where: { categoryId, status: RegistrationStatus.PENDING_CONFIRMATION }
	});

	const skippedCount = totalPending - eligibleEntries.length;

	if (eligibleEntries.length === 0) {
		return { remindedCount: 0, skippedCount };
	}

	const now = new Date();
	await prisma.entry.updateMany({
		where: { id: { in: eligibleEntries.map((r) => r.id) } },
		data: { lastRemindedAt: now }
	});

	const remindedCount = await notifyPaymentReminder(
		eligibleEntries,
		options?.actorName,
		options?.note
	);

	return { remindedCount, skippedCount };
}
