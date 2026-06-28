import { describe, it, expect } from 'vitest';
import {
	totalCapacity,
	hasCompleteCapacity,
	enablementPrice,
	isFreeEligible
} from './competition_pricing';

describe('totalCapacity', () => {
	it('sums maxParties across categories', () => {
		expect(totalCapacity([{ maxParties: 12 }, { maxParties: 8 }, { maxParties: 30 }])).toBe(50);
	});

	it('treats null maxParties as 0', () => {
		expect(totalCapacity([{ maxParties: 10 }, { maxParties: null }])).toBe(10);
	});
});

describe('hasCompleteCapacity', () => {
	it('is false when any category lacks capacity', () => {
		expect(hasCompleteCapacity([{ maxParties: 10 }, { maxParties: null }])).toBe(false);
	});

	it('is false for an empty category set', () => {
		expect(hasCompleteCapacity([])).toBe(false);
	});

	it('is true when every category has capacity', () => {
		expect(hasCompleteCapacity([{ maxParties: 10 }, { maxParties: 5 }])).toBe(true);
	});
});

describe('enablementPrice', () => {
	it('is unitRate × total capacity', () => {
		expect(enablementPrice([{ maxParties: 100 }], 0.3)).toBeCloseTo(30);
	});
});

describe('isFreeEligible (F1 boundary)', () => {
	it('is true at exactly 10 slots', () => {
		expect(isFreeEligible([{ maxParties: 6 }, { maxParties: 4 }])).toBe(true);
	});

	it('is false at 11 slots', () => {
		expect(isFreeEligible([{ maxParties: 6 }, { maxParties: 5 }])).toBe(false);
	});
});
