import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/static/private', () => ({
	SCW_SECRET_KEY: 'test-secret',
	SCW_DEFAULT_PROJECT_ID: 'test-project',
}));

const dynamicEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }));

import { parseAddress, sendScalewayEmail } from './scaleway_email';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('sendScalewayEmail', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		delete dynamicEnv.MOCK_EMAILS;
	});

	it('Given MOCK_EMAILS=true, when sending, then never calls Scaleway and returns a sent result', async () => {
		dynamicEnv.MOCK_EMAILS = 'true';
		vi.spyOn(console, 'log').mockImplementation(() => {});

		const emails = await sendScalewayEmail({ from: 'noreply@test.com', to: 'user@test.com', subject: 'Hi', html: 'Hi' });

		expect(fetchMock).not.toHaveBeenCalled();
		expect(emails).toMatchObject([{ mail_rcpt: 'user@test.com', status: 'sent' }]);
	});

	it('Given Resend-style params, when sending, then posts Scaleway payload with auth header', async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ emails: [{ id: 'e1' }] }), { status: 200 }));

		const emails = await sendScalewayEmail({
			from: 'PuzzLigas <noreply@test.com>',
			to: 'user@test.com',
			subject: 'Hi',
			html: '<p>Hi</p>',
		});

		expect(emails).toEqual([{ id: 'e1' }]);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toContain('/transactional-email/v1alpha1/regions/fr-par/emails');
		expect(init.headers['X-Auth-Token']).toBe('test-secret');
		expect(JSON.parse(init.body)).toEqual({
			project_id: 'test-project',
			from: { email: 'noreply@test.com', name: 'PuzzLigas' },
			to: [{ email: 'user@test.com' }],
			subject: 'Hi',
			html: '<p>Hi</p>',
		});
	});

	it('Given an API error, when sending, then throws with status and message', async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					message: 'invalid argument(s)',
					details: [{ argument_name: 'from.email', help_message: 'Email must be sent from a checked domain' }],
				}),
				{ status: 400 },
			),
		);

		await expect(
			sendScalewayEmail({ from: 'noreply@test.com', to: ['a@test.com'], subject: 'Hi', text: 'Hi' }),
		).rejects.toThrow(
			'Scaleway email failed (400): invalid argument(s) — from.email: Email must be sent from a checked domain',
		);
	});

	it('Given quoted display names, when parsing, then strips quotes', () => {
		expect(parseAddress('"Ana from PuzzLigas" <ana@test.com>')).toEqual({
			email: 'ana@test.com',
			name: 'Ana from PuzzLigas',
		});
	});
});
