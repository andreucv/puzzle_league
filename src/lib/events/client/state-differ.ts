import type { CompetitionEventState } from '../types';

export type CompetitionChange =
	| { type: 'category_started'; categoryId: number }
	| { type: 'category_stopped'; categoryId: number }
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

		if (prevCat.status !== 'in_progress' && cat.status === 'in_progress') {
			changes.push({ type: 'category_started', categoryId: cat.id });
		}

		if (prevCat.status === 'in_progress' && cat.status === 'completed') {
			changes.push({ type: 'category_stopped', categoryId: cat.id });
		}

		if (cat.finishedRecords > prevCat.finishedRecords) {
			changes.push({
				type: 'new_finishes',
				categoryId: cat.id,
				count: cat.finishedRecords - prevCat.finishedRecords
			});
		}
	}

	return changes;
}
