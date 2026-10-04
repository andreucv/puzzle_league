import { describe, it, expect, vi, beforeEach } from 'vitest';

import { prismaMock, mockFn } from '$tests/mocks/prisma';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));
vi.mock('$lib/events/server/ably', () => ({
	publishCompetitionEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('$lib/notifications/dispatcher', () => ({
	dispatchNotifications: vi.fn().mockResolvedValue({ persisted: 0, emailed: 0, emailFailures: 0 }),
}));

import { publishTableAssignments, CategoryNotFoundError } from './category-lifecycle';
import { dispatchNotifications } from '$lib/notifications/dispatcher';

const mockCategoryFindUnique = mockFn(prismaMock.category.findUnique);
const mockEntryFindMany = mockFn(prismaMock.entry.findMany);
const mockEntryCount = mockFn(prismaMock.entry.count);
const mockEntryUpdate = mockFn(prismaMock.entry.update);
const mockTransaction = mockFn(prismaMock.$transaction);

// Far enough ahead that the one-hour reminder is still in the future.
const START = new Date(Date.now() + 24 * 60 * 60 * 1000);

describe('publishTableAssignments', () => {
	const scheduler = { publish: vi.fn() };

	beforeEach(() => {
		vi.clearAllMocks();
		scheduler.publish.mockResolvedValue(undefined);
		mockCategoryFindUnique.mockResolvedValue({ id: 1, status: 'NOT_STARTED', startTime: START, tableReminderSentAt: null });
		mockEntryFindMany.mockResolvedValue([{ id: 'b' }, { id: 'a' }, { id: 'c' }]);
		mockEntryCount.mockResolvedValue(3);
		mockEntryUpdate.mockImplementation((args: any) => args);
		mockTransaction.mockResolvedValue([]);
	});

	it('assigns compact table numbers in confirmedAt, createdAt order', async () => {
		const result = await publishTableAssignments(1, { scheduler });

		expect(result).toEqual({ assignedCount: 3 });
		expect(mockEntryFindMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { categoryId: 1, status: 'CONFIRMED' },
			orderBy: [{ confirmedAt: 'asc' }, { createdAt: 'asc' }],
		}));
		expect(mockEntryUpdate.mock.calls.map(([args]: any[]) => [args.where.id, args.data.tableNumber])).toEqual([
			['b', 1],
			['a', 2],
			['c', 3],
		]);
	});

	it('notifies nobody and schedules the one-hour reminder instead', async () => {
		await publishTableAssignments(1, { scheduler });

		expect(dispatchNotifications).not.toHaveBeenCalled();
		expect(scheduler.publish).toHaveBeenCalledWith(1, START);
	});

	it('returns zero and schedules nothing without confirmed entries', async () => {
		mockEntryFindMany.mockResolvedValue([]);

		const result = await publishTableAssignments(1, { scheduler });

		expect(result).toEqual({ assignedCount: 0 });
		expect(scheduler.publish).not.toHaveBeenCalled();
	});

	it('throws when the category does not exist', async () => {
		mockCategoryFindUnique.mockResolvedValue(null);

		await expect(publishTableAssignments(1, { scheduler })).rejects.toBeInstanceOf(CategoryNotFoundError);
	});
});
