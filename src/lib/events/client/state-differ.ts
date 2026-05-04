import type { CompetitionEventState } from '../types';

export type CompetitionChange =
	| { type: 'category_started'; categoryId: number }
	| { type: 'category_stopped'; categoryId: number }
	| { type: 'category_completed'; categoryId: number }
	| { type: 'category_resumed'; categoryId: number }
	| { type: 'category_canceled'; categoryId: number }
	| { type: 'category_restarted'; categoryId: number; newStatus: string }
	| { type: 'new_finishes'; categoryId: number; count: number };

export function diffCompetitionState(
	prev: CompetitionEventState | null,
	next: CompetitionEventState
): CompetitionChange[] {
	if (!prev) return [];

	const changes: CompetitionChange[] = [];
	const prevMap = new Map(prev.categories.map(c => [c.id, c]));

	for (const cat of next.categories) {
		const prevCat = prevMap.get(cat.id);
		if (!prevCat) continue;

		// Status transitions
		if (prevCat.status !== cat.status) {
			// NOT_STARTED → LIVE (start)
			if (prevCat.status === 'NOT_STARTED' && cat.status === 'LIVE') {
				changes.push({ type: 'category_started', categoryId: cat.id });
			}
			// STOPPED → LIVE (resume)
			else if (prevCat.status === 'STOPPED' && cat.status === 'LIVE') {
				changes.push({ type: 'category_resumed', categoryId: cat.id });
			}
			// LIVE → STOPPED (stop)
			else if (prevCat.status === 'LIVE' && cat.status === 'STOPPED') {
				changes.push({ type: 'category_stopped', categoryId: cat.id });
			}
			// STOPPED → COMPLETE (complete)
			else if (prevCat.status === 'STOPPED' && cat.status === 'COMPLETE') {
				changes.push({ type: 'category_completed', categoryId: cat.id });
			}
			// LIVE → COMPLETE (direct complete)
			else if (prevCat.status === 'LIVE' && cat.status === 'COMPLETE') {
				changes.push({ type: 'category_completed', categoryId: cat.id });
			}
			// Any → CANCELED
			else if (cat.status === 'CANCELED') {
				changes.push({ type: 'category_canceled', categoryId: cat.id });
			}
			// COMPLETE/CANCELED → LIVE or NOT_STARTED (restart)
			else if ((prevCat.status === 'COMPLETE' || prevCat.status === 'CANCELED') &&
				(cat.status === 'LIVE' || cat.status === 'NOT_STARTED')) {
				changes.push({ type: 'category_restarted', categoryId: cat.id, newStatus: cat.status });
			}
		}

		// Record progress
		if (cat.finishedEntries > prevCat.finishedEntries) {
			changes.push({
				type: 'new_finishes',
				categoryId: cat.id,
				count: cat.finishedEntries - prevCat.finishedEntries
			});
		}
	}

	return changes;
}
