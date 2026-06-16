import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('$tests/mocks/translations'));

import EntryActionButton from './EntryActionButton.svelte';
import StubIcon from '$tests/mocks/StubIcon.svelte';

function renderButton(overrides: Record<string, any> = {}) {
	return render(EntryActionButton, {
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

describe('EntryActionButton', () => {
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
