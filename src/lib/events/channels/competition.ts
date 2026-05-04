import { prisma } from '$lib/database/create_prisma_client';
import { RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';
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
		totalEntries: number;
		finishedEntries: number;
		realStartTime: Date | string | null;
		realEndTime: Date | string | null;
		extraMinutes?: number;
		autoStop?: boolean;
	}>
): CompetitionEventState {
	const mapped = categories.map((c) => ({
		id: c.id,
		status: c.status,
		totalEntries: c.totalEntries,
		finishedEntries: c.finishedEntries,
		realStartTime: c.realStartTime instanceof Date ? c.realStartTime.toISOString() : (c.realStartTime ?? null),
		realEndTime: c.realEndTime instanceof Date ? c.realEndTime.toISOString() : (c.realEndTime ?? null),
		extraMinutes: c.extraMinutes ?? 0,
		autoStop: c.autoStop ?? false
	}));

	const versionPayload = mapped.map(c => `${c.id}:${c.status}:${c.finishedEntries}:${c.totalEntries}`).join('|');
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
			extraMinutes: true,
			autoStop: true,
			_count: {
				select: {
					entries: { where: { status: RegistrationStatus.CONFIRMED } }
				}
			}
		}
	});

	const categoryIdList = categories.map(c => c.id);

	// Single grouped query instead of N+1 individual counts
	const finishedGroups = await prisma.entry.groupBy({
		by: ['categoryId'],
		where: {
			categoryId: { in: categoryIdList },
			status: RegistrationStatus.CONFIRMED,
			finishTime: { not: null }
		},
		_count: { id: true }
	});

	const finishedMap = new Map(finishedGroups.map(g => [g.categoryId, g._count.id]));

	const enriched = categories.map((cat) => ({
		id: cat.id,
		status: cat.status,
		totalEntries: cat._count.entries,
		finishedEntries: finishedMap.get(cat.id) ?? 0,
		realStartTime: cat.realStartTime?.toISOString() ?? null,
		realEndTime: cat.realEndTime?.toISOString() ?? null,
		extraMinutes: cat.extraMinutes,
		autoStop: cat.autoStop
	}));

	// Compute version hash from category data
	const versionPayload = enriched.map(c => `${c.id}:${c.status}:${c.finishedEntries}:${c.totalEntries}`).join('|');
	const version = crypto.createHash('md5').update(versionPayload).digest('hex').slice(0, 12);

	return { version, categories: enriched };
}
