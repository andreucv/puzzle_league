import { describe, expect, it } from 'vitest';
import { canFollowCategory } from './registration_utils';

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
