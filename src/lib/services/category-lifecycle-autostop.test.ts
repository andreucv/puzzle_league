import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AutoStopScheduler } from './auto-stop-scheduler';

// Mock all external dependencies of category-lifecycle
vi.mock('$lib/database/create_prisma_client', () => ({
	prisma: {
		category: {
			findUnique: vi.fn(),
			update: vi.fn(),
			count: vi.fn(),
		},
		competition: {
			findUnique: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		entry: {
			count: vi.fn(),
			findMany: vi.fn(),
			updateMany: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

vi.mock('$lib/events/server/ably', () => ({
	publishCompetitionEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/notifications/notifications', () => ({
	createNotificationForUsers: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '$lib/database/create_prisma_client';
import { startCategory, stopCategory, cancelCategory, restartCategory } from './category-lifecycle';

function createMockScheduler(): AutoStopScheduler {
	return {
		scheduleAutoStop: vi.fn().mockResolvedValue(undefined),
		cancelAutoStop: vi.fn().mockResolvedValue(undefined),
		rescheduleAutoStop: vi.fn().mockResolvedValue(undefined),
	};
}

describe('category-lifecycle auto-stop integration', () => {
	let scheduler: ReturnType<typeof createMockScheduler>;

	beforeEach(() => {
		vi.clearAllMocks();
		scheduler = createMockScheduler();

		// Default mock for entry counts
		(prisma.entry.count as any).mockResolvedValue(0);
		(prisma.entry.findMany as any).mockResolvedValue([]);
		(prisma.competition.updateMany as any).mockResolvedValue({ count: 0 });
	});

	describe('startCategory with autoStop', () => {
		it('schedules auto-stop when autoStop option is provided', async () => {
			const deadline = new Date('2026-05-03T15:00:00Z');

			(prisma.category.update as any).mockResolvedValue({
				id: 1,
				competitionId: 42,
				status: 'LIVE',
				realStartTime: new Date(),
				realEndTime: null,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
			});

			await startCategory(1, { autoStop: true, deadline, scheduler });

			expect(scheduler.scheduleAutoStop).toHaveBeenCalledWith(1, 42, deadline);
		});

		it('does not schedule auto-stop when no options provided', async () => {
			(prisma.category.update as any).mockResolvedValue({
				id: 1,
				competitionId: 42,
				status: 'LIVE',
				realStartTime: new Date(),
				realEndTime: null,
			});

			await startCategory(1);

			expect(scheduler.scheduleAutoStop).not.toHaveBeenCalled();
		});
	});

	describe('stopCategory cancels auto-stop', () => {
		it('cancels scheduled auto-stop when stopping a category', async () => {
			(prisma.category.findUnique as any).mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
			});

			(prisma.$transaction as any).mockResolvedValue([
				{ id: 1, competitionId: 42, status: 'STOPPED', realEndTime: new Date() },
				5, // totalEntries
				2, // finishedEntries
			]);

			await stopCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
		});
	});

	describe('cancelCategory cancels auto-stop', () => {
		it('cancels scheduled auto-stop when canceling a category', async () => {
			(prisma.category.findUnique as any).mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
			});

			(prisma.category.update as any).mockResolvedValue({
				id: 1,
				competitionId: 42,
				status: 'CANCELED',
			});

			await cancelCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
		});
	});

	describe('restartCategory cancels and re-schedules auto-stop', () => {
		it('cancels old auto-stop and re-schedules when category has autoStop enabled', async () => {
			(prisma.category.findUnique as any).mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStop: true,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 5,
			});

			(prisma.$transaction as any).mockResolvedValue([
				{ id: 1, competitionId: 42, status: 'LIVE', realStartTime: new Date(), realEndTime: null },
				{ count: 0 }, // record updateMany
			]);

			(prisma.entry.count as any).mockResolvedValue(3);

			await restartCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
			expect(scheduler.scheduleAutoStop).toHaveBeenCalledWith(1, 42, expect.any(Date));
		});

		it('cancels auto-stop but does not re-schedule when category has autoStop disabled', async () => {
			(prisma.category.findUnique as any).mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStop: false,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
			});

			(prisma.$transaction as any).mockResolvedValue([
				{ id: 1, competitionId: 42, status: 'LIVE', realStartTime: new Date(), realEndTime: null },
				{ count: 0 }, // record updateMany
			]);

			(prisma.entry.count as any).mockResolvedValue(3);

			await restartCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
			expect(scheduler.scheduleAutoStop).not.toHaveBeenCalled();
		});
	});
});
