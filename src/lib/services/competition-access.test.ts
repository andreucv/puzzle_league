import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '$prisma/enums';
import { prismaMock, mockFn } from '$tests/mocks/prisma';

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock, accelerateEnabled: false }));

const mockCompetitionFindUnique = mockFn(prismaMock.competition.findUnique);
const mockRoleAssignmentFindFirst = mockFn(prismaMock.roleAssignment.findFirst);
const mockCompetitionCoorganizerRoleAssignmentFindFirst = mockFn(prismaMock.competitionCoorganizerRoleAssignment.findFirst);
const mockCategoryJudgeAssignmentFindMany = mockFn(prismaMock.categoryJudgeAssignment.findMany);
const mockCategoryFindUnique = mockFn(prismaMock.category.findUnique);
const mockEntryFindUnique = mockFn(prismaMock.entry.findUnique);

import {
	getCompetitionAccess,
	requireCompetitionOrganizer,
	requireCategoryJudge,
	requireEntryJudge,
} from './competition-access';

beforeEach(() => {
	// Defaults: no access
	mockCompetitionFindUnique.mockResolvedValue({ creatorId: 'other-user' });
	mockRoleAssignmentFindFirst.mockResolvedValue(null);
	mockCompetitionCoorganizerRoleAssignmentFindFirst.mockResolvedValue(null);
	mockCategoryJudgeAssignmentFindMany.mockResolvedValue([]);
});

describe('getCompetitionAccess', () => {
	it('returns isCreator=true when user is the competition creator', async () => {
		mockCompetitionFindUnique.mockResolvedValue({ creatorId: 'user-1' });

		const result = await getCompetitionAccess(1, 'user-1');

		expect(result.isCreator).toBe(true);
		expect(result.canManageCompetition).toBe(true);
	});

	it('returns isAdmin=true and canManageCompetition=true when user is a global ADMIN', async () => {
		mockRoleAssignmentFindFirst.mockResolvedValue({ id: 'ra-1' });

		const result = await getCompetitionAccess(1, 'admin-user');

		expect(result.isAdmin).toBe(true);
		expect(result.canManageCompetition).toBe(true);
		expect(result.isCreator).toBe(false);
	});

	it('returns isCoorganizer=true for scoped competition co-organizer', async () => {
		mockCompetitionCoorganizerRoleAssignmentFindFirst.mockResolvedValue({ id: 'cra-1' });

		const result = await getCompetitionAccess(1, 'scoped-org');

		expect(result.isCoorganizer).toBe(true);
		expect(result.canManageCompetition).toBe(true);
		expect(result.isCreator).toBe(false);
		expect(result.isAdmin).toBe(false);
	});

	it('returns isJudge=true with judgedCategoryIds when user judges categories', async () => {
		mockCategoryJudgeAssignmentFindMany.mockResolvedValue([{ categoryId: 10 }, { categoryId: 20 }]);

		const result = await getCompetitionAccess(1, 'judge-user');

		expect(result.isJudge).toBe(true);
		expect(result.judgedCategoryIds).toEqual([10, 20]);
		expect(result.canManageCompetition).toBe(false);
	});

	it('returns all false for a user with no access', async () => {
		const result = await getCompetitionAccess(1, 'random-user');

		expect(result.isCreator).toBe(false);
		expect(result.isAdmin).toBe(false);
		expect(result.canManageCompetition).toBe(false);
		expect(result.isJudge).toBe(false);
		expect(result.judgedCategoryIds).toEqual([]);
	});

	it('returns canManageCompetition=false for a global ORGANIZER who does not own the competition', async () => {
		// Global ORGANIZER role exists but is not sufficient for competition-level access
		// (global ORGANIZER only means "can create competitions", not "can manage any competition")
		const result = await getCompetitionAccess(1, 'global-org');

		expect(result.canManageCompetition).toBe(false);
	});
});

describe('requireCompetitionOrganizer', () => {
	it('returns access when user is creator', async () => {
		mockCompetitionFindUnique.mockResolvedValue({ creatorId: 'user-1' });

		const access = await requireCompetitionOrganizer(1, 'user-1');

		expect(access.canManageCompetition).toBe(true);
	});

	it('throws 403 Response when user has no organizer access', async () => {
		try {
			await requireCompetitionOrganizer(1, 'random-user');
			expect.fail('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(Response);
			expect((e as Response).status).toBe(403);
		}
	});
});

describe('requireCategoryJudge', () => {
	it('grants access when user is directly assigned as category judge', async () => {
		mockCategoryFindUnique.mockResolvedValue({
			competitionId: 1,
			judgeAssignments: [{ id: 'ja-1' }],
		});
		mockCompetitionFindUnique.mockResolvedValue({ creatorId: 'other' });
		// getCompetitionAccess also queries judged categories across the competition
		mockCategoryJudgeAssignmentFindMany.mockResolvedValue([{ categoryId: 10 }]);

		const access = await requireCategoryJudge(10, 'judge-user');

		expect(access.isJudge).toBe(true);
	});

	it('grants access when user is organizer even without judge assignment', async () => {
		mockCategoryFindUnique.mockResolvedValue({
			competitionId: 1,
			judgeAssignments: [],
		});
		mockCompetitionFindUnique.mockResolvedValue({ creatorId: 'org-user' });

		const access = await requireCategoryJudge(10, 'org-user');

		expect(access.canManageCompetition).toBe(true);
	});

	it('throws 404 when category does not exist', async () => {
		mockCategoryFindUnique.mockResolvedValue(null);

		try {
			await requireCategoryJudge(999, 'user-1');
			expect.fail('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(Response);
			expect((e as Response).status).toBe(404);
		}
	});

	it('throws 403 when user is neither judge nor organizer', async () => {
		mockCategoryFindUnique.mockResolvedValue({
			competitionId: 1,
			judgeAssignments: [],
		});

		try {
			await requireCategoryJudge(10, 'random-user');
			expect.fail('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(Response);
			expect((e as Response).status).toBe(403);
		}
	});
});

describe('requireEntryJudge', () => {
	it('delegates to requireCategoryJudge via entry lookup', async () => {
		mockEntryFindUnique.mockResolvedValue({ categoryId: 10 });
		mockCategoryFindUnique.mockResolvedValue({
			competitionId: 1,
			judgeAssignments: [{ id: 'ja-1' }],
		});
		mockCompetitionFindUnique.mockResolvedValue({ creatorId: 'other' });
		mockCategoryJudgeAssignmentFindMany.mockResolvedValue([{ categoryId: 10 }]);

		const access = await requireEntryJudge('entry-1', 'judge-user');

		expect(access.isJudge).toBe(true);
	});

	it('throws 404 when entry does not exist', async () => {
		mockEntryFindUnique.mockResolvedValue(null);

		try {
			await requireEntryJudge('nonexistent', 'user-1');
			expect.fail('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(Response);
			expect((e as Response).status).toBe(404);
		}
	});
});
