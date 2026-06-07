import { describe, it, expect } from 'vitest';
import { CalendarDate } from '@internationalized/date';
import {
	resolveCategoryDateTime,
	buildCategoriesPayload,
	type CategoryDraft
} from './competition-categories';

function draft(overrides: Partial<CategoryDraft> = {}): CategoryDraft {
	return {
		origin: 'new',
		description: '500 pcs',
		subname: '',
		type: 'INDIVIDUAL',
		startTime: '10:00',
		endTime: '12:00',
		startDate: new CalendarDate(2026, 3, 20),
		endDate: new CalendarDate(2026, 3, 20),
		maxParties: 10,
		maxPartySize: 1,
		price: 10,
		status: 'NOT_STARTED',
		puzzleIds: [],
		tagCategories: [],
		errors: {},
		...overrides
	};
}

describe('resolveCategoryDateTime', () => {
	it('combines a calendar day and HH:MM into an absolute ISO string at the local wall-clock', () => {
		const iso = resolveCategoryDateTime(new CalendarDate(2026, 3, 20), '10:30');
		const asDate = new Date(iso);
		// Re-reading in the local timezone yields the same wall-clock we put in.
		expect(asDate.getFullYear()).toBe(2026);
		expect(asDate.getMonth()).toBe(2); // March (0-indexed)
		expect(asDate.getDate()).toBe(20);
		expect(asDate.getHours()).toBe(10);
		expect(asDate.getMinutes()).toBe(30);
	});

	it('returns empty string when the date is missing', () => {
		expect(resolveCategoryDateTime(null, '10:00')).toBe('');
	});

	it('returns empty string when the time is missing', () => {
		expect(resolveCategoryDateTime(new CalendarDate(2026, 3, 20), '')).toBe('');
	});
});

describe('buildCategoriesPayload', () => {
	it('puts new drafts into create with resolved datetimes and no where/id', () => {
		const payload = buildCategoriesPayload([draft({ description: 'A' })]);

		expect(payload.create).toHaveLength(1);
		expect(payload.update).toHaveLength(0);
		expect(payload.delete).toHaveLength(0);

		const created = payload.create[0];
		expect(created.description).toBe('A');
		expect(typeof created.startTime).toBe('string');
		expect((created.startTime as string).length).toBeGreaterThan(0);
		expect(created).not.toHaveProperty('id');
		expect(created).not.toHaveProperty('where');
	});

	it('puts existing drafts into update keyed by id', () => {
		const payload = buildCategoriesPayload([
			draft({ origin: 'existing', id: 42, description: 'Existing' })
		]);

		expect(payload.create).toHaveLength(0);
		expect(payload.update).toHaveLength(1);
		expect(payload.update[0].where).toEqual({ id: 42 });
		expect(payload.update[0].data.description).toBe('Existing');
		expect(payload.update[0].data).not.toHaveProperty('id');
	});

	it('puts removed existing drafts into delete and excludes them from update', () => {
		const payload = buildCategoriesPayload([
			draft({ origin: 'existing', id: 7, removed: true }),
			draft({ origin: 'existing', id: 8 })
		]);

		expect(payload.delete).toEqual([{ id: 7 }]);
		expect(payload.update).toHaveLength(1);
		expect(payload.update[0].where).toEqual({ id: 8 });
	});

	it('skips removed new drafts entirely', () => {
		const payload = buildCategoriesPayload([draft({ origin: 'new', removed: true })]);
		expect(payload.create).toHaveLength(0);
		expect(payload.update).toHaveLength(0);
		expect(payload.delete).toHaveLength(0);
	});

	it('preserves puzzleIds and tagCategories in their schema shape (transforms stay server-side)', () => {
		const payload = buildCategoriesPayload([
			draft({
				puzzleIds: ['p1', 'p2'],
				tagCategories: [{ tag: 'JUNIOR', priceOverride: 5 }]
			})
		]);

		expect(payload.create[0].puzzleIds).toEqual(['p1', 'p2']);
		expect(payload.create[0].tagCategories).toEqual([{ tag: 'JUNIOR', priceOverride: 5 }]);
	});

	it('handles a mixed batch of create, update and delete', () => {
		const payload = buildCategoriesPayload([
			draft({ origin: 'existing', id: 1 }),
			draft({ origin: 'existing', id: 2, removed: true }),
			draft({ origin: 'new', description: 'fresh' })
		]);

		expect(payload.update.map((u) => u.where.id)).toEqual([1]);
		expect(payload.delete).toEqual([{ id: 2 }]);
		expect(payload.create).toHaveLength(1);
		expect(payload.create[0].description).toBe('fresh');
	});
});
