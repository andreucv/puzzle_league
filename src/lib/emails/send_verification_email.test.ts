import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({
	mockSend: vi.fn(),
}));

vi.mock('./scaleway_email', () => ({ sendScalewayEmail: mockSend }));

vi.mock('$env/static/private', () => ({
	SCW_FROM_EMAIL: 'noreply@test.com',
}));

vi.mock('./email_template', () => ({
	buildMultiLanguageEmail: vi.fn().mockReturnValue('<html>test</html>'),
}));

import { sendVerificationEmail } from './send_verification_email';

describe('sendVerificationEmail', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('Given valid email, when send succeeds, then returns success', async () => {
		mockSend.mockResolvedValue({ id: 'msg-123' });

		const result = await sendVerificationEmail('user@test.com', 'https://app.test/verify?token=abc');

		expect(result).toEqual({ success: true });
		expect(mockSend).toHaveBeenCalledOnce();
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				from: 'noreply@test.com',
				to: 'user@test.com',
			}),
		);
	});

	it('Given valid email, when Scaleway throws, then returns failure with error message', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		mockSend.mockRejectedValue(new Error('API rate limit exceeded'));

		const result = await sendVerificationEmail('user@test.com', 'https://app.test/verify?token=abc');

		expect(result).toEqual({ success: false, error: 'API rate limit exceeded' });
		expect(consoleSpy).toHaveBeenCalledWith(
			'[sendVerificationEmail] Failed to send verification email:',
			expect.any(Error),
		);
		consoleSpy.mockRestore();
	});

	// NOTE: the non-Error → 'Unknown error' normalization is identical across both email
	// senders; its canonical coverage lives in send_password_reset_email.test.ts. This file
	// keeps only the verification-specific behaviour (tri-lingual content + its own catch).
});
