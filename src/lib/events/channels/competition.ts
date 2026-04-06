import { prisma } from '$lib/database/create_prisma_client';
import { InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import type { CompetitionEventState } from '../types';
import crypto from 'node:crypto';

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

	// Count finished records per category
	const enriched = await Promise.all(
		categories.map(async (cat) => {
			const finishedRecords = await prisma.record.count({
				where: {
					categoryId: cat.id,
					status: InscriptionStatus.CONFIRMED,
					finishTime: { not: null }
				}
			});

			return {
				id: cat.id,
				status: cat.status,
				totalRecords: cat._count.records,
				finishedRecords,
				realStartTime: cat.realStartTime?.toISOString() ?? null,
				realEndTime: cat.realEndTime?.toISOString() ?? null
			};
		})
	);

	// Compute version hash from category data
	const versionPayload = enriched.map(c => `${c.id}:${c.status}:${c.finishedRecords}:${c.totalRecords}`).join('|');
	const version = crypto.createHash('md5').update(versionPayload).digest('hex').slice(0, 12);

	return { version, categories: enriched };
}
