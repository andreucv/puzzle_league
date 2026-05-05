import { describe, it, expect } from 'vitest';
import { matchesSearch } from './useCategoryEntries.svelte';

describe('matchesSearch', () => {
	it('matches by table number', () => {
		const entry = { tableNumber: 5, users: [], externalParticipants: [] };
		expect(matchesSearch(entry, '5')).toBe(true);
	});

	it('matches by partial table number', () => {
		const entry = { tableNumber: 15, users: [], externalParticipants: [] };
		expect(matchesSearch(entry, '1')).toBe(true);
	});

	it('matches by user name (case-insensitive)', () => {
		const entry = { tableNumber: null, users: [{ name: 'Alice' }], externalParticipants: [] };
		expect(matchesSearch(entry, 'alice')).toBe(true);
		expect(matchesSearch(entry, 'ALICE')).toBe(true);
		expect(matchesSearch(entry, 'Ali')).toBe(true);
	});

	it('matches by external participant name (case-insensitive)', () => {
		const entry = { tableNumber: null, users: [], externalParticipants: [{ name: 'Bob' }] };
		expect(matchesSearch(entry, 'bob')).toBe(true);
		expect(matchesSearch(entry, 'BOB')).toBe(true);
	});

	it('returns false when nothing matches', () => {
		const entry = { tableNumber: 3, users: [{ name: 'Alice' }], externalParticipants: [{ name: 'Bob' }] };
		expect(matchesSearch(entry, 'xyz')).toBe(false);
	});

	it('returns false for empty query edge case (no match on empty fields)', () => {
		const entry = { tableNumber: null, users: [], externalParticipants: [] };
		expect(matchesSearch(entry, 'anything')).toBe(false);
	});

	it('handles users with null name gracefully', () => {
		const entry = { tableNumber: null, users: [{ name: null }], externalParticipants: [] };
		expect(matchesSearch(entry, 'test')).toBe(false);
	});

	it('handles undefined externalParticipants gracefully', () => {
		const entry = { tableNumber: null, users: [] };
		expect(matchesSearch(entry, 'test')).toBe(false);
	});

	it('matches second user in array', () => {
		const entry = {
			tableNumber: null,
			users: [{ name: 'Alice' }, { name: 'Charlie' }],
			externalParticipants: []
		};
		expect(matchesSearch(entry, 'charlie')).toBe(true);
	});
});
