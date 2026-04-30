import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus, CompetitionStatus, InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';
import { createNotificationForUsers } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

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
		select: { id: true, status: true, competitionId: true }
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

export async function startCategory(categoryId: number): Promise<CategoryWithCounts> {
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

	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function stopCategory(categoryId: number): Promise<CategoryWithCounts> {
	const category = await findCategoryOrThrow(categoryId);

	if (category.status !== CategoryStatus.LIVE) {
		throw new InvalidStatusTransitionError('Only LIVE categories can be stopped');
	}

	const now = new Date();

	const [updatedCategory, totalRecords, finishedRecords] = await prisma.$transaction([
		prisma.category.update({
			where: { id: categoryId },
			data: {
				realEndTime: now,
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
		realEndTime: updatedCategory.realEndTime?.toISOString() ?? null
	});

	return { ...updatedCategory, totalRecords, finishedRecords };
}

export async function cancelCategory(categoryId: number): Promise<CategoryWithCounts> {
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

export async function restartCategory(categoryId: number): Promise<CategoryWithCounts> {
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

	return { ...updatedCategory, totalRecords, finishedRecords: 0 };
}
