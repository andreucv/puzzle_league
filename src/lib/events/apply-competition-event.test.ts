import { describe, it, expect } from 'vitest';
import { applyCompetitionEvent, type CompetitionEventState } from './types';

function baseState(): CompetitionEventState {
	return {
		version: 'v0',
		categories: [
			{
				id: 1,
				status: 'LIVE',
				totalEntries: 5,
				finishedEntries: 0,
				realStartTime: '2026-05-03T14:00:00.000Z',
				realEndTime: null,
				extraMinutes: 0,
				autoStop: false,
			},
		],
	};
}

describe('applyCompetitionEvent — category.auto_stop_changed', () => {
	it('sets autoStop to true when armed', () => {
		const next = applyCompetitionEvent(baseState(), {
			type: 'category.auto_stop_changed',
			categoryId: 1,
			competitionId: 42,
			armed: true,
		});
		expect(next.categories[0].autoStop).toBe(true);
		expect(next.version).not.toBe('v0');
	});

	it('sets autoStop to false when disarmed', () => {
		const armed = baseState();
		armed.categories[0].autoStop = true;
		const next = applyCompetitionEvent(armed, {
			type: 'category.auto_stop_changed',
			categoryId: 1,
			competitionId: 42,
			armed: false,
		});
		expect(next.categories[0].autoStop).toBe(false);
	});

	it('leaves other categories untouched', () => {
		const state = baseState();
		const next = applyCompetitionEvent(state, {
			type: 'category.auto_stop_changed',
			categoryId: 999,
			competitionId: 42,
			armed: true,
		});
		expect(next.categories[0].autoStop).toBe(false);
	});
});
