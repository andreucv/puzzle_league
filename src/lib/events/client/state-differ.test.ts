import { describe, it, expect } from 'vitest';
import { diffCompetitionState } from './state-differ';
import type { CompetitionEventState } from '../types';

function makeState(categories: Array<{ id: number; status: string; finishedEntries?: number }>): CompetitionEventState {
	return {
		version: 'test',
		categories: categories.map(c => ({
			id: c.id,
			status: c.status,
			totalEntries: 5,
			finishedEntries: c.finishedEntries ?? 0,
			realStartTime: null,
			realEndTime: null,
			extraMinutes: 0,
			autoStop: false,
		})),
	};
}

describe('diffCompetitionState', () => {
	it('returns empty when prev is null', () => {
		expect(diffCompetitionState(null, makeState([{ id: 1, status: 'LIVE' }]))).toEqual([]);
	});

	it('detects NOT_STARTED → LIVE (start)', () => {
		const prev = makeState([{ id: 1, status: 'NOT_STARTED' }]);
		const next = makeState([{ id: 1, status: 'LIVE' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_started', categoryId: 1 }]);
	});

	it('detects LIVE → STOPPED (stop)', () => {
		const prev = makeState([{ id: 1, status: 'LIVE' }]);
		const next = makeState([{ id: 1, status: 'STOPPED' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_stopped', categoryId: 1 }]);
	});

	it('detects STOPPED → LIVE (resume)', () => {
		const prev = makeState([{ id: 1, status: 'STOPPED' }]);
		const next = makeState([{ id: 1, status: 'LIVE' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_resumed', categoryId: 1 }]);
	});

	it('detects STOPPED → COMPLETE (complete)', () => {
		const prev = makeState([{ id: 1, status: 'STOPPED' }]);
		const next = makeState([{ id: 1, status: 'COMPLETE' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_completed', categoryId: 1 }]);
	});

	it('detects LIVE → COMPLETE (direct complete)', () => {
		const prev = makeState([{ id: 1, status: 'LIVE' }]);
		const next = makeState([{ id: 1, status: 'COMPLETE' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_completed', categoryId: 1 }]);
	});

	it('detects any → CANCELED', () => {
		const prev = makeState([{ id: 1, status: 'LIVE' }]);
		const next = makeState([{ id: 1, status: 'CANCELED' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_canceled', categoryId: 1 }]);
	});

	it('detects COMPLETE → LIVE (restart)', () => {
		const prev = makeState([{ id: 1, status: 'COMPLETE' }]);
		const next = makeState([{ id: 1, status: 'LIVE' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_restarted', categoryId: 1, newStatus: 'LIVE' }]);
	});

	it('detects CANCELED → NOT_STARTED (restart)', () => {
		const prev = makeState([{ id: 1, status: 'CANCELED' }]);
		const next = makeState([{ id: 1, status: 'NOT_STARTED' }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'category_restarted', categoryId: 1, newStatus: 'NOT_STARTED' }]);
	});

	it('detects new finishes', () => {
		const prev = makeState([{ id: 1, status: 'LIVE', finishedEntries: 2 }]);
		const next = makeState([{ id: 1, status: 'LIVE', finishedEntries: 4 }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toEqual([{ type: 'new_finishes', categoryId: 1, count: 2 }]);
	});

	it('detects status change + new finishes together', () => {
		const prev = makeState([{ id: 1, status: 'LIVE', finishedEntries: 3 }]);
		const next = makeState([{ id: 1, status: 'STOPPED', finishedEntries: 5 }]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toHaveLength(2);
		expect(changes).toContainEqual({ type: 'category_stopped', categoryId: 1 });
		expect(changes).toContainEqual({ type: 'new_finishes', categoryId: 1, count: 2 });
	});

	it('returns empty when nothing changed', () => {
		const state = makeState([{ id: 1, status: 'LIVE', finishedEntries: 3 }]);
		expect(diffCompetitionState(state, state)).toEqual([]);
	});

	it('handles multiple categories independently', () => {
		const prev = makeState([
			{ id: 1, status: 'NOT_STARTED' },
			{ id: 2, status: 'LIVE', finishedEntries: 1 },
		]);
		const next = makeState([
			{ id: 1, status: 'LIVE' },
			{ id: 2, status: 'LIVE', finishedEntries: 3 },
		]);
		const changes = diffCompetitionState(prev, next);
		expect(changes).toHaveLength(2);
		expect(changes).toContainEqual({ type: 'category_started', categoryId: 1 });
		expect(changes).toContainEqual({ type: 'new_finishes', categoryId: 2, count: 2 });
	});
});
