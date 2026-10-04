import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { createTableReminderScheduler, scheduleTableReminder, reminderTime, TABLE_REMINDER_LEAD_MS } from './table-reminder-scheduler';
import { MAX_HOP_MS } from './registration-open-scheduler';

const NOW = new Date('2026-10-01T08:00:00.000Z');
const START = new Date('2026-10-01T12:00:00.000Z');

describe('createTableReminderScheduler', () => {
	it('delivers one hour before the start', async () => {
		const qstashClient = { publishJSON: vi.fn().mockResolvedValue(undefined) };
		const scheduler = createTableReminderScheduler({ qstashClient: qstashClient as any, webhookUrl: 'https://app/hook' });

		await scheduler.publish(7, START);

		expect(qstashClient.publishJSON).toHaveBeenCalledWith(expect.objectContaining({
			url: 'https://app/hook',
			body: { categoryId: 7, startTime: START.toISOString() },
			notBefore: Math.floor((START.getTime() - TABLE_REMINDER_LEAD_MS) / 1000),
		}));
	});

	it('caps the delay at the QStash hop limit for far starts', async () => {
		const qstashClient = { publishJSON: vi.fn().mockResolvedValue(undefined) };
		const scheduler = createTableReminderScheduler({ qstashClient: qstashClient as any, webhookUrl: 'https://app/hook' });
		const farStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

		await scheduler.publish(7, farStart);

		const { notBefore } = qstashClient.publishJSON.mock.calls[0][0];
		expect(notBefore * 1000).toBeLessThanOrEqual(Date.now() + MAX_HOP_MS);
		expect(notBefore * 1000).toBeLessThan(reminderTime(farStart).getTime());
	});
});

describe('scheduleTableReminder', () => {
	const scheduler = { publish: vi.fn() };
	let db: { category: { findUnique: ReturnType<typeof vi.fn> }; entry: { count: ReturnType<typeof vi.fn> } };

	beforeEach(() => {
		vi.clearAllMocks();
		scheduler.publish.mockResolvedValue(undefined);
		db = {
			category: { findUnique: vi.fn().mockResolvedValue({ status: 'NOT_STARTED', startTime: START, tableReminderSentAt: null }) },
			entry: { count: vi.fn().mockResolvedValue(3) },
		};
	});

	function call(now: Date = NOW, s: typeof scheduler | null = scheduler) {
		return scheduleTableReminder(1, { db: db as any, scheduler: s, now });
	}

	it('publishes when eligible', async () => {
		expect(await call()).toBe(true);
		expect(scheduler.publish).toHaveBeenCalledWith(1, START);
	});

	it('does nothing without a scheduler (QStash not configured)', async () => {
		expect(await call(NOW, null)).toBe(false);
		expect(db.category.findUnique).not.toHaveBeenCalled();
	});

	it('skips a late assignment (reminder time already passed)', async () => {
		expect(await call(new Date(START.getTime() - 30 * 60 * 1000))).toBe(false);
		expect(scheduler.publish).not.toHaveBeenCalled();
	});

	it('skips when the reminder was already sent', async () => {
		db.category.findUnique.mockResolvedValue({ status: 'NOT_STARTED', startTime: START, tableReminderSentAt: NOW });
		expect(await call()).toBe(false);
		expect(scheduler.publish).not.toHaveBeenCalled();
	});

	it('skips a category that is not NOT_STARTED', async () => {
		db.category.findUnique.mockResolvedValue({ status: 'LIVE', startTime: START, tableReminderSentAt: null });
		expect(await call()).toBe(false);
		expect(scheduler.publish).not.toHaveBeenCalled();
	});

	it('skips a category without tables', async () => {
		db.entry.count.mockResolvedValue(0);
		expect(await call()).toBe(false);
		expect(scheduler.publish).not.toHaveBeenCalled();
	});

	it('swallows a publish error', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		scheduler.publish.mockRejectedValue(new Error('qstash down'));

		expect(await call()).toBe(false);
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
