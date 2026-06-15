import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCategoryUpdateMany = vi.fn();
const mockEntryFindMany = vi.fn();

vi.mock('$lib/database/create_prisma_client', () => ({
	prisma: {
		competition: {
			findMany: (...args: unknown[]) => mockFindMany(...args),
			update: (...args: unknown[]) => mockUpdate(...args),
		},
		category: {
			updateMany: (...args: unknown[]) => mockCategoryUpdateMany(...args),
		},
		entry: {
			findMany: (...args: unknown[]) => mockEntryFindMany(...args),
		},
	},
}));

const mockDispatch = vi.fn().mockResolvedValue({ persisted: 0, emailed: 0, emailFailures: 0 });

vi.mock('$lib/notifications/dispatcher', () => ({
	dispatchNotifications: (...args: unknown[]) => mockDispatch(...args),
}));

import { autoCancelExpiredCompetitions } from './auto-cancel';

// ── Helpers ──

function makeCompetition(overrides: Partial<{
	id: number;
	name: string;
	creatorId: string;
	categories: Array<{ id: number; status: string }>;
}> = {}) {
	return {
		id: overrides.id ?? 1,
		name: overrides.name ?? 'Test Competition',
		creatorId: overrides.creatorId ?? 'organizer-1',
		categories: overrides.categories ?? [
			{ id: 10, status: 'NOT_STARTED' },
			{ id: 11, status: 'NOT_STARTED' },
		],
	};
}

describe('autoCancelExpiredCompetitions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: no entries, so only organizer gets notified
		mockEntryFindMany.mockResolvedValue([]);
		mockUpdate.mockResolvedValue({});
		mockCategoryUpdateMany.mockResolvedValue({ count: 0 });
	});

	// ── Eligibility ──

	describe('eligibility', () => {
		it('cancels competitions with NOT_STARTED status and endDate in the past', async () => {
			const comp = makeCompetition();
			mockFindMany.mockResolvedValue([comp]);

			const result = await autoCancelExpiredCompetitions();

			expect(result.eligible).toBe(1);
			expect(result.cancelled).toBe(1);
			expect(mockUpdate).toHaveBeenCalledWith({
				where: { id: comp.id },
				data: { status: 'CANCELLED' },
			});
		});

		it('returns empty result when no competitions are eligible', async () => {
			mockFindMany.mockResolvedValue([]);

			const result = await autoCancelExpiredCompetitions();

			expect(result.eligible).toBe(0);
			expect(result.cancelled).toBe(0);
			expect(mockUpdate).not.toHaveBeenCalled();
		});

		it('narrows scan to targeted competitionId but still enforces eligibility', async () => {
			mockFindMany.mockResolvedValue([]);

			const result = await autoCancelExpiredCompetitions({ competitionId: 99 });

			expect(result.eligible).toBe(0);
			// Verify the query included the competitionId filter
			const queryArg = mockFindMany.mock.calls[0][0];
			expect(queryArg.where.id).toBe(99);
		});

		it('cancels targeted competition when it is eligible', async () => {
			const comp = makeCompetition({ id: 42 });
			mockFindMany.mockResolvedValue([comp]);

			const result = await autoCancelExpiredCompetitions({ competitionId: 42 });

			expect(result.cancelled).toBe(1);
			expect(mockUpdate).toHaveBeenCalledWith({
				where: { id: 42 },
				data: { status: 'CANCELLED' },
			});
		});
	});

	// ── Status transitions ──

	describe('status transitions', () => {
		it('sets only NOT_STARTED categories to CANCELED', async () => {
			const comp = makeCompetition({
				categories: [
					{ id: 10, status: 'NOT_STARTED' },
					{ id: 11, status: 'LIVE' },
					{ id: 12, status: 'STOPPED' },
					{ id: 13, status: 'COMPLETE' },
					{ id: 14, status: 'CANCELED' },
				],
			});
			mockFindMany.mockResolvedValue([comp]);

			const result = await autoCancelExpiredCompetitions();

			expect(result.categoriesChanged).toBe(1);
			expect(mockCategoryUpdateMany).toHaveBeenCalledWith({
				where: { id: { in: [10] } },
				data: { status: 'CANCELED' },
			});
		});

		it('does not call category updateMany when no categories are NOT_STARTED', async () => {
			const comp = makeCompetition({
				categories: [{ id: 10, status: 'LIVE' }],
			});
			mockFindMany.mockResolvedValue([comp]);

			await autoCancelExpiredCompetitions();

			expect(mockCategoryUpdateMany).not.toHaveBeenCalled();
		});
	});

	// ── Idempotency ──

	describe('idempotency', () => {
		it('produces no changes when run again (already cancelled competitions are not eligible)', async () => {
			// First run: competition is eligible
			mockFindMany.mockResolvedValue([makeCompetition()]);
			await autoCancelExpiredCompetitions();

			vi.clearAllMocks();
			mockEntryFindMany.mockResolvedValue([]);

			// Second run: query returns nothing (competition status is now CANCELLED, not NOT_STARTED)
			mockFindMany.mockResolvedValue([]);
			const result = await autoCancelExpiredCompetitions();

			expect(result.eligible).toBe(0);
			expect(result.cancelled).toBe(0);
			expect(mockUpdate).not.toHaveBeenCalled();
		});
	});

	// ── Recipient deduplication ──

	describe('recipient deduplication', () => {
		it('deduplicates organizer, entry creators, and entry participants', async () => {
			const comp = makeCompetition({ creatorId: 'user-1' });
			mockFindMany.mockResolvedValue([comp]);
			mockEntryFindMany.mockResolvedValue([
				{ creatorId: 'user-1', users: [{ id: 'user-1' }, { id: 'user-2' }] },
				{ creatorId: 'user-2', users: [{ id: 'user-2' }, { id: 'user-3' }] },
				{ creatorId: 'user-4', users: [{ id: 'user-3' }] },
			]);

			const result = await autoCancelExpiredCompetitions();

			expect(result.recipientsAttempted).toBe(4); // user-1, user-2, user-3, user-4
			const notifyCall = mockDispatch.mock.calls[0];
			const recipientIds = notifyCall[0][0].userIds as string[];
			expect(recipientIds).toHaveLength(4);
			expect(new Set(recipientIds)).toEqual(new Set(['user-1', 'user-2', 'user-3', 'user-4']));
		});

		it('includes only organizer when there are no entries', async () => {
			const comp = makeCompetition({ creatorId: 'org-1' });
			mockFindMany.mockResolvedValue([comp]);
			mockEntryFindMany.mockResolvedValue([]);

			const result = await autoCancelExpiredCompetitions();

			expect(result.recipientsAttempted).toBe(1);
			const recipientIds = mockDispatch.mock.calls[0][0][0].userIds as string[];
			expect(recipientIds).toEqual(['org-1']);
		});
	});

	// ── Notification isolation ──

	describe('notification isolation', () => {
		it('does not rollback cancellation when notification fails', async () => {
			const comp = makeCompetition();
			mockFindMany.mockResolvedValue([comp]);
			mockDispatch.mockRejectedValue(new Error('Notification service down'));

			const result = await autoCancelExpiredCompetitions();

			// Competition was still cancelled
			expect(result.cancelled).toBe(1);
			expect(result.notificationFailures).toBe(1);
			expect(mockUpdate).toHaveBeenCalledWith({
				where: { id: comp.id },
				data: { status: 'CANCELLED' },
			});
		});
	});

	// ── Per-competition failure isolation ──

	describe('per-competition failure isolation', () => {
		it('continues processing after one competition fails', async () => {
			const comp1 = makeCompetition({ id: 1, name: 'Fails' });
			const comp2 = makeCompetition({ id: 2, name: 'Succeeds' });
			mockFindMany.mockResolvedValue([comp1, comp2]);

			// First competition update fails, second succeeds
			mockUpdate
				.mockRejectedValueOnce(new Error('DB error'))
				.mockResolvedValueOnce({});

			const result = await autoCancelExpiredCompetitions();

			expect(result.cancelled).toBe(1);
			expect(result.failed).toBe(1);
			expect(result.failures).toEqual([
				{ competitionId: 1, error: 'DB error' },
			]);
		});
	});

	// ── Dry-run mode ──

	describe('dry-run mode', () => {
		it('returns candidate counts without mutating database state', async () => {
			const comp = makeCompetition({
				categories: [
					{ id: 10, status: 'NOT_STARTED' },
					{ id: 11, status: 'NOT_STARTED' },
					{ id: 12, status: 'LIVE' },
				],
			});
			mockFindMany.mockResolvedValue([comp]);
			mockEntryFindMany.mockResolvedValue([
				{ creatorId: 'user-2', users: [{ id: 'user-2' }] },
			]);

			const result = await autoCancelExpiredCompetitions({ dryRun: true });

			expect(result.eligible).toBe(1);
			expect(result.categoriesChanged).toBe(2);
			expect(result.recipientsAttempted).toBe(2); // organizer-1 + user-2
			// No mutations occurred
			expect(mockUpdate).not.toHaveBeenCalled();
			expect(mockCategoryUpdateMany).not.toHaveBeenCalled();
			expect(mockDispatch).not.toHaveBeenCalled();
		});
	});

	// ── Notification uses auto-cancel keys ──

	describe('notification content', () => {
		it('uses auto-cancel-specific translation keys', async () => {
			const comp = makeCompetition({ id: 5, name: 'Speed Cup' });
			mockFindMany.mockResolvedValue([comp]);

			await autoCancelExpiredCompetitions();

			expect(mockDispatch).toHaveBeenCalledWith([
				expect.objectContaining({
					userIds: expect.any(Array),
					type: 'COMPETITION_CANCELLED',
					title: 'notifications.titles.competition_auto_cancelled',
					message: 'notifications.messages.competition_auto_cancelled',
					link: '/competitions/competition_details/5',
					data: { competitionName: 'Speed Cup' },
				}),
			]);
		});
	});
});
