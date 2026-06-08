import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('../../../tests/mocks/translations'));
vi.mock('$app/stores', async () => import('../../../tests/mocks/app_stores'));
vi.mock('$lib/api/category-actions', () => ({
	executeCategoryAction: vi.fn(() => Promise.resolve({ ok: true, category: {} }))
}));
vi.mock('$lib/utils/toast', () => ({
	showSuccessToast: vi.fn(),
	showErrorToast: vi.fn()
}));

import CategoryCard from './CategoryCard.svelte';

// --- Helpers ---

function mockFetchRecords(finished: any[] = [], pending: any[] = []) {
	return vi.fn((url: string) => {
		// Category entries list endpoint: /api/categories/{id}/entries
		// (distinct from per-entry result/pieces endpoints under /api/entries/{id}/...)
		if (typeof url === 'string' && url.includes('/categories/') && url.includes('/entries')) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ records: [...finished, ...pending] })
			});
		}
		// Default: per-entry result/pieces API
		return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
	});
}

function makeCategory(overrides: Record<string, any> = {}) {
	return {
		id: 1,
		type: 'INDIVIDUAL' as const,
		description: '500 pcs',
		subname: null,
		status: 'NOT_STARTED',
		startTime: '2026-01-01T10:00:00Z',
		endTime: '2026-01-01T11:00:00Z',
		realStartTime: null,
		realEndTime: null,
		extraMinutes: 0,
		autoStop: false,
		totalEntries: 5,
		finishedEntries: 0,
		competitionId: 42,
		puzzles: [],
		...overrides
	};
}

function renderCard(categoryOverrides: Record<string, any> = {}, propsOverrides: Record<string, any> = {}) {
	return render(CategoryCard, {
		props: {
			category: makeCategory(categoryOverrides),
			isOrganizer: true,
			onCategoryActionComplete: vi.fn(),
			...propsOverrides
		}
	});
}

describe('CategoryCard', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		cleanup();
		fetchMock = mockFetchRecords();
		vi.stubGlobal('fetch', fetchMock);
		// JSDOM doesn't implement the Web Animations API used by Svelte's flip/animate
		if (!Element.prototype.animate) {
			Element.prototype.animate = vi.fn(() => ({ cancel: vi.fn(), finished: Promise.resolve() })) as any;
		}
		// Svelte's slide outro calls getAnimations(); jsdom lacks it
		if (!Element.prototype.getAnimations) {
			Element.prototype.getAnimations = vi.fn(() => []) as any;
		}
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	// =====================================================================
	// UPCOMING (NOT_STARTED) status
	// =====================================================================
	describe('UPCOMING status', () => {
		it('shows start time and entries count', () => {
			renderCard({ status: 'NOT_STARTED', startTime: '2026-01-01T10:00:00Z', totalEntries: 5 });
			expect(screen.getByText(/5 during_competition\.entries/)).toBeInTheDocument();
		});

		it('shows start button for organizer', () => {
			renderCard({ status: 'NOT_STARTED' });
			expect(screen.getByTestId('start-category-1')).toBeInTheDocument();
		});

		it('shows cancel in overflow menu for organizer', async () => {
			renderCard({ status: 'NOT_STARTED' });
			const overflowBtn = screen.getByTestId('overflow-menu-1');
			expect(overflowBtn).toBeInTheDocument();
			await fireEvent.click(overflowBtn);
			expect(screen.getByTestId('cancel-category-1')).toBeInTheDocument();
		});

		it('does not show action buttons for non-organizer', () => {
			renderCard({ status: 'NOT_STARTED' }, { isOrganizer: false });
			expect(screen.queryByTestId('start-category-1')).not.toBeInTheDocument();
			expect(screen.queryByTestId('overflow-menu-1')).not.toBeInTheDocument();
		});

		it('does not fetch records', () => {
			renderCard({ status: 'NOT_STARTED' });
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('shows manage judges link for organizer', () => {
			renderCard({ status: 'NOT_STARTED' });
			expect(screen.getByText('during_competition.manage_judges')).toBeInTheDocument();
		});
	});

	// =====================================================================
	// LIVE status
	// =====================================================================
	describe('LIVE status', () => {
		const liveCategory = {
			status: 'LIVE',
			realStartTime: '2026-01-01T10:00:00Z',
			totalEntries: 10,
			finishedEntries: 3
		};

		it('shows stop button for organizer', async () => {
			renderCard(liveCategory);
			await waitFor(() => {
				expect(screen.getByTestId('stop-category-1')).toBeInTheDocument();
			});
		});

		it('does not show stop button for non-organizer', async () => {
			renderCard(liveCategory, { isOrganizer: false });
			await waitFor(() => {
				expect(screen.queryByTestId('stop-category-1')).not.toBeInTheDocument();
			});
		});

		it('shows progress count (finished/total)', async () => {
			renderCard(liveCategory);
			await waitFor(() => {
				expect(screen.getByText(/3\/10/)).toBeInTheDocument();
			});
		});

		it('shows progress bar', async () => {
			renderCard(liveCategory);
			await waitFor(() => {
				// Progress bar: 3/10 = 30%
				const bar = document.querySelector('[style*="width: 30%"]');
				expect(bar).toBeInTheDocument();
			});
		});

		it('fetches all records in a single call', async () => {
			renderCard(liveCategory);
			await waitFor(() => {
				const calls = fetchMock.mock.calls.map((c: any[]) => c[0]);
				expect(calls.some((url: string) => url.includes('/categories/') && url.includes('/entries'))).toBe(true);
			});
		});

		it('shows pending and finished record list labels', async () => {
			renderCard(liveCategory);
			await waitFor(() => {
				expect(screen.getByText(/during_competition\.pending_records/)).toBeInTheDocument();
				expect(screen.getByText(/during_competition\.finished_records/)).toBeInTheDocument();
			});
		});

		it('shows cancel in overflow menu', async () => {
			renderCard(liveCategory);
			await waitFor(() => {
				expect(screen.getByTestId('overflow-menu-1')).toBeInTheDocument();
			});
			await fireEvent.click(screen.getByTestId('overflow-menu-1'));
			expect(screen.getByTestId('cancel-category-1')).toBeInTheDocument();
		});
	});

	// =====================================================================
	// STOPPED status
	// =====================================================================
	describe('STOPPED status', () => {
		const stoppedCategory = {
			status: 'STOPPED',
			realStartTime: '2026-01-01T10:00:00Z',
			realEndTime: '2026-01-01T10:30:00Z',
			totalEntries: 8,
			finishedEntries: 5
		};

		it('shows complete button for organizer', async () => {
			renderCard(stoppedCategory);
			await waitFor(() => {
				expect(screen.getByTestId('complete-category-1')).toBeInTheDocument();
			});
		});

		it('shows duration', async () => {
			renderCard(stoppedCategory);
			// 30 minutes = "30m 0s"
			await waitFor(() => {
				expect(screen.getByText('30m 0s')).toBeInTheDocument();
			});
		});

		it('shows overflow menu with resume, cancel, restart for organizer', async () => {
			renderCard(stoppedCategory);
			await waitFor(() => {
				expect(screen.getByTestId('overflow-menu-stopped-1')).toBeInTheDocument();
			});
			await fireEvent.click(screen.getByTestId('overflow-menu-stopped-1'));
			expect(screen.getByTestId('resume-category-1')).toBeInTheDocument();
			expect(screen.getByTestId('cancel-category-1')).toBeInTheDocument();
			expect(screen.getByTestId('restart-category-1')).toBeInTheDocument();
		});

		it('fetches all records in a single call', async () => {
			renderCard(stoppedCategory);
			await waitFor(() => {
				const calls = fetchMock.mock.calls.map((c: any[]) => c[0]);
				expect(calls.some((url: string) => url.includes('/categories/') && url.includes('/entries'))).toBe(true);
			});
		});

		it('shows DNF records and finished records list labels', async () => {
			renderCard(stoppedCategory);
			await waitFor(() => {
				expect(screen.getByText(/during_competition\.dnf_records/)).toBeInTheDocument();
				expect(screen.getByText(/during_competition\.finished_records/)).toBeInTheDocument();
			});
		});
	});

	// =====================================================================
	// COMPLETE status
	// =====================================================================
	describe('COMPLETE status', () => {
		const completeCategory = {
			status: 'COMPLETE',
			realStartTime: '2026-01-01T10:00:00Z',
			realEndTime: '2026-01-01T10:45:00Z',
			totalEntries: 10,
			finishedEntries: 10
		};

		it('shows completed badge for organizer', () => {
			renderCard(completeCategory);
			expect(screen.getByText('during_competition.completed')).toBeInTheDocument();
		});

		it('shows restart button for organizer', () => {
			renderCard(completeCategory);
			expect(screen.getByTestId('restart-category-1')).toBeInTheDocument();
		});

		it('shows completed badge but no restart for non-organizer', () => {
			renderCard(completeCategory, { isOrganizer: false });
			expect(screen.getByText('during_competition.completed')).toBeInTheDocument();
			expect(screen.queryByTestId('restart-category-1')).not.toBeInTheDocument();
		});

		it('shows duration', () => {
			renderCard(completeCategory);
			expect(screen.getByText('45m 0s')).toBeInTheDocument();
		});

		it('shows results link', () => {
			renderCard(completeCategory);
			expect(screen.getByText('during_competition.view_results')).toBeInTheDocument();
		});

		it('shows overflow menu with restart action', () => {
			renderCard(completeCategory);
			expect(screen.getByTestId('overflow-menu-1')).toBeInTheDocument();
		});

		it('does not fetch records', () => {
			renderCard(completeCategory);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	// =====================================================================
	// CANCELED status
	// =====================================================================
	describe('CANCELED status', () => {
		const canceledCategory = {
			status: 'CANCELED',
			realStartTime: '2026-01-01T10:00:00Z',
			realEndTime: '2026-01-01T10:20:00Z',
			totalEntries: 6,
			finishedEntries: 2
		};

		it('shows canceled badge', () => {
			renderCard(canceledCategory);
			expect(screen.getByText('during_competition.canceled')).toBeInTheDocument();
		});

		it('shows restart button for organizer', () => {
			renderCard(canceledCategory);
			expect(screen.getByTestId('restart-category-1')).toBeInTheDocument();
		});

		it('shows canceled badge but no restart for non-organizer', () => {
			renderCard(canceledCategory, { isOrganizer: false });
			expect(screen.getByText('during_competition.canceled')).toBeInTheDocument();
			expect(screen.queryByTestId('restart-category-1')).not.toBeInTheDocument();
		});

		it('does not show results link', () => {
			renderCard(canceledCategory);
			expect(screen.queryByText('during_competition.view_results')).not.toBeInTheDocument();
		});
	});

	// =====================================================================
	// API interactions (LIVE)
	// =====================================================================
	describe('API interactions - LIVE', () => {
		const pendingRecord = {
			id: 'rec-1',
			tableNumber: 1,
			finishTime: null,
			nPiecesCompleted: null,
			status: 'ACTIVE',
			users: [{ id: 'u1', name: 'Alice', email: 'a@t.com', image: null }],
			externalParticipants: []
		};
		const finishedRecord = {
			id: 'rec-2',
			tableNumber: 2,
			finishTime: '2026-01-01T10:05:00Z',
			nPiecesCompleted: null,
			status: 'FINISHED',
			users: [{ id: 'u2', name: 'Bob', email: 'b@t.com', image: null }],
			externalParticipants: []
		};

		const liveCategory = {
			status: 'LIVE',
			realStartTime: '2026-01-01T10:00:00Z',
			totalEntries: 2,
			finishedEntries: 1
		};

		it('handleRecordFinish: POSTs to /api/entries/{id}/result', async () => {
			fetchMock = mockFetchRecords([finishedRecord], [pendingRecord]);
			vi.stubGlobal('fetch', fetchMock);

			const onRecordFinish = vi.fn();
			renderCard(liveCategory, { onRecordFinish });

			// Wait for records to load (pending list starts open via initialOpen=true)
			await waitFor(() => {
				expect(screen.getByTestId('record-row-rec-1')).toBeInTheDocument();
			});

			// Click on record to select it
			await fireEvent.click(screen.getByTestId('record-row-rec-1'));

			// Now the finish button should appear
			await waitFor(() => {
				expect(screen.getByTestId('finish-record-rec-1')).toBeInTheDocument();
			});

			await fireEvent.click(screen.getByTestId('finish-record-rec-1'));

			await waitFor(() => {
				const postCalls = fetchMock.mock.calls.filter(
					(c: any[]) => typeof c[0] === 'string' && c[0].includes('/api/entries/rec-1/result')
				);
				expect(postCalls.length).toBeGreaterThan(0);
			});
		});

		it('handleRecordUndoFinish: DELETEs /api/entries/{id}/result', async () => {
			fetchMock = mockFetchRecords([finishedRecord], [pendingRecord]);
			vi.stubGlobal('fetch', fetchMock);

			renderCard(liveCategory);

			// Wait for records to load, then open finished list
			await waitFor(() => {
				expect(screen.getByText(/during_competition\.finished_records/)).toBeInTheDocument();
			});

			// Open the finished records list
			await fireEvent.click(screen.getByText(/during_competition\.finished_records/));

			await waitFor(() => {
				expect(screen.getByTestId('record-row-rec-2')).toBeInTheDocument();
			});

			// Select the finished record
			await fireEvent.click(screen.getByTestId('record-row-rec-2'));

			// Undo button should appear
			await waitFor(() => {
				expect(screen.getByTestId('undo-finish-record-rec-2')).toBeInTheDocument();
			});

			await fireEvent.click(screen.getByTestId('undo-finish-record-rec-2'));

			await waitFor(() => {
				const deleteCalls = fetchMock.mock.calls.filter(
					(c: any[]) => typeof c[0] === 'string' && c[0].includes('/api/entries/rec-2/result')
				);
				expect(deleteCalls.length).toBeGreaterThan(0);
			});
		});
	});

	// =====================================================================
	// API interactions (STOPPED)
	// =====================================================================
	describe('API interactions - STOPPED', () => {
		const unresolvedRecord = {
			id: 'rec-3',
			tableNumber: 3,
			finishTime: null,
			nPiecesCompleted: null,
			status: 'ACTIVE',
			users: [{ id: 'u3', name: 'Charlie', email: 'c@t.com', image: null }],
			externalParticipants: []
		};
		const resolvedRecord = {
			id: 'rec-4',
			tableNumber: 4,
			finishTime: '2026-01-01T10:10:00Z',
			nPiecesCompleted: null,
			status: 'FINISHED',
			users: [{ id: 'u4', name: 'Diana', email: 'd@t.com', image: null }],
			externalParticipants: []
		};

		const stoppedCategory = {
			status: 'STOPPED',
			realStartTime: '2026-01-01T10:00:00Z',
			realEndTime: '2026-01-01T10:30:00Z',
			totalEntries: 2,
			finishedEntries: 1
		};

		it('handleSubmitPieces: POSTs to /api/entries/{id}/pieces', async () => {
			fetchMock = mockFetchRecords([resolvedRecord], [unresolvedRecord]);
			vi.stubGlobal('fetch', fetchMock);

			renderCard(stoppedCategory);

			// Wait for DNF records to load and be visible (initialOpen=true for DNF list)
			await waitFor(() => {
				expect(screen.getByTestId('record-row-rec-3')).toBeInTheDocument();
			});

			// Select the unresolved record
			await fireEvent.click(screen.getByTestId('record-row-rec-3'));

			// Pieces input should appear
			await waitFor(() => {
				expect(screen.getByTestId('pieces-input-rec-3')).toBeInTheDocument();
			});

			// Enter pieces value and submit
			const input = screen.getByTestId('pieces-input-rec-3') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: '50' } });
			await fireEvent.click(screen.getByTestId('pieces-submit-rec-3'));

			await waitFor(() => {
				const piecesCalls = fetchMock.mock.calls.filter(
					(c: any[]) => typeof c[0] === 'string' && c[0].includes('/api/entries/rec-3/pieces')
				);
				expect(piecesCalls.length).toBeGreaterThan(0);
			});
		});
	});

	// =====================================================================
	// "Just marked" confirmation banner (LIVE finish only)
	// =====================================================================
	describe('Just-finished banner', () => {
		const pendingA = {
			id: 'rec-1',
			tableNumber: 12,
			finishTime: null,
			nPiecesCompleted: null,
			status: 'ACTIVE',
			users: [{ id: 'u1', name: 'Alice', email: 'a@t.com', image: null }],
			externalParticipants: []
		};
		const pendingB = {
			id: 'rec-2',
			tableNumber: 8,
			finishTime: null,
			nPiecesCompleted: null,
			status: 'ACTIVE',
			users: [{ id: 'u2', name: 'Bob', email: 'b@t.com', image: null }],
			externalParticipants: []
		};

		const liveCategory = {
			status: 'LIVE',
			realStartTime: '2026-01-01T10:00:00Z',
			totalEntries: 2,
			finishedEntries: 0
		};

		async function finishRecord(id: string) {
			await fireEvent.click(screen.getByTestId(`record-row-${id}`));
			await waitFor(() => {
				expect(screen.getByTestId(`finish-record-${id}`)).toBeInTheDocument();
			});
			await fireEvent.click(screen.getByTestId(`finish-record-${id}`));
		}

		it('shows the banner with table and participant name after finishing', async () => {
			fetchMock = mockFetchRecords([], [pendingA]);
			vi.stubGlobal('fetch', fetchMock);
			renderCard(liveCategory);

			await waitFor(() => {
				expect(screen.getByTestId('record-row-rec-1')).toBeInTheDocument();
			});

			await finishRecord('rec-1');

			await waitFor(() => {
				const banner = screen.getByTestId('last-finished-banner-rec-1');
				expect(banner).toBeInTheDocument();
				expect(banner).toHaveTextContent('T12');
				expect(banner).toHaveTextContent('Alice');
			});
		});

		it('auto-dismisses the banner after 10 seconds', async () => {
			vi.useFakeTimers();
			try {
				fetchMock = mockFetchRecords([], [pendingA]);
				vi.stubGlobal('fetch', fetchMock);
				renderCard(liveCategory);

				// Flush initial load + reactivity
				await vi.advanceTimersByTimeAsync(200);
				await fireEvent.click(screen.getByTestId('record-row-rec-1'));
				await vi.advanceTimersByTimeAsync(0);
				await fireEvent.click(screen.getByTestId('finish-record-rec-1'));
				await vi.advanceTimersByTimeAsync(0);

				expect(screen.getByTestId('last-finished-banner-rec-1')).toBeInTheDocument();

				// Advance past the 10s lifetime (+ outro transition)
				await vi.advanceTimersByTimeAsync(10000 + 400);

				expect(screen.queryByTestId('last-finished-banner-rec-1')).not.toBeInTheDocument();
			} finally {
				vi.useRealTimers();
			}
		});

		it('Undo from the banner DELETEs the result and hides the banner', async () => {
			fetchMock = mockFetchRecords([], [pendingA]);
			vi.stubGlobal('fetch', fetchMock);
			renderCard(liveCategory);

			await waitFor(() => {
				expect(screen.getByTestId('record-row-rec-1')).toBeInTheDocument();
			});

			await finishRecord('rec-1');

			await waitFor(() => {
				expect(screen.getByTestId('last-finished-undo-rec-1')).toBeInTheDocument();
			});

			await fireEvent.click(screen.getByTestId('last-finished-undo-rec-1'));

			await waitFor(() => {
				const deleteCalls = fetchMock.mock.calls.filter(
					(c: any[]) =>
						typeof c[0] === 'string' &&
						c[0].includes('/api/entries/rec-1/result') &&
						c[1]?.method === 'DELETE'
				);
				expect(deleteCalls.length).toBeGreaterThan(0);
			});

			await waitFor(() => {
				expect(screen.queryByTestId('last-finished-banner-rec-1')).not.toBeInTheDocument();
			});
		});

		it('a second finish replaces the banner', async () => {
			fetchMock = mockFetchRecords([], [pendingA, pendingB]);
			vi.stubGlobal('fetch', fetchMock);
			renderCard(liveCategory);

			await waitFor(() => {
				expect(screen.getByTestId('record-row-rec-1')).toBeInTheDocument();
				expect(screen.getByTestId('record-row-rec-2')).toBeInTheDocument();
			});

			await finishRecord('rec-1');
			await waitFor(() => {
				expect(screen.getByTestId('last-finished-banner-rec-1')).toBeInTheDocument();
			});

			await finishRecord('rec-2');
			await waitFor(() => {
				expect(screen.getByTestId('last-finished-banner-rec-2')).toBeInTheDocument();
				expect(screen.queryByTestId('last-finished-banner-rec-1')).not.toBeInTheDocument();
			});
		});
	});

});
