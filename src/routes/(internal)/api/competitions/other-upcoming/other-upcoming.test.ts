import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──

const mockGetOtherUpcoming = vi.fn();

vi.mock('$lib/database/db_competition', () => ({
	getOtherUpcomingCompetitions: (...args: unknown[]) => mockGetOtherUpcoming(...args),
}));

import { GET } from './+server';

// ── Helpers ──

function makeCompetition(id: number) {
	return { id, name: `Competition ${id}`, startDate: new Date('2026-07-01'), categories: [] };
}

function makeEvent(overrides: {
	user?: { id: string; name: string } | null;
	searchParams?: Record<string, string>;
} = {}) {
	const url = new URL('http://localhost/api/competitions/other-upcoming');
	if (overrides.searchParams) {
		for (const [key, value] of Object.entries(overrides.searchParams)) {
			url.searchParams.set(key, value);
		}
	}

	return {
		locals: { user: 'user' in overrides ? overrides.user : { id: 'user-1', name: 'Test' } },
		url,
	} as any;
}

describe('GET /api/competitions/other-upcoming', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── Authentication ──

	it('rejects unauthenticated requests with 401', async () => {
		const response = await GET(makeEvent({ user: null }));

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe('Unauthorized');
	});

	// ── Pagination parameters ──

	it('defaults to limit=10 and offset=0', async () => {
		mockGetOtherUpcoming.mockResolvedValue([]);

		await GET(makeEvent());

		// limit + 1 = 11 to check hasMore
		expect(mockGetOtherUpcoming).toHaveBeenCalledWith('user-1', 11, 0);
	});

	it('uses provided offset and limit', async () => {
		mockGetOtherUpcoming.mockResolvedValue([]);

		await GET(makeEvent({ searchParams: { offset: '10', limit: '5' } }));

		expect(mockGetOtherUpcoming).toHaveBeenCalledWith('user-1', 6, 10);
	});

	it('rejects negative offset', async () => {
		const response = await GET(makeEvent({ searchParams: { offset: '-1' } }));

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain('offset');
	});

	it('rejects non-numeric offset', async () => {
		const response = await GET(makeEvent({ searchParams: { offset: 'abc' } }));

		expect(response.status).toBe(400);
	});

	it('rejects limit below 1', async () => {
		const response = await GET(makeEvent({ searchParams: { limit: '0' } }));

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain('limit');
	});

	it('rejects limit above MAX_LIMIT', async () => {
		const response = await GET(makeEvent({ searchParams: { limit: '51' } }));

		expect(response.status).toBe(400);
	});

	// ── Successful response ──

	it('returns competitions and hasMore=false when fewer than limit', async () => {
		const competitions = [makeCompetition(1), makeCompetition(2)];
		mockGetOtherUpcoming.mockResolvedValue(competitions);

		const response = await GET(makeEvent());

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.competitions).toHaveLength(2);
		expect(body.hasMore).toBe(false);
	});

	it('returns hasMore=true when more results exist', async () => {
		// Requesting limit=10, so query asks for 11. Return 11 to indicate more.
		const competitions = Array.from({ length: 11 }, (_, i) => makeCompetition(i + 1));
		mockGetOtherUpcoming.mockResolvedValue(competitions);

		const response = await GET(makeEvent());

		const body = await response.json();
		expect(body.competitions).toHaveLength(10);
		expect(body.hasMore).toBe(true);
	});

	it('returns empty array when no competitions match', async () => {
		mockGetOtherUpcoming.mockResolvedValue([]);

		const response = await GET(makeEvent());

		const body = await response.json();
		expect(body.competitions).toEqual([]);
		expect(body.hasMore).toBe(false);
	});

	it('uses the authenticated user ID, not a client-provided one', async () => {
		mockGetOtherUpcoming.mockResolvedValue([]);

		await GET(makeEvent({ user: { id: 'server-user', name: 'Server' } }));

		expect(mockGetOtherUpcoming).toHaveBeenCalledWith('server-user', expect.any(Number), expect.any(Number));
	});
});
