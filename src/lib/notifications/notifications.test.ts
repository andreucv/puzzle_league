import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrismaCreate = vi.fn().mockResolvedValue({ id: 'notif-1' });
const mockPrismaCreateMany = vi.fn().mockResolvedValue({ count: 1 });
const mockSendEmail = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/database/create_prisma_client', () => ({
	prisma: {
		notification: {
			create: (...args: unknown[]) => mockPrismaCreate(...args),
			createMany: (...args: unknown[]) => mockPrismaCreateMany(...args),
		},
	},
}));

vi.mock('$lib/.prisma/generated/prisma/enums', () => ({
	NotificationType: {
		REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
		REGISTRATION_REFUSED: 'REGISTRATION_REFUSED',
		REGISTRATION_PROMOTED: 'REGISTRATION_PROMOTED',
		PAYMENT_REMINDER: 'PAYMENT_REMINDER',
		GENERAL: 'GENERAL',
	},
}));

vi.mock('$lib/emails/send_email_utils', () => ({
	sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { createNotification, createNotificationForUsers } from './notifications';

describe('EMAIL_ENABLED_TYPES includes REGISTRATION_REFUSED', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Given REGISTRATION_REFUSED type, when createNotification called with a link, then sendEmail is triggered', async () => {
		await createNotification({
			userId: 'user-1',
			type: 'REGISTRATION_REFUSED' as any,
			title: 'notifications.titles.registration_refused',
			message: 'notifications.messages.registration_refused',
			link: '/competitions/competition_details/42',
			data: { categoryName: 'Individual' },
		});

		expect(mockPrismaCreate).toHaveBeenCalledOnce();
		expect(mockSendEmail).toHaveBeenCalledOnce();
		expect(mockSendEmail).toHaveBeenCalledWith(
			['user-1'],
			'REGISTRATION_REFUSED',
			'/competitions/competition_details/42',
			expect.objectContaining({ categoryName: 'Individual' }),
			undefined,
			undefined,
		);
	});

	it('Given REGISTRATION_REFUSED type, when createNotificationForUsers called, then sendEmail is triggered', async () => {
		await createNotificationForUsers(
			['user-1', 'user-2'],
			'REGISTRATION_REFUSED' as any,
			'notifications.titles.registration_refused',
			'notifications.messages.registration_refused',
			'/competitions/competition_details/42',
			{ categoryName: 'Individual' },
		);

		expect(mockPrismaCreateMany).toHaveBeenCalledOnce();
		expect(mockSendEmail).toHaveBeenCalledOnce();
		expect(mockSendEmail).toHaveBeenCalledWith(
			['user-1', 'user-2'],
			'REGISTRATION_REFUSED',
			'/competitions/competition_details/42',
			expect.objectContaining({ categoryName: 'Individual' }),
			undefined,
			undefined,
		);
	});

	it('Given GENERAL type, when createNotification called, then sendEmail is NOT triggered', async () => {
		await createNotification({
			userId: 'user-1',
			type: 'GENERAL' as any,
			title: 'Test',
			message: 'Test message',
			link: '/some-link',
		});

		expect(mockPrismaCreate).toHaveBeenCalledOnce();
		expect(mockSendEmail).not.toHaveBeenCalled();
	});
});
