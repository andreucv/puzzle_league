import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: {} }));

import { handleCategoryFollowersWebhook } from './category-followers-webhook';

const NOW = new Date('2026-10-02T10:00:00.000Z');

function makeDb() {
	return {
		category: { findUnique: vi.fn() },
		categoryFollow: {
			findMany: vi.fn().mockResolvedValue([]),
			updateMany: vi.fn().mockResolvedValue({ count: 0 }),
		},
		entry: { findMany: vi.fn().mockResolvedValue([]) },
	};
}

function makeCategory(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		type: 'INDIVIDUAL',
		subname: 'Elite',
		status: 'NOT_STARTED',
		registrationOpen: true,
		competitionId: 42,
		competition: { name: 'Speed Cup' },
		...overrides,
	};
}

describe('category-followers webhook handler', () => {
	let db: ReturnType<typeof makeDb>;
	const receiver = { verify: vi.fn() };
	const dispatch = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		db = makeDb();
		receiver.verify.mockResolvedValue(true);
		db.category.findUnique.mockResolvedValue(makeCategory());
	});

	function call() {
		return handleCategoryFollowersWebhook({
			signature: 'sig',
			body: JSON.stringify({ categoryId: 1 }),
			receiver: receiver as any,
			db: db as any,
			dispatchNotifications: dispatch,
			now: NOW,
		});
	}

	it('rejects an invalid signature with 401', async () => {
		receiver.verify.mockResolvedValue(false);

		const result = await call();

		expect(result.status).toBe(401);
		expect(db.category.findUnique).not.toHaveBeenCalled();
	});

	it.each([
		['closed again', { registrationOpen: false }],
		['started', { status: 'LIVE' }],
	])('is a no-op when the category is %s, leaving follows pending', async (_label, overrides) => {
		db.category.findUnique.mockResolvedValue(makeCategory(overrides));

		const result = await call();

		expect(result.status).toBe(200);
		expect(db.categoryFollow.findMany).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
		expect(db.categoryFollow.updateMany).not.toHaveBeenCalled();
	});

	it('does nothing when there are no pending followers', async () => {
		const result = await call();

		expect(result.body.notifiedCount).toBe(0);
		expect(dispatch).not.toHaveBeenCalled();
		expect(db.categoryFollow.updateMany).not.toHaveBeenCalled();
	});

	it('notifies pending followers, then marks exactly those follows notified', async () => {
		db.categoryFollow.findMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);

		const result = await call();

		expect(db.categoryFollow.findMany).toHaveBeenCalledWith({ where: { categoryId: 1, notifiedAt: null }, select: { userId: true } });
		expect(dispatch).toHaveBeenCalledWith([
			expect.objectContaining({
				userIds: ['u1', 'u2'],
				type: 'CATEGORY_REGISTRATION_OPENED',
				link: '/competitions/competition_details/42/registration',
				data: { competitionName: 'Speed Cup', categoryName: '@:category_names.individual - Elite' },
			}),
		]);
		expect(db.categoryFollow.updateMany).toHaveBeenCalledWith({
			where: { categoryId: 1, userId: { in: ['u1', 'u2'] }, notifiedAt: null },
			data: { notifiedAt: NOW },
		});
		expect(dispatch.mock.invocationCallOrder[0]).toBeLessThan(db.categoryFollow.updateMany.mock.invocationCallOrder[0]);
		expect(result.body.notifiedCount).toBe(2);
	});

	it('skips followers who registered meanwhile but still marks them', async () => {
		db.categoryFollow.findMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
		db.entry.findMany.mockResolvedValue([{ creatorId: 'u1', users: [{ id: 'u1' }] }]);

		await call();

		expect(dispatch).toHaveBeenCalledWith([expect.objectContaining({ userIds: ['u2'] })]);
		expect(db.categoryFollow.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.objectContaining({ userId: { in: ['u1', 'u2'] } }) }),
		);
	});

	it('marks without dispatching when every follower already registered', async () => {
		db.categoryFollow.findMany.mockResolvedValue([{ userId: 'u1' }]);
		db.entry.findMany.mockResolvedValue([{ creatorId: 'u1', users: [] }]);

		const result = await call();

		expect(dispatch).not.toHaveBeenCalled();
		expect(db.categoryFollow.updateMany).toHaveBeenCalled();
		expect(result.body.notifiedCount).toBe(0);
	});
});
