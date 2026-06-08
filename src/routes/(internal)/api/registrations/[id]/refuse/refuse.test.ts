import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRefuseRegistration = vi.fn();
const mockCapture = vi.fn();

vi.mock('$lib/services/registration-workflow', () => ({
	refuseRegistration: (...args: unknown[]) => mockRefuseRegistration(...args),
	isRegistrationWorkflowError: (error: unknown) => Boolean((error as { code?: string })?.code),
	registrationWorkflowHttpStatus: (error: { code: string }) => error.code === 'ENTRY_NOT_FOUND' ? 404 : 400,
}));

vi.mock('$lib/server/posthog', () => ({
	getPostHogClient: () => ({ capture: mockCapture }),
}));

vi.mock('@sveltejs/kit', () => ({
	json: (data: unknown, init?: { status?: number }) => {
		return { body: data, status: init?.status ?? 200 };
	},
}));

import { POST } from './+server';

function makeEvent(id: string, user?: { id: string; name?: string }) {
	return {
		params: { id },
		locals: { user },
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

	it('Given valid entry, when workflow succeeds, then returns success', async () => {
		const entryData = makeEntryData();
		mockRefuseRegistration.mockResolvedValue({
			entry: entryData,
			promotedEntry: null,
		});

		const response = await POST(makeEvent('entry-1', { id: 'organizer-1', name: 'Organizer' }));

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ success: true, data: entryData });
		expect(mockRefuseRegistration).toHaveBeenCalledWith({
			entryId: 'entry-1',
			actor: { userId: 'organizer-1', name: 'Organizer', isOrganizer: false },
		});
	});

	it('Given entry not found, when workflow throws, then returns 404', async () => {
		mockRefuseRegistration.mockRejectedValue({
			code: 'ENTRY_NOT_FOUND',
			message: 'Entry not found',
		});

		const response = await POST(makeEvent('nonexistent', { id: 'organizer-1' }));

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: 'Entry not found' });
	});

	it('Given invalid status, when workflow throws validation error, then returns 400', async () => {
		mockRefuseRegistration.mockRejectedValue({
			code: 'INVALID_STATUS',
			message: 'Only pending, confirmed, or waitlisted registrations can be refused',
		});

		const response = await POST(makeEvent('entry-1', { id: 'organizer-1' }));

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: 'Only pending, confirmed, or waitlisted registrations can be refused' });
	});

	it('Given promoted entry, when workflow succeeds, then capture includes promotion flag', async () => {
		const entryData = makeEntryData();
		mockRefuseRegistration.mockResolvedValue({
			entry: entryData,
			promotedEntry: { id: 'promoted-1' },
		});

		await POST(makeEvent('entry-1', { id: 'organizer-1' }));

		expect(mockCapture).toHaveBeenCalledWith(expect.objectContaining({
			event: 'registration_refused',
			properties: expect.objectContaining({ waitlist_promoted: true }),
		}));
	});

	it('Given empty entry ID, when POST called, then returns 400', async () => {
		const response = await POST(makeEvent('', { id: 'organizer-1' }));

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: 'Invalid entry ID' });
	});

	it('Given no logged-in user, when POST called, then returns 401', async () => {
		const response = await POST(makeEvent('entry-1'));

		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: 'You must be logged in' });
		expect(mockRefuseRegistration).not.toHaveBeenCalled();
	});
});
