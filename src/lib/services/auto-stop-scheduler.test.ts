import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAutoStopScheduler } from './auto-stop-scheduler';

function createMockQStashClient() {
	return {
		publishJSON: vi.fn().mockResolvedValue({ messageId: 'qstash-msg-123' }),
		messages: {
			delete: vi.fn().mockResolvedValue(undefined),
		},
	};
}

function createMockDb() {
	return {
		category: {
			update: vi.fn().mockResolvedValue({}),
			findUnique: vi.fn().mockResolvedValue(null),
		},
	};
}

describe('auto-stop scheduler', () => {
	let mockQStash: ReturnType<typeof createMockQStashClient>;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(() => {
		mockQStash = createMockQStashClient();
		mockDb = createMockDb();
	});

	describe('scheduleAutoStop', () => {
		it('publishes a delayed message to QStash and stores the message ID', async () => {
			const scheduler = createAutoStopScheduler({
				qstashClient: mockQStash as any,
				db: mockDb as any,
				webhookUrl: 'https://example.com/api/webhooks/qstash/auto-stop',
			});

			const deadline = new Date('2026-05-03T15:00:00Z');
			await scheduler.scheduleAutoStop(1, 42, deadline);

			// Should publish to QStash with correct params
			expect(mockQStash.publishJSON).toHaveBeenCalledOnce();
			const publishCall = mockQStash.publishJSON.mock.calls[0][0];
			expect(publishCall.url).toBe('https://example.com/api/webhooks/qstash/auto-stop');
			expect(publishCall.body).toEqual({ categoryId: 1, competitionId: 42 });
			expect(publishCall.notBefore).toBe(Math.floor(deadline.getTime() / 1000));

			// Should store the message ID (the message handle is the single source of truth)
			expect(mockDb.category.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { autoStopMessageId: 'qstash-msg-123' },
			});
		});
	});

	describe('cancelAutoStop', () => {
		it('cancels the QStash message and clears the stored ID', async () => {
			mockDb.category.findUnique.mockResolvedValue({
				id: 1,
				autoStopMessageId: 'qstash-msg-456',
			});

			const scheduler = createAutoStopScheduler({
				qstashClient: mockQStash as any,
				db: mockDb as any,
				webhookUrl: 'https://example.com/api/webhooks/qstash/auto-stop',
			});

			await scheduler.cancelAutoStop(1);

			expect(mockQStash.messages.delete).toHaveBeenCalledWith('qstash-msg-456');
			expect(mockDb.category.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { autoStopMessageId: null },
			});
		});

		it('is a no-op when no message ID is stored', async () => {
			mockDb.category.findUnique.mockResolvedValue({
				id: 1,
				autoStopMessageId: null,
			});

			const scheduler = createAutoStopScheduler({
				qstashClient: mockQStash as any,
				db: mockDb as any,
				webhookUrl: 'https://example.com/api/webhooks/qstash/auto-stop',
			});

			await scheduler.cancelAutoStop(1);

			expect(mockQStash.messages.delete).not.toHaveBeenCalled();
			expect(mockDb.category.update).not.toHaveBeenCalled();
		});
	});

	describe('rescheduleAutoStop', () => {
		it('cancels the old message and schedules a new one', async () => {
			mockDb.category.findUnique.mockResolvedValue({
				id: 1,
				autoStopMessageId: 'qstash-old-msg',
			});
			mockQStash.publishJSON.mockResolvedValue({ messageId: 'qstash-new-msg' });

			const scheduler = createAutoStopScheduler({
				qstashClient: mockQStash as any,
				db: mockDb as any,
				webhookUrl: 'https://example.com/api/webhooks/qstash/auto-stop',
			});

			const newDeadline = new Date('2026-05-03T16:00:00Z');
			await scheduler.rescheduleAutoStop(1, 42, newDeadline);

			// Should cancel old message
			expect(mockQStash.messages.delete).toHaveBeenCalledWith('qstash-old-msg');

			// Should schedule new message
			expect(mockQStash.publishJSON).toHaveBeenCalledOnce();
			const publishCall = mockQStash.publishJSON.mock.calls[0][0];
			expect(publishCall.body).toEqual({ categoryId: 1, competitionId: 42 });
			expect(publishCall.notBefore).toBe(Math.floor(newDeadline.getTime() / 1000));

			// Should update with new message ID (second update call — first is the clear from cancel)
			const updateCalls = mockDb.category.update.mock.calls;
			const lastUpdate = updateCalls[updateCalls.length - 1][0];
			expect(lastUpdate.data.autoStopMessageId).toBe('qstash-new-msg');
		});
	});
});
