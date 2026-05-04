import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('../../../tests/mocks/translations'));

import EntryList from './EntryList.svelte';
import StubIcon from '../../../tests/mocks/StubIcon.svelte';

function makeRecord(id: string, overrides: Record<string, any> = {}) {
	return {
		id,
		tableNumber: null,
		finishTime: null,
		nPiecesCompleted: null,
		status: 'ACTIVE',
		users: [{ id: 'u1', name: 'User ' + id, email: 'u@t.com', image: null }],
		externalParticipants: [],
		...overrides
	};
}

function renderList(overrides: Record<string, any> = {}) {
	return render(EntryList, {
		props: {
			icon: StubIcon,
			label: 'Test List',
			records: [],
			loading: false,
			categoryRealStartTime: null,
			mode: 'finish' as const,
			onAction: vi.fn(),
			emptyMessage: 'No records found',
			...overrides
		}
	});
}

describe('EntryList', () => {
	beforeEach(() => {
		cleanup();
	});

	it('renders nothing when records empty, not loading, and alwaysShow=false', () => {
		const { container } = renderList({ records: [], alwaysShow: false });
		expect(container.innerHTML).toBe('<!---->');
	});

	it('renders section when alwaysShow=true even with empty records', () => {
		renderList({ records: [], alwaysShow: true });
		expect(screen.getByText(/Test List/)).toBeInTheDocument();
	});

	it('renders section when loading=true', () => {
		renderList({ loading: true });
		expect(screen.getByText(/Test List/)).toBeInTheDocument();
	});

	it('shows empty message when open, not loading, and records empty', () => {
		renderList({ records: [], alwaysShow: true, initialOpen: true });
		expect(screen.getByText('No records found')).toBeInTheDocument();
	});

	it('shows count in label', () => {
		const records = [makeRecord('r1'), makeRecord('r2'), makeRecord('r3')];
		renderList({ records, initialOpen: false });
		expect(screen.getByText(/Test List \(3\)/)).toBeInTheDocument();
	});

	it('renders record rows for each record when open', () => {
		const records = [makeRecord('r1'), makeRecord('r2')];
		renderList({ records, initialOpen: true });
		expect(screen.getByTestId('record-row-r1')).toBeInTheDocument();
		expect(screen.getByTestId('record-row-r2')).toBeInTheDocument();
	});

	it('does not render record rows when closed', () => {
		const records = [makeRecord('r1')];
		renderList({ records, initialOpen: false });
		expect(screen.queryByTestId('record-row-r1')).not.toBeInTheDocument();
	});

	it('toggle button opens and closes the list', async () => {
		const records = [makeRecord('r1')];
		renderList({ records, initialOpen: false });

		// Initially closed
		expect(screen.queryByTestId('record-row-r1')).not.toBeInTheDocument();

		// Click to open
		await fireEvent.click(screen.getByText(/Test List/));
		expect(screen.getByTestId('record-row-r1')).toBeInTheDocument();

		// Click to close
		await fireEvent.click(screen.getByText(/Test List/));
		expect(screen.queryByTestId('record-row-r1')).not.toBeInTheDocument();
	});

	it('forceOpen=true opens the list', async () => {
		const records = [makeRecord('r1')];
		// Start closed, but forceOpen should open it
		renderList({ records, initialOpen: false, forceOpen: true });
		expect(screen.getByTestId('record-row-r1')).toBeInTheDocument();
	});
});
