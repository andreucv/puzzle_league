import { describe, it, expect } from 'vitest';
import { extractIntId, extractStringId } from './api_route_guards';

describe('extractIntId', () => {
	it('extracts ID from flat route /api/competitions/42', () => {
		expect(extractIntId('/api/competitions/42')).toBe(42);
	});

	it('extracts ID from flat route with trailing action /api/competitions/42/manage', () => {
		expect(extractIntId('/api/competitions/42/manage')).toBe(42);
	});

	it('extracts ID from nested route /api/events/competition/42', () => {
		expect(extractIntId('/api/events/competition/42')).toBe(42);
	});

	it('extracts ID from category route /api/categories/7/start', () => {
		expect(extractIntId('/api/categories/7/start')).toBe(7);
	});

	it('returns null when no integer segment is present', () => {
		expect(extractIntId('/api/notifications')).toBeNull();
	});

	it('returns null for UUID-only paths', () => {
		expect(extractIntId('/api/records/abc-def-123/result')).toBeNull();
	});
});

describe('extractStringId', () => {
	it('extracts string ID from /api/records/abc-def-123/result', () => {
		expect(extractStringId('/api/records/abc-def-123/result')).toBe('abc-def-123');
	});

	it('extracts numeric-looking string from /api/competitions/42', () => {
		expect(extractStringId('/api/competitions/42')).toBe('42');
	});

	it('returns null for bare /api/records', () => {
		// The regex expects at least /api/<resource>/<id>
		expect(extractStringId('/api/')).toBeNull();
	});
});
