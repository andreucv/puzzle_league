import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { handleTableReminderWebhook } from './table-reminder-webhook';

const START = new Date('2026-10-01T12:00:00.000Z');
const DUE = new Date('2026-10-01T11:00:00.000Z');

function makeDb() {
	return {
		category: {
			findUnique: vi.fn(),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		},
		entry: {
			findMany: vi.fn(),
		},
	};
}

function makeCategory(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		status: 'NOT_STARTED',
		startTime: START,
		tableReminderSentAt: null,
		competitionId: 42,
		description: '',
		subname: null,
		type: 'INDIVIDUAL',
		competition: { name: 'Speed Cup' },
		...overrides,
	};
}

const ENTRIES = [
	{ id: 'e1', tableNumber: 1, creatorId: 'u1', users: [{ id: 'u1', name: 'Ann' }], externalParticipants: [] },
	{ id: 'e2', tableNumber: 2, creatorId: 'u2', users: [{ id: 'u2', name: 'Bob' }], externalParticipants: [] },
];

describe('table-reminder webhook handler', () => {
	let db: ReturnType<typeof makeDb>;
	const receiver = { verify: vi.fn() };
	const scheduler = { publish: vi.fn() };
	const dispatch = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		db = makeDb();
		receiver.verify.mockResolvedValue(true);
		db.category.findUnique.mockResolvedValue(makeCategory());
		db.entry.findMany.mockResolvedValue(ENTRIES);
	});

	function call(now: Date = DUE, body = { categoryId: 1, startTime: START.toISOString() }) {
		return handleTableReminderWebhook({
			signature: 'sig',
			body: JSON.stringify(body),
			receiver: receiver as any,
			db: db as any,
			scheduler,
			dispatchNotifications: dispatch,
			now,
		});
	}

	it('rejects an invalid signature with 401', async () => {
		receiver.verify.mockResolvedValue(false);

		const result = await call();

		expect(result.status).toBe(401);
		expect(db.category.findUnique).not.toHaveBeenCalled();
	});

	it('claims and sends TABLE_ASSIGNED to every tabled entry when due', async () => {
		const result = await call();

		expect(result.status).toBe(200);
		expect(db.category.updateMany).toHaveBeenCalledWith({
			where: { id: 1, tableReminderSentAt: null },
			data: { tableReminderSentAt: DUE },
		});
		expect(dispatch).toHaveBeenCalledTimes(1);
		const intents = dispatch.mock.calls[0][0];
		expect(intents).toHaveLength(2);
		expect(intents.map((i: any) => i.type)).toEqual(['TABLE_ASSIGNED', 'TABLE_ASSIGNED']);
		expect(intents.map((i: any) => i.data.tableNumber)).toEqual([1, 2]);
	});

	it('ignores a stale message after the start time moved', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory({ startTime: new Date('2026-10-02T12:00:00.000Z') }));

		const result = await call();

		expect(result.body.message).toBe('Stale schedule');
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('ignores a missing category', async () => {
		db.category.findUnique.mockResolvedValue(null);

		const result = await call();

		expect(result.body.message).toBe('Stale schedule');
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('does nothing when the category is not NOT_STARTED', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory({ status: 'CANCELED' }));

		const result = await call();

		expect(result.body.message).toBe('Not applicable');
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('does nothing when the reminder was already sent', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory({ tableReminderSentAt: new Date('2026-10-01T10:59:00.000Z') }));

		const result = await call();

		expect(result.body.message).toBe('Not applicable');
		expect(db.category.updateMany).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('publishes the next hop when delivered early', async () => {
		const result = await call(new Date('2026-09-28T11:00:00.000Z'));

		expect(result.body.message).toBe('Rescheduled next hop');
		expect(scheduler.publish).toHaveBeenCalledWith(1, START);
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('sends nothing and does not claim when no entry has a table', async () => {
		db.entry.findMany.mockResolvedValue([]);

		const result = await call();

		expect(result.body.message).toBe('No tables');
		expect(db.category.updateMany).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('does not send twice when a concurrent message already claimed', async () => {
		db.category.updateMany.mockResolvedValue({ count: 0 });

		const result = await call();

		expect(result.body.message).toBe('Already sent');
		expect(dispatch).not.toHaveBeenCalled();
	});
});
