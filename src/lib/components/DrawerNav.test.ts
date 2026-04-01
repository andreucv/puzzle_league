import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('../../tests/mocks/translations'));
vi.mock('$lib/auth_client', async () => import('../../tests/mocks/auth_client'));
vi.mock('$app/stores', async () => import('../../tests/mocks/app_stores'));
vi.mock('../../shareds/drawer.svelte', () => ({
	drawerState: { open: false },
}));

import DrawerNav from './DrawerNav.svelte';

const baseMockUser = { id: '1', name: 'Test User', email: 'test@example.com', image: null };

describe('DrawerNav - Anonymous user', () => {
	beforeEach(() => {
		cleanup();
	});

	it('shows home and competitions links', () => {
		render(DrawerNav, { props: { user: null } });

		expect(screen.getByTestId('nav-drawer-home')).toBeInTheDocument();
		expect(screen.getByTestId('nav-drawer-competitions')).toBeInTheDocument();
	});

	it('does not show create competition link', () => {
		render(DrawerNav, { props: { user: null } });

		expect(screen.queryByTestId('nav-drawer-create-competition')).not.toBeInTheDocument();
	});

	it('does not show review permissions requests link', () => {
		render(DrawerNav, { props: { user: null } });

		expect(screen.queryByTestId('nav-drawer-review-permissions-requests')).not.toBeInTheDocument();
	});

	it('does not show notifications link', () => {
		render(DrawerNav, { props: { user: null } });

		expect(screen.queryByTestId('nav-drawer-notifications')).not.toBeInTheDocument();
	});

	it('does not show sign out button', () => {
		render(DrawerNav, { props: { user: null } });

		expect(screen.queryByTestId('nav-drawer-signout')).not.toBeInTheDocument();
	});
});

describe('DrawerNav - Participant user', () => {
	beforeEach(() => {
		cleanup();
	});

	it('shows home and competitions links', () => {
		render(DrawerNav, { props: { user: { ...baseMockUser, roleAssignments: [] } } });

		expect(screen.getByTestId('nav-drawer-home')).toBeInTheDocument();
		expect(screen.getByTestId('nav-drawer-competitions')).toBeInTheDocument();
	});

	it('shows notifications link', () => {
		render(DrawerNav, { props: { user: { ...baseMockUser, roleAssignments: [] } } });

		expect(screen.getByTestId('nav-drawer-notifications')).toBeInTheDocument();
	});

	it('does not show create competition link', () => {
		render(DrawerNav, { props: { user: { ...baseMockUser, roleAssignments: [] } } });

		expect(screen.queryByTestId('nav-drawer-create-competition')).not.toBeInTheDocument();
	});

	it('does not show review permissions requests link', () => {
		render(DrawerNav, { props: { user: { ...baseMockUser, roleAssignments: [] } } });

		expect(screen.queryByTestId('nav-drawer-review-permissions-requests')).not.toBeInTheDocument();
	});

	it('shows sign out button', () => {
		render(DrawerNav, { props: { user: { ...baseMockUser, roleAssignments: [] } } });

		expect(screen.getByTestId('nav-drawer-signout')).toBeInTheDocument();
	});
});

describe('DrawerNav - Organizer user', () => {
	beforeEach(() => {
		cleanup();
	});

	const organizerUser = { ...baseMockUser, roleAssignments: [{ role: 'ORGANIZER' }] };

	it('shows create competition link', () => {
		render(DrawerNav, { props: { user: organizerUser } });

		expect(screen.getByTestId('nav-drawer-create-competition')).toBeInTheDocument();
	});

	it('shows my organized competitions link', () => {
		render(DrawerNav, { props: { user: organizerUser } });

		expect(screen.getByTestId('nav-drawer-my-organized-competitions')).toBeInTheDocument();
	});

	it('shows puzzles link', () => {
		render(DrawerNav, { props: { user: organizerUser } });

		expect(screen.getByTestId('nav-drawer-puzzles')).toBeInTheDocument();
	});

	it('does not show review permissions requests link', () => {
		render(DrawerNav, { props: { user: organizerUser } });

		expect(screen.queryByTestId('nav-drawer-review-permissions-requests')).not.toBeInTheDocument();
	});
});

describe('DrawerNav - Admin user', () => {
	beforeEach(() => {
		cleanup();
	});

	const adminUser = { ...baseMockUser, roleAssignments: [{ role: 'ADMIN' }] };

	it('shows review permissions requests link', () => {
		render(DrawerNav, { props: { user: adminUser } });

		expect(screen.getByTestId('nav-drawer-review-permissions-requests')).toBeInTheDocument();
	});

	it('does not show organizer links without organizer role', () => {
		render(DrawerNav, { props: { user: adminUser } });

		expect(screen.queryByTestId('nav-drawer-create-competition')).not.toBeInTheDocument();
	});
});
