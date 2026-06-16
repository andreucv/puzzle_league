import { describe, it, expect } from 'vitest';
import { createAutoStopScheduler } from './auto-stop-scheduler';

// Stateful fakes instead of bare spies: assertions target observable outcomes (what ends up
// stored / published / deleted), not "was method X called". A QStash message handle is modelled
// as an incrementing id so we can prove the id QStash hands back is the one persisted.

function createFakeQStash() {
	const published: Array<{ url: string; body: unknown; notBefore?: number }> = [];
	const deleted: string[] = [];
	let nextId = 0;
	let deleteError: Error | null = null;

	return {
		published,
		deleted,
		setDeleteError(error: Error | null) {
			deleteError = error;
		},
		publishJSON: async (message: { url: string; body: unknown; notBefore?: number }) => {
			published.push(message);
			return { messageId: `qstash-msg-${++nextId}` };
		},
		messages: {
			delete: async (id: string) => {
				if (deleteError) throw deleteError;
				deleted.push(id);
			},
		},
	};
}

function createFakeDb(initial: Record<number, string | null> = {}) {
	const rows = new Map<number, { id: number; autoStopMessageId: string | null }>();
	for (const [id, messageId] of Object.entries(initial)) {
		rows.set(Number(id), { id: Number(id), autoStopMessageId: messageId });
	}

	return {
		rows,
		category: {
			findUnique: async ({ where }: { where: { id: number } }) => rows.get(where.id) ?? null,
			update: async ({ where, data }: { where: { id: number }; data: Record<string, unknown> }) => {
				const row = rows.get(where.id) ?? { id: where.id, autoStopMessageId: null };
				Object.assign(row, data);
				rows.set(where.id, row);
				return row;
			},
		},
	};
}

function makeScheduler(qstash: ReturnType<typeof createFakeQStash>, db: ReturnType<typeof createFakeDb>) {
	return createAutoStopScheduler({
		qstashClient: qstash as never,
		db: db as never,
		webhookUrl: 'https://example.com/api/webhooks/qstash/auto-stop',
	});
}

function notFound(): Error {
	const error = new Error('message not found');
	(error as Error & { status: number }).status = 404;
	return error;
}

describe('scheduleAutoStop', () => {
	it('persists the message handle QStash returns so it can be cancelled later', async () => {
		const qstash = createFakeQStash();
		const db = createFakeDb({ 1: null });

		await makeScheduler(qstash, db).scheduleAutoStop(1, 42, new Date('2026-05-03T15:00:00Z'));

		// The id flowing from publishJSON's result must be the id stored on the category.
		expect(db.rows.get(1)?.autoStopMessageId).toBe('qstash-msg-1');
	});

	it('encodes the deadline as floored unix *seconds*, not milliseconds', async () => {
		const qstash = createFakeQStash();
		const db = createFakeDb({ 1: null });
		// Sub-second deadline proves the value is floored rather than truncated by chance.
		const deadline = new Date('2026-05-03T15:00:00.500Z');

		await makeScheduler(qstash, db).scheduleAutoStop(1, 42, deadline);

		const { notBefore, url, body } = qstash.published[0];
		expect(Number.isInteger(notBefore)).toBe(true);
		// Seconds, not ms: roughly a billion, far below the ms epoch.
		expect(notBefore).toBeLessThan(deadline.getTime());
		expect(notBefore).toBe(Math.floor(deadline.getTime() / 1000));
		// The .5s must have been dropped — a naive /1000 would not be an integer.
		expect(notBefore).not.toBe(deadline.getTime() / 1000);
		expect(url).toBe('https://example.com/api/webhooks/qstash/auto-stop');
		expect(body).toEqual({ categoryId: 1, competitionId: 42 });
	});
});

describe('cancelAutoStop', () => {
	it('deletes the stored message and clears the handle', async () => {
		const qstash = createFakeQStash();
		const db = createFakeDb({ 1: 'qstash-msg-456' });

		await makeScheduler(qstash, db).cancelAutoStop(1);

		expect(qstash.deleted).toEqual(['qstash-msg-456']);
		expect(db.rows.get(1)?.autoStopMessageId).toBeNull();
	});

	it('is a no-op when no message handle is stored', async () => {
		const qstash = createFakeQStash();
		const db = createFakeDb({ 1: null });

		await makeScheduler(qstash, db).cancelAutoStop(1);

		expect(qstash.deleted).toEqual([]);
		expect(db.rows.get(1)?.autoStopMessageId).toBeNull();
	});

	it('swallows a 404 from QStash (already delivered/expired) and still clears the handle', async () => {
		const qstash = createFakeQStash();
		qstash.setDeleteError(notFound());
		const db = createFakeDb({ 1: 'stale-msg' });

		await expect(makeScheduler(qstash, db).cancelAutoStop(1)).resolves.toBeUndefined();
		expect(db.rows.get(1)?.autoStopMessageId).toBeNull();
	});

	it('rethrows non-404 QStash errors and leaves the handle intact', async () => {
		const qstash = createFakeQStash();
		qstash.setDeleteError(new Error('QStash unavailable'));
		const db = createFakeDb({ 1: 'live-msg' });

		await expect(makeScheduler(qstash, db).cancelAutoStop(1)).rejects.toThrow('QStash unavailable');
		// The handle must survive so a later retry can still cancel it.
		expect(db.rows.get(1)?.autoStopMessageId).toBe('live-msg');
	});
});

describe('rescheduleAutoStop', () => {
	it('removes the old message and stores the freshly scheduled one', async () => {
		const qstash = createFakeQStash();
		const db = createFakeDb({ 1: 'qstash-old-msg' });
		const newDeadline = new Date('2026-05-03T16:00:00Z');

		await makeScheduler(qstash, db).rescheduleAutoStop(1, 42, newDeadline);

		expect(qstash.deleted).toEqual(['qstash-old-msg']);
		expect(qstash.published).toHaveLength(1);
		expect(qstash.published[0].notBefore).toBe(Math.floor(newDeadline.getTime() / 1000));

		// Cancel must run before scheduling, so the new handle is never the one deleted.
		const storedId = db.rows.get(1)?.autoStopMessageId;
		expect(storedId).toBe('qstash-msg-1');
		expect(qstash.deleted).not.toContain(storedId);
	});
});
