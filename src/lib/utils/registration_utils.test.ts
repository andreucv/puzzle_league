import { describe, expect, it } from 'vitest';
import {
	canFollowCategory,
	isUserEntry,
	countUserEntryStatuses,
	getMostUrgentStatus,
	getPresentStatuses,
	formatStatusBreakdown,
	selectCardCategories,
} from './registration_utils';

const ME = 'me';
const participant = (status: string) => ({ status, creatorId: 'other', users: [{ id: ME }] });
const created = (status: string) => ({ status, creatorId: ME, users: [{ id: 'friend' }] });
const foreign = (status: string) => ({ status, creatorId: 'other', users: [{ id: 'friend' }] });

describe('isUserEntry', () => {
	it('matches when the user is a participant', () => {
		expect(isUserEntry(participant('CONFIRMED'), ME)).toBe(true);
	});

	it('matches when the user is only the creator', () => {
		expect(isUserEntry(created('CONFIRMED'), ME)).toBe(true);
	});

	it('does not match other entries or a missing user', () => {
		expect(isUserEntry(foreign('CONFIRMED'), ME)).toBe(false);
		expect(isUserEntry(participant('CONFIRMED'), undefined)).toBe(false);
	});
});

describe('countUserEntryStatuses', () => {
	it('counts only the user entries per status', () => {
		const counts = countUserEntryStatuses(
			[participant('CONFIRMED'), created('PENDING_CONFIRMATION'), created('PENDING_CONFIRMATION'), created('WAITLISTED'), foreign('WAITLISTED')],
			ME,
		);
		expect(counts).toEqual({ CONFIRMED: 1, PENDING_CONFIRMATION: 2, WAITLISTED: 1 });
	});

	it('returns null when the user has no entries', () => {
		expect(countUserEntryStatuses([foreign('CONFIRMED')], ME)).toBeNull();
		expect(countUserEntryStatuses(undefined, ME)).toBeNull();
	});
});

describe('getMostUrgentStatus / getPresentStatuses', () => {
	const counts = { CONFIRMED: 1, PENDING_CONFIRMATION: 2, WAITLISTED: 0 };

	it('picks waitlisted > pending > confirmed', () => {
		expect(getMostUrgentStatus(counts)).toBe('PENDING_CONFIRMATION');
		expect(getMostUrgentStatus({ ...counts, WAITLISTED: 1 })).toBe('WAITLISTED');
		expect(getMostUrgentStatus({ CONFIRMED: 1, PENDING_CONFIRMATION: 0, WAITLISTED: 0 })).toBe('CONFIRMED');
		expect(getMostUrgentStatus(null)).toBeNull();
	});

	it('lists present statuses in lifecycle order', () => {
		expect(getPresentStatuses({ CONFIRMED: 1, PENDING_CONFIRMATION: 0, WAITLISTED: 3 })).toEqual(['CONFIRMED', 'WAITLISTED']);
		expect(getPresentStatuses(null)).toEqual([]);
	});
});

describe('formatStatusBreakdown', () => {
	it('joins translated items in lifecycle order', () => {
		const translate = (key: string, params?: Record<string, unknown>) =>
			params ? `${params.status}: ${params.count}` : key.replace('registration.status_', '');
		expect(formatStatusBreakdown({ CONFIRMED: 1, PENDING_CONFIRMATION: 0, WAITLISTED: 2 }, translate)).toBe(
			'confirmed: 1 · waitlisted: 2',
		);
	});
});

describe('selectCardCategories', () => {
	const cat = (id: number, mine: boolean) => ({ id, entries: mine ? [participant('CONFIRMED')] : [foreign('CONFIRMED')] });
	const ids = (list: { id: number }[]) => list.map((c) => c.id);

	it('shows the first 2 categories when the user has no entries or no user is given', () => {
		const categories = [cat(1, false), cat(2, false), cat(3, false)];
		expect(ids(selectCardCategories(categories, ME).visible)).toEqual([1, 2]);
		expect(ids(selectCardCategories([cat(1, true), cat(2, false), cat(3, false)], undefined).visible)).toEqual([1, 2]);
	});

	it('always shows a user category and fills the rest with others, keeping order', () => {
		const { visible, hidden } = selectCardCategories([cat(1, false), cat(2, false), cat(3, true)], ME);
		expect(ids(visible)).toEqual([1, 3]);
		expect(ids(hidden)).toEqual([2]);
	});

	it('shows up to 3 user categories and hides the rest', () => {
		const categories = [cat(1, true), cat(2, true), cat(3, false), cat(4, true), cat(5, true)];
		const { visible, hidden } = selectCardCategories(categories, ME);
		expect(ids(visible)).toEqual([1, 2, 4]);
		expect(ids(hidden)).toEqual([3, 5]);
	});
});

const closed = { status: 'NOT_STARTED', registrationOpen: false };
const base = { category: closed, followAvailable: true, canManage: false, hasEntry: false };

describe('canFollowCategory', () => {
	it('is actionable for a closed, not-started category', () => {
		expect(canFollowCategory(base)).toBe(true);
	});

	it('is hidden when follower notification is unavailable (no QStash)', () => {
		expect(canFollowCategory({ ...base, followAvailable: false })).toBe(false);
	});

	it('is hidden when the category is open', () => {
		expect(canFollowCategory({ ...base, category: { ...closed, registrationOpen: true } })).toBe(false);
	});

	it('is hidden when the category has started', () => {
		expect(canFollowCategory({ ...base, category: { ...closed, status: 'LIVE' } })).toBe(false);
	});

	it('is hidden for organizers', () => {
		expect(canFollowCategory({ ...base, canManage: true })).toBe(false);
	});

	it('is hidden when the viewer already holds an entry', () => {
		expect(canFollowCategory({ ...base, hasEntry: true })).toBe(false);
	});
});
