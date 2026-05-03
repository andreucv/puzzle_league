import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAutoStopWebhook } from './auto-stop-webhook';

function createMockReceiver(valid = true) {
	return {
		verify: vi.fn().mockResolvedValue(valid),
	};
}

function createMockDb() {
	return {
		category: {
			findUnique: vi.fn(),
		},
	};
}

const mockStopCategory = vi.fn();
const mockCreateNotification = vi.fn();

describe('auto-stop webhook handler', () => {
	let mockReceiver: ReturnType<typeof createMockReceiver>;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockReceiver = createMockReceiver();
		mockDb = createMockDb();
	});

	function callWebhook(opts: { signature?: string; body?: string } = {}) {
		return handleAutoStopWebhook({
			signature: opts.signature ?? 'valid-sig',
			body: opts.body ?? JSON.stringify({ categoryId: 1, competitionId: 42 }),
			receiver: mockReceiver as any,
			db: mockDb as any,
			stopCategory: mockStopCategory,
			createNotification: mockCreateNotification,
		});
	}

	it('stops a LIVE category and returns 200', async () => {
		mockDb.category.findUnique.mockResolvedValue({
			id: 1,
			status: 'LIVE',
			competitionId: 42,
			competition: { creatorId: 'org-user-1', name: 'Test Competition' },
		});
		mockStopCategory.mockResolvedValue({ id: 1, status: 'STOPPED' });

		const result = await callWebhook();

		expect(result.status).toBe(200);
		expect(mockStopCategory).toHaveBeenCalledWith(1, { isAutoStop: true });
	});

	it('rejects requests with invalid signature (401)', async () => {
		mockReceiver.verify.mockResolvedValue(false);

		const result = await callWebhook();

		expect(result.status).toBe(401);
		expect(mockStopCategory).not.toHaveBeenCalled();
	});

	it('returns 404 when category is not found', async () => {
		mockDb.category.findUnique.mockResolvedValue(null);

		const result = await callWebhook();

		expect(result.status).toBe(404);
		expect(mockStopCategory).not.toHaveBeenCalled();
	});

	it('returns 200 with no side effects when category is already STOPPED', async () => {
		mockDb.category.findUnique.mockResolvedValue({
			id: 1,
			status: 'STOPPED',
			competitionId: 42,
			competition: { creatorId: 'org-user-1', name: 'Test Competition' },
		});

		const result = await callWebhook();

		expect(result.status).toBe(200);
		expect(mockStopCategory).not.toHaveBeenCalled();
	});

	it('returns 200 with no side effects when category is COMPLETE', async () => {
		mockDb.category.findUnique.mockResolvedValue({
			id: 1,
			status: 'COMPLETE',
			competitionId: 42,
			competition: { creatorId: 'org-user-1', name: 'Test Competition' },
		});

		const result = await callWebhook();

		expect(result.status).toBe(200);
		expect(mockStopCategory).not.toHaveBeenCalled();
	});

	it('returns 200 with no side effects when category is CANCELED', async () => {
		mockDb.category.findUnique.mockResolvedValue({
			id: 1,
			status: 'CANCELED',
			competitionId: 42,
			competition: { creatorId: 'org-user-1', name: 'Test Competition' },
		});

		const result = await callWebhook();

		expect(result.status).toBe(200);
		expect(mockStopCategory).not.toHaveBeenCalled();
	});

	it('creates a notification for the organizer on successful auto-stop', async () => {
		mockDb.category.findUnique.mockResolvedValue({
			id: 1,
			status: 'LIVE',
			competitionId: 42,
			competition: { creatorId: 'org-user-1', name: 'Test Competition' },
		});
		mockStopCategory.mockResolvedValue({ id: 1, status: 'STOPPED' });

		await callWebhook();

		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'org-user-1',
			})
		);
	});

	it('creates a failure notification when stopCategory throws', async () => {
		mockDb.category.findUnique.mockResolvedValue({
			id: 1,
			status: 'LIVE',
			competitionId: 42,
			competition: { creatorId: 'org-user-1', name: 'Test Competition' },
		});
		mockStopCategory.mockRejectedValue(new Error('DB connection lost'));

		const result = await callWebhook();

		expect(result.status).toBe(500);
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'org-user-1',
			})
		);
	});
});
