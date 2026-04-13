import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('../../../tests/mocks/translations'));

import RecordRow from './RecordRow.svelte';

function makeRecord(overrides: Partial<{
	id: string;
	tableNumber: number | null;
	finishTime: string | null;
	nPiecesCompleted: number | null;
	status: string;
	users: { id: string; name: string; email: string; image?: string | null }[];
	userIntents: { id: string; name: string }[];
}> = {}) {
	return {
		id: 'rec-1',
		tableNumber: null,
		finishTime: null,
		nPiecesCompleted: null,
		status: 'ACTIVE',
		users: [{ id: 'u1', name: 'Alice', email: 'alice@test.com', image: null }],
		userIntents: [],
		...overrides
	};
}

function renderRow(props: Record<string, any> = {}) {
	return render(RecordRow, {
		props: {
			record: makeRecord(),
			categoryRealStartTime: null,
			...props
		}
	});
}

describe('RecordRow', () => {
	beforeEach(() => {
		cleanup();
	});

	it('renders with data-testid based on record id', () => {
		renderRow({ record: makeRecord({ id: 'rec-42' }) });
		expect(screen.getByTestId('record-row-rec-42')).toBeInTheDocument();
	});

	it('displays table number badge when tableNumber is set', () => {
		renderRow({ record: makeRecord({ tableNumber: 7 }) });
		expect(screen.getByText('#7')).toBeInTheDocument();
	});

	it('hides table number badge when tableNumber is null', () => {
		renderRow({ record: makeRecord({ tableNumber: null }) });
		expect(screen.queryByText(/#\d+/)).not.toBeInTheDocument();
	});

	it('displays user names', () => {
		renderRow({
			record: makeRecord({
				users: [
					{ id: 'u1', name: 'Alice', email: 'a@t.com', image: null },
					{ id: 'u2', name: 'Bob', email: 'b@t.com', image: null }
				]
			})
		});
		expect(screen.getByText('Alice,')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();
	});

	it('displays userIntent names alongside user names', () => {
		renderRow({
			record: makeRecord({
				users: [{ id: 'u1', name: 'Alice', email: 'a@t.com', image: null }],
				userIntents: [{ id: 'ui1', name: 'Charlie' }]
			})
		});
		expect(screen.getByText('Alice,')).toBeInTheDocument();
		expect(screen.getByText('Charlie')).toBeInTheDocument();
	});

	it('shows finish time duration when record has finishTime and categoryRealStartTime', () => {
		const start = '2026-01-01T10:00:00Z';
		const finish = '2026-01-01T10:05:30Z';
		renderRow({
			record: makeRecord({ finishTime: finish }),
			categoryRealStartTime: start
		});
		// calculateDuration returns "5m 30s"
		expect(screen.getByText('5m 30s')).toBeInTheDocument();
	});

	it('shows pieces remaining when nPiecesCompleted and totalPieces provided', () => {
		renderRow({
			record: makeRecord({ nPiecesCompleted: 400 }),
			totalPieces: 500
		});
		// 500 - 400 = 100 pieces remaining
		expect(screen.getByText(/100/)).toBeInTheDocument();
		expect(screen.getByText(/during_competition\.pieces_left/)).toBeInTheDocument();
	});

	it('shows pieces completed when nPiecesCompleted but no totalPieces', () => {
		renderRow({
			record: makeRecord({ nPiecesCompleted: 200 }),
			totalPieces: null
		});
		expect(screen.getByText(/200/)).toBeInTheDocument();
		expect(screen.getByText(/during_competition\.pieces_completed/)).toBeInTheDocument();
	});

	it('clicking row calls onSelect with record id when action is available', async () => {
		const onSelect = vi.fn();
		const onFinish = vi.fn();
		renderRow({
			record: makeRecord({ id: 'rec-5' }),
			onSelect,
			onFinish
		});
		await fireEvent.click(screen.getByTestId('record-row-rec-5'));
		expect(onSelect).toHaveBeenCalledWith('rec-5');
	});

	it('clicking row does NOT call onSelect when no action is available', async () => {
		const onSelect = vi.fn();
		// Finished record with no onUndoFinish — no action available
		renderRow({
			record: makeRecord({ id: 'rec-5', finishTime: '2026-01-01T10:05:00Z' }),
			onSelect
		});
		await fireEvent.click(screen.getByTestId('record-row-rec-5'));
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('shows finish action button when selected and onFinish provided', async () => {
		const onSelect = vi.fn();
		const onFinish = vi.fn();
		renderRow({
			record: makeRecord({ id: 'rec-5' }),
			onSelect,
			onFinish,
			selected: true
		});
		expect(screen.getByTestId('finish-record-rec-5')).toBeInTheDocument();
	});

	it('shows undo action button when selected, finished record, and onUndoFinish provided', () => {
		renderRow({
			record: makeRecord({ id: 'rec-5', finishTime: '2026-01-01T10:05:00Z' }),
			onUndoFinish: vi.fn(),
			selected: true
		});
		expect(screen.getByTestId('undo-finish-record-rec-5')).toBeInTheDocument();
	});

	it('shows pieces input when selected and onSubmitPieces provided (pending record)', () => {
		renderRow({
			record: makeRecord({ id: 'rec-5' }),
			onSubmitPieces: vi.fn(),
			selected: true
		});
		expect(screen.getByTestId('pieces-input-rec-5')).toBeInTheDocument();
		expect(screen.getByTestId('pieces-submit-rec-5')).toBeInTheDocument();
		expect(screen.getByTestId('pieces-cancel-rec-5')).toBeInTheDocument();
	});

	it('shows undo-pieces button when selected, has nPiecesCompleted, and onUndoPieces provided', () => {
		renderRow({
			record: makeRecord({ id: 'rec-5', nPiecesCompleted: 400 }),
			onUndoPieces: vi.fn(),
			selected: true
		});
		expect(screen.getByTestId('undo-pieces-record-rec-5')).toBeInTheDocument();
	});
});
