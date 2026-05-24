import { prisma } from '$lib/database/create_prisma_client';
import type { Prisma } from '$lib/.prisma/generated/prisma/client';
import { RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Category-scoped entry queries
// ---------------------------------------------------------------------------

interface CategoryEntriesFilter {
	search?: string;
	/** 'true' = only finished, 'false' = only unfinished, undefined = all */
	finished?: 'true' | 'false';
}

/**
 * Fetch confirmed entries for multiple categories in a single DB query.
 * Returns a map of categoryId → entries array.
 */
export async function getBatchedCategoryEntries(categoryIds: number[]) {
	if (categoryIds.length === 0) return new Map<number, any[]>();

	const entries = await prisma.entry.findMany({
		where: {
			categoryId: { in: categoryIds },
			status: RegistrationStatus.CONFIRMED
		},
		include: {
			users: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true
				}
			},
			externalParticipants: {
				select: {
					id: true,
					name: true
				}
			}
		},
		orderBy: [{ finishTime: 'asc' }, { tableNumber: 'asc' }]
	});

	const result = new Map<number, any[]>();
	for (const id of categoryIds) {
		result.set(id, []);
	}
	for (const entry of entries) {
		result.get(entry.categoryId)!.push({
			...entry,
			nPiecesCompleted: entry.nPiecesCompleted
		});
	}
	return result;
}

/**
 * Fetch confirmed entries for a category with optional search and finished filtering.
 * Search matches participant name, external-participant name, table number, or entry ID.
 */
export async function getCategoryEntries(categoryId: number, filter: CategoryEntriesFilter = {}) {
	const { search, finished } = filter;

	const where: Prisma.EntryWhereInput = {
		categoryId,
		status: RegistrationStatus.CONFIRMED
	};

	// Optionally filter by finished status
	if (finished === 'true') {
		where.finishTime = { not: null };
	} else if (finished === 'false') {
		where.finishTime = null;
	}

	if (search) {
		const searchAsInt = parseInt(search);
		const isNumeric = !isNaN(searchAsInt);

		where.AND = [
			// Only show unfinished entries when searching (unless finishedFilter is set)
			...(finished == null ? [{ finishTime: null }] : []),
			{
				OR: [
					// Search by participant name (partial, case-insensitive)
					{
						users: {
							some: {
								name: { contains: search, mode: 'insensitive' }
							}
						}
					},
					// Search by external-participant name (partial, case-insensitive)
					{
						externalParticipants: {
							some: {
								name: { contains: search, mode: 'insensitive' }
							}
						}
					},
					// Search by table number (exact match)
					...(isNumeric ? [{ tableNumber: searchAsInt }] : []),
					// Search by entry ID (exact match)
					{ id: search }
				]
			}
		];
	}

	const entries = await prisma.entry.findMany({
		where,
		include: {
			users: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true
				}
			},
			externalParticipants: {
				select: {
					id: true,
					name: true
				}
			}
		},
		orderBy: [{ finishTime: 'asc' }, { tableNumber: 'asc' }]
	});

	return entries.map((r) => ({
		...r,
		nPiecesCompleted: r.nPiecesCompleted
	}));
}
