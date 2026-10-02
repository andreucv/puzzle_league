import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { handleRegistrationOpenWebhook } from './registration-open-webhook';
import { MAX_HOP_MS, nextDeliveryTime } from './registration-open-scheduler';

const OPENS_AT = new Date('2026-10-01T10:00:00.000Z');

function makeDb() {
	return {
		category: {
			findUnique: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		},
	};
}

function makeCategory(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		status: 'NOT_STARTED',
		registrationOpen: false,
		registrationOpensAt: OPENS_AT,
		competitionId: 42,
		competition: { creatorId: 'org-1', name: 'Speed Cup' },
		...overrides,
	};
}

describe('registration-open webhook handler', () => {
	let db: ReturnType<typeof makeDb>;
	const receiver = { verify: vi.fn() };
	const scheduler = { publish: vi.fn() };
	const dispatch = vi.fn();
	const followersNotifier = { publish: vi.fn() };

	beforeEach(() => {
		vi.clearAllMocks();
		db = makeDb();
		receiver.verify.mockResolvedValue(true);
		followersNotifier.publish.mockResolvedValue(undefined);
	});

	function call(now: Date = OPENS_AT, body = { categoryId: 1, opensAt: OPENS_AT.toISOString() }) {
		return handleRegistrationOpenWebhook({
			signature: 'sig',
			body: JSON.stringify(body),
			receiver: receiver as any,
			db: db as any,
			scheduler,
			dispatchNotifications: dispatch,
			followersNotifier,
			now,
		});
	}

	it('rejects an invalid signature with 401', async () => {
		receiver.verify.mockResolvedValue(false);

		const result = await call();

		expect(result.status).toBe(401);
		expect(db.category.findUnique).not.toHaveBeenCalled();
	});

	it('opens the category when due and notifies the organizer', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory());

		const result = await call();

		expect(result.status).toBe(200);
		expect(db.category.updateMany).toHaveBeenCalledWith({
			where: { id: 1, registrationOpensAt: OPENS_AT, registrationOpen: false },
			data: { registrationOpen: true, registrationOpensAt: null },
		});
		expect(dispatch).toHaveBeenCalledWith([expect.objectContaining({ userIds: ['org-1'], type: 'REGISTRATION_OPENED' })]);
	});

	it('ignores a stale message whose opensAt no longer matches (rescheduled or cancelled)', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory({ registrationOpensAt: null }));

		const result = await call();

		expect(result.status).toBe(200);
		expect(db.category.updateMany).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('clears the schedule without opening when the category already started', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory({ status: 'LIVE' }));

		const result = await call();

		expect(result.status).toBe(200);
		expect(db.category.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { registrationOpensAt: null } });
		expect(db.category.updateMany).not.toHaveBeenCalled();
	});

	it('publishes the next hop when delivered before opensAt (long schedules)', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory());

		const result = await call(new Date(OPENS_AT.getTime() - 3 * 24 * 60 * 60 * 1000));

		expect(result.status).toBe(200);
		expect(scheduler.publish).toHaveBeenCalledWith(1, OPENS_AT);
		expect(db.category.updateMany).not.toHaveBeenCalled();
	});

	it('does not notify when a concurrent manual change won the race', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory());
		db.category.updateMany.mockResolvedValue({ count: 0 });

		await call();

		expect(dispatch).not.toHaveBeenCalled();
		expect(followersNotifier.publish).not.toHaveBeenCalled();
	});

	it('triggers the async follower notification after opening', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory());

		await call();

		expect(followersNotifier.publish).toHaveBeenCalledWith(1);
	});

	it('does not trigger follower notification for a stale message or an early hop', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory({ registrationOpensAt: null }));
		await call();
		db.category.findUnique.mockResolvedValue(makeCategory());
		await call(new Date(OPENS_AT.getTime() - 3 * 24 * 60 * 60 * 1000));

		expect(followersNotifier.publish).not.toHaveBeenCalled();
	});

	it('still reports the opening when publishing the follower notification fails', async () => {
		db.category.findUnique.mockResolvedValue(makeCategory());
		followersNotifier.publish.mockRejectedValue(new Error('qstash down'));
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await call();

		expect(result).toEqual({ status: 200, body: { message: 'Registration opened' } });
		expect(dispatch).toHaveBeenCalled();
	});
});

describe('nextDeliveryTime', () => {
	const now = new Date('2026-09-18T12:00:00.000Z');

	it('delivers at opensAt when it is within the max hop', () => {
		const opensAt = new Date(now.getTime() + 60_000);
		expect(nextDeliveryTime(opensAt, now)).toEqual(opensAt);
	});

	it('caps delivery at the max hop for far-future openings', () => {
		const opensAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
		expect(nextDeliveryTime(opensAt, now)).toEqual(new Date(now.getTime() + MAX_HOP_MS));
	});
});
