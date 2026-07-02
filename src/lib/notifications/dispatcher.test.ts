import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '$tests/mocks/prisma';

const mockCapture = vi.fn();

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));

const mockCreateMany = prismaMock.notification.createMany;

vi.mock('$prisma/enums', () => ({
	NotificationType: {
		REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
		REGISTRATION_REFUSED: 'REGISTRATION_REFUSED',
		REGISTRATION_PROMOTED: 'REGISTRATION_PROMOTED',
		PAYMENT_REMINDER: 'PAYMENT_REMINDER',
		REGISTRATION_WAITLISTED: 'REGISTRATION_WAITLISTED',
		TABLE_ASSIGNED: 'TABLE_ASSIGNED',
		GENERAL: 'GENERAL',
	},
}));

vi.mock('$lib/server/posthog', () => ({
	getPostHogClient: () => ({ capture: (...args: unknown[]) => mockCapture(...args) }),
}));

import { dispatchNotifications, type NotificationIntent, type NotificationChannel } from './dispatcher';

function makeChannel(result: { sent: number; failed: number }): NotificationChannel {
	return { send: vi.fn().mockResolvedValue(result) };
}

const emailEnabledIntent: NotificationIntent = {
	userIds: ['user-1', 'user-2'],
	type: 'REGISTRATION_CONFIRMED' as never,
	title: 'notifications.titles.registration_confirmed',
	message: 'notifications.messages.registration_confirmed',
	link: '/competitions/competition_details/42',
	data: { categoryName: 'Individual' },
};

const nonEmailIntent: NotificationIntent = {
	userIds: ['user-3'],
	type: 'REGISTRATION_WAITLISTED' as never,
	title: 'notifications.titles.registration_waitlisted',
	message: 'notifications.messages.registration_waitlisted',
	link: '/competitions/competition_details/42',
};

describe('dispatchNotifications', () => {
	beforeEach(() => {
		mockCreateMany.mockResolvedValue({ count: 1 });
	});

	it('persists one createMany per intent and sums the row count', async () => {
		mockCreateMany.mockResolvedValueOnce({ count: 2 }).mockResolvedValueOnce({ count: 1 });
		const channel = makeChannel({ sent: 1, failed: 0 });

		const result = await dispatchNotifications([emailEnabledIntent, nonEmailIntent], channel);

		expect(mockCreateMany).toHaveBeenCalledTimes(2);
		expect(result.persisted).toBe(3);
	});

	it('routes only email-enabled intents that carry a link to the channel', async () => {
		const channel = makeChannel({ sent: 1, failed: 0 });

		await dispatchNotifications(
			[emailEnabledIntent, nonEmailIntent, { ...emailEnabledIntent, link: undefined }],
			channel,
		);

		expect(channel.send).toHaveBeenCalledOnce();
		const routed = (channel.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as NotificationIntent[];
		expect(routed).toEqual([emailEnabledIntent]);
	});

	it('does not call the channel when no intent is email-enabled', async () => {
		const channel = makeChannel({ sent: 0, failed: 0 });

		const result = await dispatchNotifications([nonEmailIntent], channel);

		expect(channel.send).not.toHaveBeenCalled();
		expect(result.emailed).toBe(0);
		expect(result.emailFailures).toBe(0);
	});

	it('counts email failures without throwing', async () => {
		const channel = makeChannel({ sent: 0, failed: 1 });

		const result = await dispatchNotifications([emailEnabledIntent], channel);

		expect(result.emailFailures).toBe(1);
		expect(result.emailed).toBe(0);
	});

	it('does not roll back when persistence throws — logs and continues', async () => {
		mockCreateMany.mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce({ count: 1 });
		const channel = makeChannel({ sent: 0, failed: 0 });

		const result = await dispatchNotifications([nonEmailIntent, nonEmailIntent], channel);

		expect(result.persisted).toBe(1);
	});

	it('emits a notification_dispatch PostHog capture with the batch summary', async () => {
		mockCreateMany.mockResolvedValue({ count: 2 });
		const channel = makeChannel({ sent: 1, failed: 0 });

		await dispatchNotifications([emailEnabledIntent], channel);

		expect(mockCapture).toHaveBeenCalledOnce();
		expect(mockCapture).toHaveBeenCalledWith({
			distinctId: 'server',
			event: 'notification_dispatch',
			properties: { persisted: 2, emailed: 1, emailFailures: 0, types: ['REGISTRATION_CONFIRMED'] },
		});
	});
});
