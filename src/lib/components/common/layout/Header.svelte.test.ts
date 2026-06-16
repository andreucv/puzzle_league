import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('$tests/mocks/translations'));
vi.mock('$lib/stores/drawer.svelte', () => ({
	drawerState: { open: false },
}));
vi.mock('$app/state', () => ({
	page: {
		data: { user: { id: '1', name: 'Test User', image: undefined, emailVerified: true } },
		url: new URL('http://localhost/'),
	},
}));

import Header from './Header.svelte';
import { notificationState } from '$lib/stores/notifications.svelte';

describe('Header - notifications unread dot', () => {
	beforeEach(() => {
		notificationState.hasUnread = false;
	});

	it('shows the unread dot when there are unread notifications', () => {
		notificationState.hasUnread = true;
		render(Header);

		expect(screen.getByTestId('notifications-unread-dot')).toBeInTheDocument();
	});

	it('hides the unread dot when there are no unread notifications', () => {
		notificationState.hasUnread = false;
		render(Header);

		expect(screen.queryByTestId('notifications-unread-dot')).not.toBeInTheDocument();
	});
});
