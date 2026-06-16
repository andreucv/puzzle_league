import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AutoStopScheduler } from './auto-stop-scheduler';

// Mock all external dependencies of category-lifecycle
import { prismaMock, mockFn } from '$tests/mocks/prisma';

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));

vi.mock('$lib/events/server/ably', () => ({
	publishCompetitionEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/notifications/dispatcher', () => ({
	dispatchNotifications: vi.fn().mockResolvedValue({ persisted: 0, emailed: 0, emailFailures: 0 }),
}));

import { startCategory, stopCategory, cancelCategory, restartCategory, resumeCategory, setAutoStop, InvalidStatusTransitionError } from './category-lifecycle';

const mockCategoryFindUnique = mockFn(prismaMock.category.findUnique);
const mockCategoryUpdate = mockFn(prismaMock.category.update);
const mockEntryCount = mockFn(prismaMock.entry.count);
const mockEntryFindMany = mockFn(prismaMock.entry.findMany);
const mockCompetitionUpdateMany = mockFn(prismaMock.competition.updateMany);
const mockTransaction = mockFn(prismaMock.$transaction);

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
		scheduler = createMockScheduler();

		// Default mock for entry counts
		mockEntryCount.mockResolvedValue(0);
		mockEntryFindMany.mockResolvedValue([]);
		mockCompetitionUpdateMany.mockResolvedValue({ count: 0 });
	});

	describe('startCategory with autoStop', () => {
		it('schedules auto-stop when autoStop option is provided', async () => {
			const deadline = new Date('2026-05-03T15:00:00Z');

			mockCategoryUpdate.mockResolvedValue({
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
			mockCategoryUpdate.mockResolvedValue({
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

	describe('stopCategory leaves auto-stop scheduled', () => {
		it('does NOT cancel the scheduled auto-stop when stopping a category', async () => {
			// Stop intentionally leaves the QStash message; the webhook is idempotent for
			// non-LIVE categories, so intent (autoStopMessageId) survives stop → resume.
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
				autoStopMessageId: 'msg_1',
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
				realStartTime: new Date('2026-05-03T14:00:00Z'),
				realEndTime: null,
			});

			mockTransaction.mockResolvedValue([
				{ id: 1, competitionId: 42, status: 'STOPPED', realEndTime: new Date() },
				5, // totalEntries
				2, // finishedEntries
			]);

			await stopCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).not.toHaveBeenCalled();
		});
	});

	describe('cancelCategory cancels auto-stop', () => {
		it('cancels scheduled auto-stop when canceling a category', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
			});

			mockCategoryUpdate.mockResolvedValue({
				id: 1,
				competitionId: 42,
				status: 'CANCELED',
			});

			await cancelCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
		});
	});

	describe('restartCategory cancels and re-schedules auto-stop', () => {
		it('cancels old auto-stop and re-schedules when category was armed', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStopMessageId: 'msg_1',
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 5,
			});

			mockTransaction.mockResolvedValue([
				{ id: 1, competitionId: 42, status: 'LIVE', realStartTime: new Date(), realEndTime: null },
				{ count: 0 }, // record updateMany
			]);

			mockEntryCount.mockResolvedValue(3);

			await restartCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
			expect(scheduler.scheduleAutoStop).toHaveBeenCalledWith(1, 42, expect.any(Date));
		});

		it('cancels auto-stop but does not re-schedule when category was not armed', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStopMessageId: null,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
			});

			mockTransaction.mockResolvedValue([
				{ id: 1, competitionId: 42, status: 'LIVE', realStartTime: new Date(), realEndTime: null },
				{ count: 0 }, // record updateMany
			]);

			mockEntryCount.mockResolvedValue(3);

			await restartCategory(1, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
			expect(scheduler.scheduleAutoStop).not.toHaveBeenCalled();
		});
	});

	describe('setAutoStop', () => {
		it('schedules auto-stop when enabling on a LIVE category with time left', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
				autoStopMessageId: null,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
				realStartTime: new Date(Date.now() - 10 * 60_000), // started 10 min ago, 1h duration
				realEndTime: null,
			});

			const result = await setAutoStop(1, true, { scheduler });

			expect(scheduler.scheduleAutoStop).toHaveBeenCalledWith(1, 42, expect.any(Date));
			expect(result).toEqual({ armed: true });
		});

		it('cancels auto-stop when disabling on a LIVE category', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
				autoStopMessageId: 'msg_1',
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
				realStartTime: new Date(Date.now() - 10 * 60_000),
				realEndTime: null,
			});

			const result = await setAutoStop(1, false, { scheduler });

			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
			expect(scheduler.scheduleAutoStop).not.toHaveBeenCalled();
			expect(result).toEqual({ armed: false });
		});

		it('rejects enabling when no time remains', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'LIVE',
				competitionId: 42,
				autoStopMessageId: null,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
				realStartTime: new Date(Date.now() - 2 * 60 * 60_000), // started 2h ago, 1h duration → past deadline
				realEndTime: null,
			});

			await expect(setAutoStop(1, true, { scheduler })).rejects.toBeInstanceOf(InvalidStatusTransitionError);
			expect(scheduler.scheduleAutoStop).not.toHaveBeenCalled();
		});

		it('rejects toggling on a non-LIVE category', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStopMessageId: null,
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'),
				extraMinutes: 0,
				realStartTime: new Date(),
				realEndTime: new Date(),
			});

			await expect(setAutoStop(1, true, { scheduler })).rejects.toBeInstanceOf(InvalidStatusTransitionError);
		});
	});

	describe('resumeCategory re-arms auto-stop', () => {
		it('reschedules with the paused time when armed and time remains', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStopMessageId: 'msg_1',
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'), // 1h duration
				extraMinutes: 0,
				realStartTime: new Date(Date.now() - 30 * 60_000), // started 30 min ago
				realEndTime: new Date(), // stopped now → 30 min remaining
			});
			mockCategoryUpdate.mockResolvedValue({
				id: 1, competitionId: 42, status: 'LIVE', realStartTime: new Date(), realEndTime: null,
			});

			await resumeCategory(1, { scheduler });

			expect(scheduler.rescheduleAutoStop).toHaveBeenCalledWith(1, 42, expect.any(Date));
		});

		it('does not re-arm when no time remains', async () => {
			mockCategoryFindUnique.mockResolvedValue({
				id: 1,
				status: 'STOPPED',
				competitionId: 42,
				autoStopMessageId: 'msg_1',
				startTime: new Date('2026-05-03T14:00:00Z'),
				endTime: new Date('2026-05-03T15:00:00Z'), // 1h duration
				extraMinutes: 0,
				realStartTime: new Date(Date.now() - 2 * 60 * 60_000), // started 2h ago → deadline passed
				realEndTime: new Date(),
			});
			mockCategoryUpdate.mockResolvedValue({
				id: 1, competitionId: 42, status: 'LIVE', realStartTime: new Date(), realEndTime: null,
			});

			await resumeCategory(1, { scheduler });

			expect(scheduler.rescheduleAutoStop).not.toHaveBeenCalled();
			expect(scheduler.cancelAutoStop).toHaveBeenCalledWith(1);
		});
	});
});
