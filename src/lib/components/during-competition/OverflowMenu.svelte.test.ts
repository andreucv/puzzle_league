import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('$tests/mocks/translations'));

import OverflowMenu from './OverflowMenu.svelte';
import StubIcon from '$tests/mocks/StubIcon.svelte';

function makeAction(overrides: Record<string, any> = {}) {
	return {
		kind: 'confirm' as const,
		icon: StubIcon,
		colorClass: 'preset-filled-warning-500',
		confirmTitle: 'Confirm?',
		confirmMessage: 'Are you sure?',
		onConfirm: vi.fn(),
		testId: 'action-1',
		label: 'Action 1',
		...overrides
	};
}

describe('OverflowMenu', () => {
	it('renders nothing when actions array is empty', () => {
		const { container } = render(OverflowMenu, {
			props: { actions: [], testId: 'overflow-menu' }
		});
		expect(container.innerHTML).toBe('<!---->');
	});

	it('renders trigger button when actions exist', () => {
		render(OverflowMenu, {
			props: { actions: [makeAction()], testId: 'overflow-menu' }
		});
		expect(screen.getByTestId('overflow-menu')).toBeInTheDocument();
	});

	it('opens menu on button click, showing action items', async () => {
		render(OverflowMenu, {
			props: {
				actions: [
					makeAction({ testId: 'action-a', label: 'Action A' }),
					makeAction({ testId: 'action-b', label: 'Action B' })
				],
				testId: 'overflow-menu'
			}
		});

		await fireEvent.click(screen.getByTestId('overflow-menu'));

		expect(screen.getByTestId('action-a')).toBeInTheDocument();
		expect(screen.getByTestId('action-b')).toBeInTheDocument();
	});

	it('closes menu when toggle button is clicked again', async () => {
		render(OverflowMenu, {
			props: { actions: [makeAction()], testId: 'overflow-menu' }
		});

		// Open
		await fireEvent.click(screen.getByTestId('overflow-menu'));
		expect(screen.getByTestId('action-1')).toBeInTheDocument();

		// Close by clicking toggle again
		await fireEvent.click(screen.getByTestId('overflow-menu'));
		expect(screen.queryByTestId('action-1')).not.toBeInTheDocument();
	});
});
