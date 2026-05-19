import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte';

// vi.mock factories are hoisted, so we must use vi.hoisted for shared state
const { localeMock } = vi.hoisted(() => {
	const { readable } = require('svelte/store');
	return {
		localeMock: Object.assign(readable('en'), { get: () => 'en' }),
	};
});

vi.mock('$lib/translations', () => {
	const { readable } = require('svelte/store');
	const tStore = readable((key: string) => key);
	return {
		t: tStore,
		loading: readable(false),
		locales: readable(['en']),
		locale: localeMock,
		translations: readable({}),
		loadTranslations: vi.fn(),
		addTranslations: vi.fn(),
		setLocale: vi.fn(),
		setRoute: vi.fn(),
	};
});
vi.mock('$app/stores', async () => import('../tests/mocks/app_stores'));
vi.mock('$app/navigation', async () => import('../tests/mocks/app_navigation'));

import Page from './+page.svelte';

// ── Helpers ──

function makeCompetition(id: number, overrides: Record<string, any> = {}) {
	return {
		id,
		name: `Competition ${id}`,
		startDate: new Date('2026-07-01'),
		endDate: new Date('2026-07-02'),
		status: 'NOT_STARTED',
		location: 'Test City',
		country: 'ES',
		postalCode: '08001',
		image_cld_id: null,
		registrationOpen: true,
		categories: [],
		...overrides,
	};
}

function makePageData(overrides: {
	user?: any;
	registrationStatuses?: any[];
	startedCompetitions?: any[];
	upcomingRegisteredCompetitions?: any[];
	lastResults?: any[];
	otherUpcomingCompetitions?: any[];
} = {}) {
	const user = overrides.user ?? { id: 'user-1', name: 'Test User', country: 'ES', postalCode: '08001' };
	return {
		user,
		props: {
			registrationStatuses: Promise.resolve(overrides.registrationStatuses ?? []),
			startedCompetitions: Promise.resolve(overrides.startedCompetitions ?? []),
			upcomingRegisteredCompetitions: Promise.resolve(overrides.upcomingRegisteredCompetitions ?? []),
			lastResults: Promise.resolve(overrides.lastResults ?? []),
			otherUpcomingCompetitions: Promise.resolve(overrides.otherUpcomingCompetitions ?? []),
		},
	};
}

describe('Authenticated Home Page', () => {
	beforeEach(() => {
		cleanup();
		vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ competitions: [], hasMore: false }) })));
		// IntersectionObserver is not available in jsdom
		vi.stubGlobal('IntersectionObserver', class {
			observe() {}
			unobserve() {}
			disconnect() {}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	// ── Section order ──

	it('renders sections in correct order: My Registrations, Live Now, Your upcoming, Your last results, Other Upcoming', async () => {
		render(Page, {
			props: {
				data: makePageData({
					registrationStatuses: [{ id: 1, name: 'Comp 1', startDate: new Date(), registrationOpen: true, status: 'NOT_STARTED', categories: [{ type: 'INDIVIDUAL', entryStatus: 'CONFIRMED' }] }],
					startedCompetitions: [makeCompetition(10, { status: 'STARTED' })],
					upcomingRegisteredCompetitions: [makeCompetition(20)],
					lastResults: [],
					otherUpcomingCompetitions: [makeCompetition(30)],
				}),
			},
		});

		await waitFor(() => {
			const allText = document.body.textContent ?? '';
			const myRegPos = allText.indexOf('landing_page.my_registrations');
			const livePos = allText.indexOf('landing_page.live_now');
			const upcomingPos = allText.indexOf('landing_page.your_upcoming_competitions');
			const lastResultsPos = allText.indexOf('landing_page.your_last_results');
			const otherPos = allText.indexOf('competitions.other_upcoming_competitions');

			expect(myRegPos).toBeGreaterThan(-1);
			expect(livePos).toBeGreaterThan(-1);
			expect(upcomingPos).toBeGreaterThan(-1);
			expect(lastResultsPos).toBeGreaterThan(-1);
			expect(otherPos).toBeGreaterThan(-1);

			expect(myRegPos).toBeLessThan(livePos);
			expect(livePos).toBeLessThan(upcomingPos);
			expect(upcomingPos).toBeLessThan(lastResultsPos);
			expect(lastResultsPos).toBeLessThan(otherPos);
		});
	});

	// ── Other upcoming section ──

	it('renders other upcoming competitions as cards', async () => {
		render(Page, {
			props: {
				data: makePageData({
					otherUpcomingCompetitions: [makeCompetition(1), makeCompetition(2)],
				}),
			},
		});

		await waitFor(() => {
			const list = screen.getByTestId('other-upcoming-list');
			expect(list).toBeInTheDocument();
		});
	});

	it('shows empty state when no other upcoming competitions exist', async () => {
		render(Page, {
			props: {
				data: makePageData({
					otherUpcomingCompetitions: [],
				}),
			},
		});

		await waitFor(() => {
			const empty = screen.getByTestId('other-upcoming-empty');
			expect(empty).toBeInTheDocument();
			expect(empty.textContent).toContain('landing_page.no_other_upcoming_competitions');
		});
	});

	it('keeps the Other Upcoming section visible even when empty', async () => {
		render(Page, {
			props: {
				data: makePageData({
					otherUpcomingCompetitions: [],
				}),
			},
		});

		await waitFor(() => {
			const section = screen.getByTestId('other-upcoming-section');
			expect(section).toBeInTheDocument();
		});
	});

	// ── Anonymous landing page ──

	it('does not render authenticated sections for anonymous users', () => {
		render(Page, {
			props: {
				data: {
					user: null,
					props: {
						registrationStatuses: null,
						startedCompetitions: null,
						upcomingRegisteredCompetitions: null,
						lastResults: null,
						otherUpcomingCompetitions: null,
					},
				},
			},
		});

		expect(screen.queryByTestId('other-upcoming-section')).not.toBeInTheDocument();
	});
});
