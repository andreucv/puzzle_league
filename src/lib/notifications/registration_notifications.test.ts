import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/.prisma/generated/prisma/enums', () => ({
	NotificationType: {
		REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
		REGISTRATION_REFUSED: 'REGISTRATION_REFUSED',
		REGISTRATION_PROMOTED: 'REGISTRATION_PROMOTED',
		REGISTRATION_WAITLISTED: 'REGISTRATION_WAITLISTED',
		REGISTRATION_CREATED: 'REGISTRATION_CREATED',
		PAYMENT_REMINDER: 'PAYMENT_REMINDER',
		TABLE_ASSIGNED: 'TABLE_ASSIGNED',
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

import {
	notificationsForRegistrationRefused,
	notificationsForRegistrationConfirmed,
	notificationsForPaymentReminder,
} from './registration_notifications';
import type { NotificationIntent } from './dispatcher';

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

/** All distinct recipients across an intent array. */
function recipients(intents: NotificationIntent[]): string[] {
	return intents.flatMap((i) => i.userIds);
}

// ══════════════════════════════════════════════════════════════════════════
// notificationsForRegistrationRefused — table-driven over entry composition
// ══════════════════════════════════════════════════════════════════════════

describe('notificationsForRegistrationRefused', () => {
	it('Given creator is a participant, then one intent to that user', () => {
		const intents = notificationsForRegistrationRefused(makeEntry({ creatorId: 'user-1' }) as never);

		expect(intents).toHaveLength(1);
		expect(intents[0]).toMatchObject({
			userIds: ['user-1'],
			type: 'REGISTRATION_REFUSED',
			title: 'notifications.titles.registration_refused',
			message: 'notifications.messages.registration_refused',
		});
	});

	it('Given creator is NOT a participant, then participant AND creator intents', () => {
		const intents = notificationsForRegistrationRefused(
			makeEntry({ creatorId: 'creator-not-user', users: [{ id: 'user-1', name: 'Alice' }] }) as never,
		);

		expect(intents).toHaveLength(2);
		expect(intents[0]).toMatchObject({ userIds: ['user-1'], type: 'REGISTRATION_REFUSED' });
		expect(intents[1]).toMatchObject({
			userIds: ['creator-not-user'],
			type: 'REGISTRATION_REFUSED',
			title: 'notifications.titles.registration_refused_nonplatform',
			message: 'notifications.messages.registration_refused_nonplatform',
			translationKey: 'registration_refused_nonplatform',
		});
	});

	it('Given external-only entry, then only the creator intent (with participant names)', () => {
		const intents = notificationsForRegistrationRefused(
			makeEntry({ creatorId: 'creator-1', users: [], externalParticipants: [{ name: 'Ext User' }] }) as never,
		);

		expect(intents).toHaveLength(1);
		expect(intents[0]).toMatchObject({
			userIds: ['creator-1'],
			type: 'REGISTRATION_REFUSED',
			title: 'notifications.titles.registration_refused_nonplatform',
			data: expect.objectContaining({ participantNames: 'Ext User' }),
		});
	});

	it('Given a team entry, then every intent uses the team variant keys', () => {
		const intents = notificationsForRegistrationRefused(
			makeEntry({
				creatorId: 'user-1',
				users: [
					{ id: 'user-1', name: 'Alice' },
					{ id: 'user-2', name: 'Bob' },
				],
			}) as never,
		);

		expect(intents).toHaveLength(2);
		for (const intent of intents) {
			expect(intent.title).toBe('notifications.titles.registration_refused_team');
			expect(intent.message).toBe('notifications.messages.registration_refused_team');
			expect(intent.translationKey).toBe('registration_refused_team');
		}
	});

	it('Given an external teammate, then the team variant lists the external name in teammateNames', () => {
		const intents = notificationsForRegistrationRefused(
			makeEntry({
				creatorId: 'user-1',
				users: [{ id: 'user-1', name: 'Alice' }],
				externalParticipants: [{ name: 'External Bob' }],
			}) as never,
		);

		expect(intents).toHaveLength(1);
		expect(intents[0]).toMatchObject({
			title: 'notifications.titles.registration_refused_team',
			data: expect.objectContaining({ teammateNames: 'External Bob' }),
		});
	});

	it('Given an actorName, then it is carried on the intent', () => {
		const intents = notificationsForRegistrationRefused(makeEntry({ creatorId: 'user-1' }) as never, 'OrganizerJohn');

		expect(intents[0]).toMatchObject({ actorName: 'OrganizerJohn' });
	});
});

// ══════════════════════════════════════════════════════════════════════════
// notificationsForRegistrationConfirmed — mirrors refusal pattern, parity check
// ══════════════════════════════════════════════════════════════════════════

describe('notificationsForRegistrationConfirmed (parity check)', () => {
	it('Given creator is NOT a participant, then both participant and creator intents', () => {
		const intents = notificationsForRegistrationConfirmed(
			makeEntry({ creatorId: 'creator-not-user', users: [{ id: 'user-1', name: 'Alice' }] }) as never,
			'Organizer',
		);

		expect(intents).toHaveLength(2);
		expect(intents[1]).toMatchObject({
			userIds: ['creator-not-user'],
			translationKey: 'registration_confirmed_nonplatform',
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════
// notificationsForPaymentReminder — count is derived from intent recipients
// ══════════════════════════════════════════════════════════════════════════

describe('notificationsForPaymentReminder', () => {
	it('Given no entries, then no intents', () => {
		expect(notificationsForPaymentReminder([])).toEqual([]);
	});

	it('Given a participant entry, then the distinct recipient count is derivable', () => {
		const intents = notificationsForPaymentReminder([
			makeEntry({ creatorId: 'user-1' }) as never,
		]);

		const distinct = new Set(recipients(intents)).size;
		expect(distinct).toBe(1);
		expect(intents[0]).toMatchObject({ userIds: ['user-1'], type: 'PAYMENT_REMINDER' });
	});

	it('Given a creator who is not a participant, then both are counted', () => {
		const intents = notificationsForPaymentReminder([
			makeEntry({ creatorId: 'creator-x', users: [{ id: 'user-1', name: 'Alice' }] }) as never,
		]);

		expect(new Set(recipients(intents)).size).toBe(2);
	});
});
