import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──

const mockAutoCancelExpiredCompetitions = vi.fn();
const mockFindFirst = vi.fn();
const mockVerify = vi.fn();

vi.mock('$lib/services/auto-cancel', () => ({
	autoCancelExpiredCompetitions: (...args: unknown[]) => mockAutoCancelExpiredCompetitions(...args),
}));

vi.mock('$lib/database/create_prisma_client', () => ({
	prisma: {
		roleAssignment: {
			findFirst: (...args: unknown[]) => mockFindFirst(...args),
		},
	},
}));

vi.mock('@upstash/qstash', () => ({
	Receiver: class {
		verify(...args: unknown[]) {
			return mockVerify(...args);
		}
	},
}));

vi.mock('$env/dynamic/private', () => ({
	env: { QSTASH_CURRENT_SIGNING_KEY: 'current-key', QSTASH_NEXT_SIGNING_KEY: 'next-key' },
}));

vi.mock('@sveltejs/kit', () => ({
	json: (data: unknown, init?: { status?: number }) => {
		return { body: data, status: init?.status ?? 200 };
	},
}));

import { GET } from './+server';

// ── Helpers ──

function makeEvent(options: {
	signature?: string;
	body?: string;
	dryRun?: string;
	competitionId?: string;
	user?: { id: string } | null;
} = {}) {
	const url = new URL('http://localhost/api/cron/auto-cancel');
	if (options.dryRun != null) url.searchParams.set('dryRun', options.dryRun);
	if (options.competitionId != null) url.searchParams.set('competitionId', options.competitionId);

	const headers = new Headers();
	if (options.signature != null) {
		headers.set('upstash-signature', options.signature);
	}

	return {
		request: {
			url: url.toString(),
			headers,
			text: async () => options.body ?? '',
		},
		locals: {
			user: options.user ?? null,
		},
	} as any;
}

function makeSuccessResult(overrides: Record<string, unknown> = {}) {
	return {
		eligible: 1,
		cancelled: 1,
		skipped: 0,
		failed: 0,
		categoriesChanged: 2,
		recipientsAttempted: 3,
		notificationFailures: 0,
		failures: [],
		...overrides,
	};
}

describe('GET /api/cron/auto-cancel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFindFirst.mockResolvedValue(null);
		mockVerify.mockResolvedValue(true);
	});

	// ── Authorization ──

	describe('authorization', () => {
		it('returns 401 when no signature and no session', async () => {
			const response = await GET(makeEvent());

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: 'Unauthorized' });
			expect(mockAutoCancelExpiredCompetitions).not.toHaveBeenCalled();
		});

		it('returns 401 when QStash signature is invalid', async () => {
			mockVerify.mockResolvedValue(false);

			const response = await GET(makeEvent({ signature: 'bad-sig' }));

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: 'Invalid signature' });
			expect(mockAutoCancelExpiredCompetitions).not.toHaveBeenCalled();
		});

		it('returns 200 when QStash signature is valid', async () => {
			const result = makeSuccessResult();
			mockVerify.mockResolvedValue(true);
			mockAutoCancelExpiredCompetitions.mockResolvedValue(result);

			const response = await GET(makeEvent({ signature: 'good-sig' }));

			expect(response.status).toBe(200);
			expect(response.body).toEqual(result);
		});

		it('returns 200 when user has admin role (no signature needed)', async () => {
			const result = makeSuccessResult();
			mockAutoCancelExpiredCompetitions.mockResolvedValue(result);
			mockFindFirst.mockResolvedValue({ id: 'role-1', role: 'ADMIN', userId: 'admin-1' });

			const response = await GET(makeEvent({ user: { id: 'admin-1' } }));

			expect(response.status).toBe(200);
			expect(response.body).toEqual(result);
		});

		it('returns 401 when user is logged in but not admin', async () => {
			mockFindFirst.mockResolvedValue(null);

			const response = await GET(makeEvent({ user: { id: 'user-1' } }));

			expect(response.status).toBe(401);
			expect(mockAutoCancelExpiredCompetitions).not.toHaveBeenCalled();
		});
	});

	// ── Parameter parsing ──

	describe('parameter parsing', () => {
		it('forwards dryRun=true to the service', async () => {
			mockAutoCancelExpiredCompetitions.mockResolvedValue(makeSuccessResult());

			await GET(makeEvent({
				signature: 'good-sig',
				dryRun: 'true',
			}));

			expect(mockAutoCancelExpiredCompetitions).toHaveBeenCalledWith({
				dryRun: true,
				competitionId: undefined,
			});
		});

		it('forwards competitionId as a number to the service', async () => {
			mockAutoCancelExpiredCompetitions.mockResolvedValue(makeSuccessResult());

			await GET(makeEvent({
				signature: 'good-sig',
				competitionId: '42',
			}));

			expect(mockAutoCancelExpiredCompetitions).toHaveBeenCalledWith({
				dryRun: false,
				competitionId: 42,
			});
		});

		it('returns 400 for non-numeric competitionId', async () => {
			const response = await GET(makeEvent({
				signature: 'good-sig',
				competitionId: 'abc',
			}));

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: 'Invalid competitionId — must be a number' });
			expect(mockAutoCancelExpiredCompetitions).not.toHaveBeenCalled();
		});
	});

	// ── Response structure ──

	describe('response structure', () => {
		it('returns all count fields from the service result', async () => {
			const result = makeSuccessResult({
				eligible: 5,
				cancelled: 3,
				skipped: 1,
				failed: 1,
				categoriesChanged: 8,
				recipientsAttempted: 12,
				notificationFailures: 2,
				failures: [{ competitionId: 4, error: 'DB error' }],
			});
			mockAutoCancelExpiredCompetitions.mockResolvedValue(result);

			const response = await GET(makeEvent({ signature: 'good-sig' }));

			expect(response.status).toBe(200);
			expect(response.body).toEqual(result);
		});

		it('returns 500 when the service throws', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			mockAutoCancelExpiredCompetitions.mockRejectedValue(new Error('Unexpected failure'));

			const response = await GET(makeEvent({ signature: 'good-sig' }));

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: 'Internal server error' });
			consoleSpy.mockRestore();
		});
	});

	// ── Service delegation ──

	describe('service delegation', () => {
		it('calls the service with default options when no query params are given', async () => {
			mockAutoCancelExpiredCompetitions.mockResolvedValue(makeSuccessResult());

			await GET(makeEvent({ signature: 'good-sig' }));

			expect(mockAutoCancelExpiredCompetitions).toHaveBeenCalledWith({
				dryRun: false,
				competitionId: undefined,
			});
		});
	});
});
