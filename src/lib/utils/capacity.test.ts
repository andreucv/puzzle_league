import { describe, it, expect } from 'vitest';
import { getCapacityLevel, spotsLeft } from './capacity';

describe('spotsLeft', () => {
	it('returns the remaining capacity', () => {
		expect(spotsLeft(3, 12)).toBe(9);
	});

	it('never goes negative when overbooked', () => {
		expect(spotsLeft(15, 12)).toBe(0);
	});
});

describe('getCapacityLevel', () => {
	it('is "available" when more than 3 spots remain', () => {
		expect(getCapacityLevel(3, 12)).toBe('available');
	});

	it('is "available" at exactly 4 spots left (boundary)', () => {
		expect(getCapacityLevel(8, 12)).toBe('available');
	});

	it('is "low" at exactly 3 spots left (boundary)', () => {
		expect(getCapacityLevel(9, 12)).toBe('low');
	});

	it('is "low" with 1 spot left', () => {
		expect(getCapacityLevel(11, 12)).toBe('low');
	});

	it('is "full" when exactly at capacity', () => {
		expect(getCapacityLevel(12, 12)).toBe('full');
	});

	it('is "full" when overbooked', () => {
		expect(getCapacityLevel(15, 12)).toBe('full');
	});
});
