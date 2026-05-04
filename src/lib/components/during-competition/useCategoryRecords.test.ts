import { describe, it, expect } from 'vitest';
import { matchesSearch } from './useCategoryRecords.svelte';

describe('matchesSearch', () => {
	it('matches by table number', () => {
		const record = { tableNumber: 5, users: [], externalParticipants: [] };
		expect(matchesSearch(record, '5')).toBe(true);
	});

	it('matches by partial table number', () => {
		const record = { tableNumber: 15, users: [], externalParticipants: [] };
		expect(matchesSearch(record, '1')).toBe(true);
	});

	it('matches by user name (case-insensitive)', () => {
		const record = { tableNumber: null, users: [{ name: 'Alice' }], externalParticipants: [] };
		expect(matchesSearch(record, 'alice')).toBe(true);
		expect(matchesSearch(record, 'ALICE')).toBe(true);
		expect(matchesSearch(record, 'Ali')).toBe(true);
	});

	it('matches by userIntent name (case-insensitive)', () => {
		const record = { tableNumber: null, users: [], externalParticipants: [{ name: 'Bob' }] };
		expect(matchesSearch(record, 'bob')).toBe(true);
		expect(matchesSearch(record, 'BOB')).toBe(true);
	});

	it('returns false when nothing matches', () => {
		const record = { tableNumber: 3, users: [{ name: 'Alice' }], externalParticipants: [{ name: 'Bob' }] };
		expect(matchesSearch(record, 'xyz')).toBe(false);
	});

	it('returns false for empty query edge case (no match on empty fields)', () => {
		const record = { tableNumber: null, users: [], externalParticipants: [] };
		expect(matchesSearch(record, 'anything')).toBe(false);
	});

	it('handles users with null name gracefully', () => {
		const record = { tableNumber: null, users: [{ name: null }], externalParticipants: [] };
		expect(matchesSearch(record, 'test')).toBe(false);
	});

	it('handles undefined externalParticipants gracefully', () => {
		const record = { tableNumber: null, users: [] };
		expect(matchesSearch(record, 'test')).toBe(false);
	});

	it('matches second user in array', () => {
		const record = {
			tableNumber: null,
			users: [{ name: 'Alice' }, { name: 'Charlie' }],
			externalParticipants: []
		};
		expect(matchesSearch(record, 'charlie')).toBe(true);
	});
});
