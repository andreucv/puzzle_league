import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──

const mockFindMany = vi.fn();

vi.mock('$lib/database/create_prisma_client', () => ({
	prisma: {
		competition: {
			findMany: (...args: unknown[]) => mockFindMany(...args),
		},
	},
}));

import { getOtherUpcomingCompetitions } from './db_competition';

// ── Helpers ──

function makeCompetition(overrides: Partial<{
	id: number;
	name: string;
	startDate: Date;
	status: string;
}> = {}) {
	return {
		id: overrides.id ?? 1,
		name: overrides.name ?? 'Test Competition',
		startDate: overrides.startDate ?? new Date('2026-07-01'),
		status: overrides.status ?? 'NOT_STARTED',
		categories: [],
	};
}

describe('getOtherUpcomingCompetitions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('passes correct where clause including NOT_STARTED and STARTED statuses', async () => {
		mockFindMany.mockResolvedValue([]);

		await getOtherUpcomingCompetitions('user-1', 10, 0);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					status: { in: ['NOT_STARTED', 'STARTED'] },
				}),
			})
		);
	});

	it('excludes competitions where the user has an Entry via NOT clause', async () => {
		mockFindMany.mockResolvedValue([]);

		await getOtherUpcomingCompetitions('user-1', 10, 0);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					NOT: {
						categories: {
							some: {
								entries: {
									some: {
										users: { some: { id: 'user-1' } }
									}
								}
							}
						}
					}
				}),
			})
		);
	});

	it('orders by startDate ascending with id as tie-breaker', async () => {
		mockFindMany.mockResolvedValue([]);

		await getOtherUpcomingCompetitions('user-1', 10, 0);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: [
					{ startDate: 'asc' },
					{ id: 'asc' },
				],
			})
		);
	});

	it('applies limit and offset for pagination', async () => {
		mockFindMany.mockResolvedValue([]);

		await getOtherUpcomingCompetitions('user-1', 10, 20);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				take: 10,
				skip: 20,
			})
		);
	});

	it('returns competitions from Prisma', async () => {
		const competitions = [
			makeCompetition({ id: 1, startDate: new Date('2026-06-01') }),
			makeCompetition({ id: 2, startDate: new Date('2026-07-01') }),
		];
		mockFindMany.mockResolvedValue(competitions);

		const result = await getOtherUpcomingCompetitions('user-1', 10, 0);

		expect(result).toEqual(competitions);
		expect(result).toHaveLength(2);
	});

	it('includes categories with the reserved-slot count (confirmed + pending)', async () => {
		mockFindMany.mockResolvedValue([]);

		await getOtherUpcomingCompetitions('user-1', 10, 0);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				include: {
					categories: {
						include: {
							_count: {
								select: {
									entries: { where: { status: { in: ['CONFIRMED', 'PENDING_CONFIRMATION'] } } }
								}
							}
						}
					}
				},
			})
		);
	});

	it('returns empty array when no competitions match', async () => {
		mockFindMany.mockResolvedValue([]);

		const result = await getOtherUpcomingCompetitions('user-1', 10, 0);

		expect(result).toEqual([]);
	});
});
