import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationState, refreshHasUnread } from './notifications.svelte';

describe('refreshHasUnread', () => {
	beforeEach(() => {
		notificationState.hasUnread = false;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('sets hasUnread from a successful unread-count response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hasUnread: true }) })
		);

		await refreshHasUnread();

		expect(notificationState.hasUnread).toBe(true);
	});

	it('clears hasUnread when the response reports no unread notifications', async () => {
		notificationState.hasUnread = true;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hasUnread: false }) })
		);

		await refreshHasUnread();

		expect(notificationState.hasUnread).toBe(false);
	});

	it('leaves the prior value unchanged when the fetch rejects', async () => {
		notificationState.hasUnread = true;
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

		await refreshHasUnread();

		expect(notificationState.hasUnread).toBe(true);
	});

	it('leaves the prior value unchanged on a non-ok response', async () => {
		notificationState.hasUnread = true;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: async () => ({ hasUnread: false }) })
		);

		await refreshHasUnread();

		expect(notificationState.hasUnread).toBe(true);
	});
});
