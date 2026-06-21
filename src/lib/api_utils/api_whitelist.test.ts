import { describe, it, expect } from 'vitest';
import { isPublicApiRoute } from './api_whitelist';

describe('isPublicApiRoute', () => {
	it('treats Better Auth endpoints as public', () => {
		expect(isPublicApiRoute('/api/auth/sign-in/email')).toBe(true);
	});

	it('treats the public competition calendar as public', () => {
		expect(isPublicApiRoute('/api/competitions/bymonth/2026-06')).toBe(true);
	});

	it('treats webhook and cron endpoints as public', () => {
		expect(isPublicApiRoute('/api/webhooks/qstash/auto-stop')).toBe(true);
		expect(isPublicApiRoute('/api/cron/auto-cancel')).toBe(true);
	});

	it('treats the public Ably token endpoint as public', () => {
		// Logged-out results viewers fetch their subscribe-only token here; the
		// global auth gate must not 401 it.
		expect(isPublicApiRoute('/api/ably-token/public')).toBe(true);
		expect(isPublicApiRoute('/api/ably-token/public?competitionId=42')).toBe(true);
	});

	it('keeps the authenticated Ably token endpoint private', () => {
		expect(isPublicApiRoute('/api/ably-token')).toBe(false);
		expect(isPublicApiRoute('/api/ably-token?competitionId=42')).toBe(false);
	});

	it('keeps other API routes private', () => {
		expect(isPublicApiRoute('/api/entries/abc/result')).toBe(false);
		expect(isPublicApiRoute('/api/categories/7/stop')).toBe(false);
	});
});
