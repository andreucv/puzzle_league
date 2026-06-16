import { describe, it, expect, vi } from 'vitest';
import { makeEntryData } from '$tests/factories';

const mockConfirmRegistration = vi.fn();
const mockCapture = vi.fn();

vi.mock('$lib/services/registration-workflow', () => ({
	confirmRegistration: (...args: unknown[]) => mockConfirmRegistration(...args),
	isRegistrationWorkflowError: (error: unknown) => Boolean((error as { code?: string })?.code),
	registrationWorkflowHttpStatus: (error: { code: string }) => error.code === 'ENTRY_NOT_FOUND' ? 404 : 400,
}));

vi.mock('$lib/server/posthog', () => ({
	getPostHogClient: () => ({ capture: mockCapture }),
}));

import { POST } from './+server';

function makeEvent(id: string, user?: { id: string; name?: string }) {
	return {
		params: { id },
		locals: { user },
	} as any;
}

describe('POST /api/registrations/[id]/confirm', () => {
	it('Given valid entry, when workflow succeeds, then returns success', async () => {
		const entry = makeEntryData();
		mockConfirmRegistration.mockResolvedValue({ entry });

		const response = await POST(makeEvent('entry-1', { id: 'organizer-1', name: 'Organizer' }));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: entry });
		expect(mockConfirmRegistration).toHaveBeenCalledWith({
			entryId: 'entry-1',
			actor: { userId: 'organizer-1', name: 'Organizer', isOrganizer: false },
		});
	});

	it('Given entry not found, when workflow throws, then returns 404', async () => {
		mockConfirmRegistration.mockRejectedValue({
			code: 'ENTRY_NOT_FOUND',
			message: 'Entry not found',
		});

		const response = await POST(makeEvent('missing', { id: 'organizer-1' }));

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Entry not found' });
	});

	it('Given invalid status, when workflow throws, then returns 400', async () => {
		mockConfirmRegistration.mockRejectedValue({
			code: 'INVALID_STATUS',
			message: 'Only pending confirmation registrations can be confirmed',
		});

		const response = await POST(makeEvent('entry-1', { id: 'organizer-1' }));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Only pending confirmation registrations can be confirmed' });
	});

	it('Given successful confirmation, when route captures analytics, then uses workflow metadata', async () => {
		mockConfirmRegistration.mockResolvedValue({ entry: makeEntryData() });

		await POST(makeEvent('entry-1', { id: 'organizer-1' }));

		expect(mockCapture).toHaveBeenCalledWith(expect.objectContaining({
			distinctId: 'organizer-1',
			event: 'registration_confirmed',
			properties: expect.objectContaining({
				entry_id: 'entry-1',
				competition_id: 42,
				competition_name: 'Speed Cup',
				category_type: 'INDIVIDUAL',
			}),
		}));
	});

	it('Given empty entry ID, when POST called, then returns 400', async () => {
		const response = await POST(makeEvent('', { id: 'organizer-1' }));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid entry ID' });
	});

	it('Given no logged-in user, when POST called, then returns 401', async () => {
		const response = await POST(makeEvent('entry-1'));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'You must be logged in' });
		expect(mockConfirmRegistration).not.toHaveBeenCalled();
	});
});
