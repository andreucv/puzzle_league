import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──
const mockRefuseRegistration = vi.fn();
const mockNotifyRefused = vi.fn().mockResolvedValue(undefined);
const mockNotifyPromotion = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/database/db_registration', () => ({
	refuseRegistration: (...args: unknown[]) => mockRefuseRegistration(...args),
}));

vi.mock('$lib/notifications/registration_notifications', () => ({
	notifyRegistrationRefused: (...args: unknown[]) => mockNotifyRefused(...args),
	notifyWaitlistPromotion: (...args: unknown[]) => mockNotifyPromotion(...args),
}));

vi.mock('@sveltejs/kit', () => ({
	json: (data: unknown, init?: { status?: number }) => {
		return { body: data, status: init?.status ?? 200 };
	},
}));

import { POST } from './+server';

function makeEvent(id: string, userName?: string) {
	return {
		params: { id },
		locals: { user: userName ? { name: userName } : undefined },
	} as any;
}

function makeEntryData() {
	return {
		id: 'entry-1',
		creatorId: 'user-1',
		users: [{ id: 'user-1', name: 'Alice' }],
		externalParticipants: [],
		category: {
			competitionId: 42,
			description: 'Individual',
			subname: null,
			type: 'INDIVIDUAL',
			competition: { name: 'Speed Cup' },
		},
	};
}

describe('POST /api/registrations/[id]/refuse', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Given valid entry, when refuseRegistration succeeds, then returns success', async () => {
		const entryData = makeEntryData();
		mockRefuseRegistration.mockResolvedValue({
			success: true,
			data: entryData,
			promotedEntry: null,
		});

		const response = await POST(makeEvent('entry-1', 'Organizer'));

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ success: true, data: entryData });
		expect(mockNotifyRefused).toHaveBeenCalledOnce();
		expect(mockNotifyRefused).toHaveBeenCalledWith(entryData, 'Organizer');
	});

	it('Given entry not found, when refuseRegistration fails, then returns 404', async () => {
		mockRefuseRegistration.mockResolvedValue({
			success: false,
			error: 'Entry not found',
		});

		const response = await POST(makeEvent('nonexistent'));

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: 'Entry not found' });
		expect(mockNotifyRefused).not.toHaveBeenCalled();
	});

	it('Given invalid status, when refuseRegistration fails with validation, then returns 400', async () => {
		mockRefuseRegistration.mockResolvedValue({
			success: false,
			error: 'Only pending, confirmed, or waitlisted registrations can be refused',
		});

		const response = await POST(makeEvent('entry-1'));

		expect(response.status).toBe(400);
		expect(mockNotifyRefused).not.toHaveBeenCalled();
	});

	it('Given successful refusal with promoted entry, when mutation completes, then both refusal and promotion notifications sent', async () => {
		const entryData = makeEntryData();
		const promotedEntry = { ...makeEntryData(), id: 'promoted-1', status: 'PENDING_CONFIRMATION' };
		mockRefuseRegistration.mockResolvedValue({
			success: true,
			data: entryData,
			promotedEntry,
		});

		const response = await POST(makeEvent('entry-1', 'Organizer'));

		expect(response.status).toBe(200);
		expect(mockNotifyRefused).toHaveBeenCalledOnce();
		expect(mockNotifyPromotion).toHaveBeenCalledOnce();
		expect(mockNotifyPromotion).toHaveBeenCalledWith(promotedEntry, 'Organizer');
	});

	it('Given successful mutation, when refusal notification throws, then still returns success', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const entryData = makeEntryData();
		mockRefuseRegistration.mockResolvedValue({
			success: true,
			data: entryData,
			promotedEntry: null,
		});
		mockNotifyRefused.mockRejectedValue(new Error('Email service down'));

		const response = await POST(makeEvent('entry-1'));

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ success: true, data: entryData });
		expect(consoleSpy).toHaveBeenCalledWith(
			'[refuse] Failed to send refusal notifications:',
			expect.any(Error),
		);
		consoleSpy.mockRestore();
	});

	it('Given successful mutation, when promotion notification throws, then still returns success', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const entryData = makeEntryData();
		const promotedEntry = { ...makeEntryData(), id: 'promoted-1' };
		mockRefuseRegistration.mockResolvedValue({
			success: true,
			data: entryData,
			promotedEntry,
		});
		mockNotifyPromotion.mockRejectedValue(new Error('Notification DB timeout'));

		const response = await POST(makeEvent('entry-1'));

		expect(response.status).toBe(200);
		expect(consoleSpy).toHaveBeenCalledWith(
			'[refuse] Failed to send waitlist-promotion notifications:',
			expect.any(Error),
		);
		consoleSpy.mockRestore();
	});

	it('Given empty entry ID, when POST called, then returns 400', async () => {
		const response = await POST(makeEvent(''));

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: 'Invalid entry ID' });
	});
});
