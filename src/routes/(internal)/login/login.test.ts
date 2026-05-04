import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';

vi.mock('$lib/auth_client', async () => import('../../../tests/mocks/auth_client'));
vi.mock('$lib/translations', async () => import('../../../tests/mocks/translations'));

import LoginPage from './+page.svelte';

describe('Login Page', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('renders login form with email, password and submit button', () => {
		render(LoginPage);

		expect(screen.getByTestId('login-title').textContent).toBe('auth.login_title');
		expect(screen.getByTestId('input-email')).toBeInTheDocument();
		expect(screen.getByTestId('input-password')).toBeInTheDocument();
		expect(screen.getByTestId('login-submit')).toBeInTheDocument();
	});

	it('shows create account link but not register button initially', () => {
		render(LoginPage);

		expect(screen.getByTestId('create-account-link')).toBeInTheDocument();
		expect(screen.queryByTestId('register-submit')).not.toBeInTheDocument();
	});

	it('shows password confirmation when switching to register mode', async () => {
		render(LoginPage);

		await fireEvent.click(screen.getByTestId('create-account-link'));

		expect(screen.getByTestId('login-title').textContent).toBe('auth.register_title');
		expect(screen.getByTestId('input-password-confirm')).toBeInTheDocument();
		expect(screen.getByTestId('register-submit')).toBeInTheDocument();
		expect(screen.queryByTestId('login-submit')).not.toBeInTheDocument();
	});

	it('shows error message on failed login', async () => {
		render(LoginPage);

		const emailInput = screen.getByTestId('input-email') as HTMLInputElement;
		const passwordInput = screen.getByTestId('input-password') as HTMLInputElement;

		// For Svelte 5 bind:value, we need to set the value and dispatch input event
		emailInput.value = 'wrong@example.com';
		await fireEvent.input(emailInput);
		passwordInput.value = 'wrongpassword';
		await fireEvent.input(passwordInput);

		await fireEvent.click(screen.getByTestId('login-submit'));

		// The mock auth_client returns { error: { message: 'Invalid credentials' } }
		await vi.waitFor(() => {
			const errorEl = screen.getByTestId('login-error-message');
			expect(errorEl).toBeInTheDocument();
			expect(errorEl.textContent).toBe('Invalid credentials');
		}, { timeout: 3000 });
	});

	it('shows "Passwords do not match" error when register passwords differ', async () => {
		render(LoginPage);

		// Switch to register mode
		await fireEvent.click(screen.getByTestId('create-account-link'));

		const emailInput = screen.getByTestId('input-email');
		const nameInput = screen.getByTestId('input-name');
		const passwordInput = screen.getByTestId('input-password');
		const confirmInput = screen.getByTestId('input-password-confirm');

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(nameInput, { target: { value: 'Test User' } });
		await fireEvent.input(passwordInput, { target: { value: 'password1' } });
		await fireEvent.input(confirmInput, { target: { value: 'password2' } });

		await fireEvent.click(screen.getByTestId('register-submit'));

		const errorEl = screen.getByTestId('login-error-message');
		expect(errorEl.textContent).toBe('auth.passwords_not_match');
	});

	it('can switch back to login mode from register mode', async () => {
		render(LoginPage);

		// Switch to register
		await fireEvent.click(screen.getByTestId('create-account-link'));
		expect(screen.getByTestId('register-submit')).toBeInTheDocument();

		// Switch back to login
		await fireEvent.click(screen.getByTestId('sign-in-link'));
		expect(screen.getByTestId('login-title').textContent).toBe('auth.login_title');
		expect(screen.getByTestId('login-submit')).toBeInTheDocument();
		expect(screen.queryByTestId('input-password-confirm')).not.toBeInTheDocument();
	});
});
