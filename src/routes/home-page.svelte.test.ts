import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

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
// $app/stores + $app/navigation are mocked globally via the vite.config test alias.

import Page from './(internal)/(auth)/home/+page.svelte';

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
	startedCompetitions?: any[];
	upcomingRegisteredCompetitions?: any[];
	lastResults?: any[];
	otherUpcomingCompetitions?: any[];
} = {}) {
	const user = overrides.user ?? { id: 'user-1', name: 'Test User', country: 'ES', postalCode: '08001' };
	return {
		user,
		props: {
			startedCompetitions: overrides.startedCompetitions ?? [],
			upcomingRegisteredCompetitions: overrides.upcomingRegisteredCompetitions ?? [],
			lastResults: overrides.lastResults ?? [],
			otherUpcomingCompetitions: overrides.otherUpcomingCompetitions ?? [],
		},
	};
}

describe('Authenticated Home Page', () => {
	beforeEach(() => {
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

	it('renders sections in correct order: Live Now, My upcoming, My last results, Other Upcoming', async () => {
		render(Page, {
			props: {
				data: makePageData({
					startedCompetitions: [makeCompetition(10, { status: 'STARTED' })],
					upcomingRegisteredCompetitions: [makeCompetition(20)],
					lastResults: [],
					otherUpcomingCompetitions: [makeCompetition(30)],
				}),
			},
		});

		await waitFor(() => {
			const allText = document.body.textContent ?? '';
			const livePos = allText.indexOf('landing_page.live_now');
			const upcomingPos = allText.indexOf('landing_page.my_upcoming_competitions');
			const lastResultsPos = allText.indexOf('landing_page.my_last_results');
			const otherPos = allText.indexOf('competitions.other_upcoming_competitions');

			expect(livePos).toBeGreaterThan(-1);
			expect(upcomingPos).toBeGreaterThan(-1);
			expect(lastResultsPos).toBeGreaterThan(-1);
			expect(otherPos).toBeGreaterThan(-1);

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

	// Note: the anonymous landing page is now at src/routes/+page.svelte (a separate route).
	// The authenticated home page always renders the dashboard sections.
});
