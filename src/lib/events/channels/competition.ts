import { prisma } from '$lib/database/create_prisma_client';
import { InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import type { CompetitionEventState } from '../types';
import crypto from 'node:crypto';

/**
 * Build a CompetitionEventState from pre-fetched category data.
 * Avoids a separate DB round-trip when categories are already loaded.
 */
export function buildEventStateFromCategories(
	categories: Array<{
		id: number;
		status: string;
		totalRecords: number;
		finishedRecords: number;
		realStartTime: Date | string | null;
		realEndTime: Date | string | null;
	}>
): CompetitionEventState {
	const mapped = categories.map((c) => ({
		id: c.id,
		status: c.status,
		totalRecords: c.totalRecords,
		finishedRecords: c.finishedRecords,
		realStartTime: c.realStartTime instanceof Date ? c.realStartTime.toISOString() : (c.realStartTime ?? null),
		realEndTime: c.realEndTime instanceof Date ? c.realEndTime.toISOString() : (c.realEndTime ?? null)
	}));

	const versionPayload = mapped.map(c => `${c.id}:${c.status}:${c.finishedRecords}:${c.totalRecords}`).join('|');
	const version = crypto.createHash('md5').update(versionPayload).digest('hex').slice(0, 12);

	return { version, categories: mapped };
}

export async function resolveCompetitionState(params: { id: number }): Promise<CompetitionEventState> {
	const categories = await prisma.category.findMany({
		where: { competitionId: params.id },
		orderBy: { startTime: 'asc' },
		select: {
			id: true,
			status: true,
			realStartTime: true,
			realEndTime: true,
			_count: {
				select: {
					records: { where: { status: InscriptionStatus.CONFIRMED } }
				}
			}
		}
	});

	const categoryIdList = categories.map(c => c.id);

	// Single grouped query instead of N+1 individual counts
	const finishedGroups = await prisma.record.groupBy({
		by: ['categoryId'],
		where: {
			categoryId: { in: categoryIdList },
			status: InscriptionStatus.CONFIRMED,
			finishTime: { not: null }
		},
		_count: { id: true }
	});

	const finishedMap = new Map(finishedGroups.map(g => [g.categoryId, g._count.id]));

	const enriched = categories.map((cat) => ({
		id: cat.id,
		status: cat.status,
		totalRecords: cat._count.records,
		finishedRecords: finishedMap.get(cat.id) ?? 0,
		realStartTime: cat.realStartTime?.toISOString() ?? null,
		realEndTime: cat.realEndTime?.toISOString() ?? null
	}));

	// Compute version hash from category data
	const versionPayload = enriched.map(c => `${c.id}:${c.status}:${c.finishedRecords}:${c.totalRecords}`).join('|');
	const version = crypto.createHash('md5').update(versionPayload).digest('hex').slice(0, 12);

	return { version, categories: enriched };
}
