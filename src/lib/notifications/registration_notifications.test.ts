import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateNotification = vi.fn().mockResolvedValue({ id: 'notif-1' });
const mockCreateNotificationForUsers = vi.fn().mockResolvedValue({ count: 1 });

vi.mock('./notifications', () => ({
	createNotification: (...args: unknown[]) => mockCreateNotification(...args),
	createNotificationForUsers: (...args: unknown[]) => mockCreateNotificationForUsers(...args),
}));

vi.mock('$lib/.prisma/generated/prisma/enums', () => ({
	NotificationType: {
		REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
		REGISTRATION_REFUSED: 'REGISTRATION_REFUSED',
		REGISTRATION_PROMOTED: 'REGISTRATION_PROMOTED',
		REGISTRATION_WAITLISTED: 'REGISTRATION_WAITLISTED',
		PAYMENT_REMINDER: 'PAYMENT_REMINDER',
	},
	RegistrationStatus: {
		PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
		CONFIRMED: 'CONFIRMED',
		WAITLISTED: 'WAITLISTED',
	},
}));

vi.mock('$lib/utils/category_utils', () => ({
	getCategoryTypeName: vi.fn().mockReturnValue('category_names.individual'),
}));

import { notifyRegistrationRefused, notifyRegistrationConfirmed } from './registration_notifications';

// ── Helpers ──

function makeEntry(overrides: Record<string, unknown> = {}) {
	return {
		creatorId: 'creator-1',
		users: [{ id: 'user-1', name: 'Alice' }],
		externalParticipants: [],
		category: {
			competitionId: 42,
			description: 'Individual',
			subname: null,
			type: 'INDIVIDUAL',
			competition: { name: 'Speed Cup' },
		},
		...overrides,
	};
}

// ══════════════════════════════════════════════════════════════════════════
// notifyRegistrationRefused
// ══════════════════════════════════════════════════════════════════════════

describe('notifyRegistrationRefused', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Given creator is a participant, when refusal notified, then one notification to that user', async () => {
		const entry = makeEntry({ creatorId: 'user-1' });
		await notifyRegistrationRefused(entry);

		expect(mockCreateNotification).toHaveBeenCalledOnce();
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-1',
				type: 'REGISTRATION_REFUSED',
				title: 'notifications.titles.registration_refused',
				message: 'notifications.messages.registration_refused',
			}),
		);
	});

	it('Given creator is NOT a participant, when refusal notified, then participant AND creator notified', async () => {
		const entry = makeEntry({
			creatorId: 'creator-not-user',
			users: [{ id: 'user-1', name: 'Alice' }],
		});
		await notifyRegistrationRefused(entry);

		expect(mockCreateNotification).toHaveBeenCalledTimes(2);

		// Participant notification
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-1',
				type: 'REGISTRATION_REFUSED',
			}),
		);

		// Creator notification with nonplatform key
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'creator-not-user',
				type: 'REGISTRATION_REFUSED',
				title: 'notifications.titles.registration_refused_nonplatform',
				message: 'notifications.messages.registration_refused_nonplatform',
				translationKey: 'registration_refused_nonplatform',
			}),
		);
	});

	it('Given external-only entry, when refusal notified, then creator receives notification', async () => {
		const entry = makeEntry({
			creatorId: 'creator-1',
			users: [],
			externalParticipants: [{ name: 'Ext User' }],
		});
		await notifyRegistrationRefused(entry);

		// No platform users to notify, but creator gets nonplatform notification
		expect(mockCreateNotification).toHaveBeenCalledOnce();
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'creator-1',
				type: 'REGISTRATION_REFUSED',
				title: 'notifications.titles.registration_refused_nonplatform',
				data: expect.objectContaining({ participantNames: 'Ext User' }),
			}),
		);
	});

	it('Given team entry with teammates, when refusal notified, then team variant keys used', async () => {
		const entry = makeEntry({
			creatorId: 'user-1',
			users: [
				{ id: 'user-1', name: 'Alice' },
				{ id: 'user-2', name: 'Bob' },
			],
		});
		await notifyRegistrationRefused(entry);

		expect(mockCreateNotification).toHaveBeenCalledTimes(2);

		// Each user gets the team variant
		for (const call of mockCreateNotification.mock.calls) {
			expect(call[0].title).toBe('notifications.titles.registration_refused_team');
			expect(call[0].message).toBe('notifications.messages.registration_refused_team');
			expect(call[0].translationKey).toBe('registration_refused_team');
		}
	});

	it('Given entry with external teammates, when refusal notified, then team variant used with external names in teammateNames', async () => {
		const entry = makeEntry({
			creatorId: 'user-1',
			users: [{ id: 'user-1', name: 'Alice' }],
			externalParticipants: [{ name: 'External Bob' }],
		});
		await notifyRegistrationRefused(entry);

		expect(mockCreateNotification).toHaveBeenCalledOnce();
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'notifications.titles.registration_refused_team',
				data: expect.objectContaining({ teammateNames: 'External Bob' }),
			}),
		);
	});

	it('Given actorName provided, when refusal notified, then actorName is passed through', async () => {
		const entry = makeEntry({ creatorId: 'user-1' });
		await notifyRegistrationRefused(entry, 'OrganizerJohn');

		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({ actorName: 'OrganizerJohn' }),
		);
	});
});

// ══════════════════════════════════════════════════════════════════════════
// notifyRegistrationConfirmed — mirrors refusal pattern, validates parity
// ══════════════════════════════════════════════════════════════════════════

describe('notifyRegistrationConfirmed (parity check)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Given creator is NOT a participant, when confirmed, then both participant and creator notified', async () => {
		const entry = makeEntry({
			creatorId: 'creator-not-user',
			users: [{ id: 'user-1', name: 'Alice' }],
		});
		await notifyRegistrationConfirmed(entry, 'Organizer');

		expect(mockCreateNotification).toHaveBeenCalledTimes(2);

		// Creator should get nonplatform notification
		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'creator-not-user',
				translationKey: 'registration_confirmed_nonplatform',
			}),
		);
	});
});
