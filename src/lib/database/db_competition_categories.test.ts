import { describe, expect, it, vi } from 'vitest';
import { RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';
import { prismaMock } from '$tests/mocks/prisma';

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));

import { getCompetitionCategories } from './db_competition';

describe('getCompetitionCategories', () => {
	it('returns reservedSlots as pending plus confirmed while totalEntries remains confirmed', async () => {
		prismaMock.category.findMany.mockResolvedValue([
			{
				id: 1,
				competitionId: 42,
				description: 'Individual',
				type: 'INDIVIDUAL',
				puzzles: [],
			},
		] as never);
		vi.mocked(prismaMock.entry.groupBy)
			.mockResolvedValueOnce([
				{ categoryId: 1, status: RegistrationStatus.CONFIRMED, _count: 2 },
				{ categoryId: 1, status: RegistrationStatus.PENDING_CONFIRMATION, _count: 3 },
				{ categoryId: 1, status: RegistrationStatus.WAITLISTED, _count: 4 },
			] as never)
			.mockResolvedValueOnce([
				{ categoryId: 1, _count: 1 },
			] as never);

		const result = await getCompetitionCategories(42);

		expect(result[0]).toEqual(expect.objectContaining({
			totalEntries: 2,
			confirmedEntries: 2,
			pendingEntries: 3,
			reservedSlots: 5,
			finishedEntries: 1,
		}));
	});
});
