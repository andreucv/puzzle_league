import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('../../../tests/mocks/translations'));

import RecordActionButton from './RecordActionButton.svelte';
import StubIcon from '../../../tests/mocks/StubIcon.svelte';

function renderButton(overrides: Record<string, any> = {}) {
	return render(RecordActionButton, {
		props: {
			icon: StubIcon,
			colorClass: 'preset-filled-success-500',
			submitting: false,
			disabled: false,
			onclick: vi.fn(),
			...overrides
		}
	});
}

describe('RecordActionButton', () => {
	beforeEach(() => {
		cleanup();
	});

	it('applies the colorClass to the button', () => {
		renderButton({ colorClass: 'preset-filled-warning-500' });
		const btn = screen.getByRole('button');
		expect(btn.className).toContain('preset-filled-warning-500');
	});

	it('button is disabled when disabled=true', () => {
		renderButton({ disabled: true });
		const btn = screen.getByRole('button');
		expect(btn).toBeDisabled();
	});

	it('button is disabled when submitting=true', () => {
		renderButton({ submitting: true });
		const btn = screen.getByRole('button');
		expect(btn).toBeDisabled();
	});

	it('calls onclick handler when clicked', async () => {
		const onclick = vi.fn();
		renderButton({ onclick });
		const btn = screen.getByRole('button');
		await fireEvent.click(btn);
		expect(onclick).toHaveBeenCalledTimes(1);
	});

});
