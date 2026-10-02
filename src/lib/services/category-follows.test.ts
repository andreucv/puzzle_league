import { describe, it, expect, vi } from 'vitest';
import { prismaMock, mockFn } from '$tests/mocks/prisma';

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock, accelerateEnabled: false }));
vi.mock('$lib/notifications/dispatcher', () => ({ dispatchNotifications: vi.fn() }));

import { followCategory, unfollowCategory, userIdsWithEntryInCategory } from './category-follows';

const mockCategoryFindUnique = mockFn(prismaMock.category.findUnique);
const mockEntryFindMany = mockFn(prismaMock.entry.findMany);
const mockFollowUpsert = mockFn(prismaMock.categoryFollow.upsert);
const mockFollowDeleteMany = mockFn(prismaMock.categoryFollow.deleteMany);

describe('followCategory', () => {
	it('upserts the follow and re-arms a notified one', async () => {
		mockCategoryFindUnique.mockResolvedValue({ status: 'NOT_STARTED', registrationOpen: false });
		mockEntryFindMany.mockResolvedValue([]);

		await followCategory({ categoryId: 7, userId: 'u1' });

		expect(mockFollowUpsert).toHaveBeenCalledWith({
			where: { userId_categoryId: { userId: 'u1', categoryId: 7 } },
			create: { userId: 'u1', categoryId: 7 },
			update: { notifiedAt: null },
		});
	});

	it('rejects an unknown category', async () => {
		mockCategoryFindUnique.mockResolvedValue(null);

		await expect(followCategory({ categoryId: 7, userId: 'u1' })).rejects.toMatchObject({ code: 'ENTRY_NOT_FOUND' });
		expect(mockFollowUpsert).not.toHaveBeenCalled();
	});

	it('rejects an open category', async () => {
		mockCategoryFindUnique.mockResolvedValue({ status: 'NOT_STARTED', registrationOpen: true });

		await expect(followCategory({ categoryId: 7, userId: 'u1' })).rejects.toMatchObject({ code: 'INVALID_STATUS' });
		expect(mockFollowUpsert).not.toHaveBeenCalled();
	});

	it('rejects a started category', async () => {
		mockCategoryFindUnique.mockResolvedValue({ status: 'LIVE', registrationOpen: false });

		await expect(followCategory({ categoryId: 7, userId: 'u1' })).rejects.toMatchObject({ code: 'INVALID_STATUS' });
	});

	it('rejects a user who already holds an entry in the category', async () => {
		mockCategoryFindUnique.mockResolvedValue({ status: 'NOT_STARTED', registrationOpen: false });
		mockEntryFindMany.mockResolvedValue([{ creatorId: 'other', users: [{ id: 'u1' }] }]);

		await expect(followCategory({ categoryId: 7, userId: 'u1' })).rejects.toMatchObject({ code: 'INVALID_STATUS' });
		expect(mockFollowUpsert).not.toHaveBeenCalled();
	});
});

describe('unfollowCategory', () => {
	it('deletes the follow (idempotent deleteMany)', async () => {
		await unfollowCategory({ categoryId: 7, userId: 'u1' });

		expect(mockFollowDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', categoryId: 7 } });
	});
});

describe('userIdsWithEntryInCategory', () => {
	it('returns only the requested users found as creator or party member', async () => {
		mockEntryFindMany.mockResolvedValue([
			{ creatorId: 'u1', users: [{ id: 'u1' }, { id: 'stranger' }] },
			{ creatorId: 'stranger', users: [{ id: 'u2' }] },
		]);

		const found = await userIdsWithEntryInCategory(prismaMock, 7, ['u1', 'u2', 'u3']);

		expect([...found].sort()).toEqual(['u1', 'u2']);
	});

	it('skips the query for an empty list', async () => {
		const found = await userIdsWithEntryInCategory(prismaMock, 7, []);

		expect(found.size).toBe(0);
		expect(mockEntryFindMany).not.toHaveBeenCalled();
	});
});
