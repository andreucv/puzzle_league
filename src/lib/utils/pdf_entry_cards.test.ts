import { describe, it, expect } from 'vitest';
import { qualifyingEntries, cardHeight, paginateCards } from './pdf_entry_cards';

function makeEntry(overrides: Record<string, unknown> = {}) {
	return {
		id: 'e1',
		status: 'CONFIRMED',
		tableNumber: 1,
		users: [{ name: 'Alice' }],
		externalParticipants: [],
		entryTag: null,
		...overrides
	} as Parameters<typeof qualifyingEntries>[0][number];
}

describe('qualifyingEntries', () => {
	it('keeps only CONFIRMED entries with a table number, sorted by table', () => {
		const entries = [
			makeEntry({ id: 'a', tableNumber: 5 }),
			makeEntry({ id: 'b', status: 'PENDING_CONFIRMATION', tableNumber: 1 }),
			makeEntry({ id: 'c', tableNumber: null }),
			makeEntry({ id: 'd', tableNumber: 2 })
		];
		expect(qualifyingEntries(entries).map((e) => e.id)).toEqual(['d', 'a']);
	});
});

describe('cardHeight', () => {
	it('never drops below the QR minimum for a single participant', () => {
		const single = cardHeight(makeEntry());
		const pair = cardHeight(makeEntry({ users: [{ name: 'A' }, { name: 'B' }] }));
		expect(single).toBeGreaterThanOrEqual(32); // QR size
		expect(pair).toBe(single); // 2 name lines still fit beside the QR block
	});

	it('grows with participant count and confirmed tag', () => {
		const big = makeEntry({
			users: Array.from({ length: 6 }, (_, i) => ({ name: `U${i}` })),
			entryTag: { tag: 'JUNIOR', status: 'CONFIRMED' }
		});
		expect(cardHeight(big)).toBeGreaterThan(cardHeight(makeEntry()));
	});

	it('ignores pending tags', () => {
		const pending = makeEntry({
			users: Array.from({ length: 6 }, (_, i) => ({ name: `U${i}` })),
			entryTag: { tag: 'JUNIOR', status: 'PENDING' }
		});
		const confirmed = makeEntry({
			users: Array.from({ length: 6 }, (_, i) => ({ name: `U${i}` })),
			entryTag: { tag: 'JUNIOR', status: 'CONFIRMED' }
		});
		expect(cardHeight(confirmed)).toBeGreaterThan(cardHeight(pending));
	});
});

describe('paginateCards', () => {
	const GAP = 8;

	it('packs as many atomic cards as fit, breaking before a card that does not fit', () => {
		// content 100: 40 + 8 + 40 = 88 fits, adding 8 + 40 would exceed 100
		const pages = paginateCards([40, 40, 40, 40], 100, GAP);
		expect(pages).toEqual([
			[0, 1],
			[2, 3]
		]);
	});

	it('never splits a card: every page fits within the content height', () => {
		const heights = [44, 51, 58, 44, 65, 44, 51, 44, 44, 58];
		const contentHeight = 273;
		const pages = paginateCards(heights, contentHeight, GAP);
		// All cards placed exactly once, in order
		expect(pages.flat()).toEqual(heights.map((_, i) => i));
		for (const page of pages) {
			const used = page.reduce((sum, i, pos) => sum + heights[i] + (pos > 0 ? GAP : 0), 0);
			expect(used).toBeLessThanOrEqual(contentHeight);
		}
	});

	it('gives an oversized card its own page instead of looping', () => {
		expect(paginateCards([500], 273, GAP)).toEqual([[0]]);
		expect(paginateCards([40, 500, 40], 273, GAP)).toEqual([[0], [1], [2]]);
	});

	it('returns no pages for no cards', () => {
		expect(paginateCards([], 273, GAP)).toEqual([]);
	});
});
