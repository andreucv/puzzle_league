import { prisma } from '$lib/database/create_prisma_client';
import type { Prisma } from '$lib/.prisma/generated/prisma/client';
import { RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Category-scoped record queries
// ---------------------------------------------------------------------------

interface CategoryRecordsFilter {
	search?: string;
	/** 'true' = only finished, 'false' = only unfinished, undefined = all */
	finished?: 'true' | 'false';
}

/**
 * Fetch confirmed records for a category with optional search and finished filtering.
 * Search matches participant name, external-participant name, table number, or record ID.
 */
export async function getCategoryRecords(categoryId: number, filter: CategoryRecordsFilter = {}) {
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
			// Only show unfinished records when searching (unless finishedFilter is set)
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
					// Search by record ID (exact match)
					{ id: search }
				]
			}
		];
	}

	const records = await prisma.entry.findMany({
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

	return records.map((r) => ({
		...r,
		nPiecesCompleted: r.nPiecesCompleted
	}));
}
