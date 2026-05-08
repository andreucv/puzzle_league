<script lang="ts">
    import { t } from '$lib/translations';

    interface Props {
        /** Show the current-password field (for authenticated change-password) */
        showCurrentPassword?: boolean;
        /** Show the revoke-other-sessions checkbox */
        showRevokeOtherSessions?: boolean;
        /** Label for the submit button */
        submitLabel?: string;
        /** Whether the form is currently submitting */
        loading?: boolean;
        /** Error message to display above the form */
        errorMessage?: string;
        /** Success message to display above the form */
        successMessage?: string;
        /** data-testid prefix for all elements */
        testIdPrefix?: string;
        /** Callback when the form is submitted with valid data */
        onsubmit: (payload: PasswordUpdatePayload) => void;
    }

    export interface PasswordUpdatePayload {
        currentPassword?: string;
        newPassword: string;
        revokeOtherSessions?: boolean;
    }

    let {
        showCurrentPassword = false,
        showRevokeOtherSessions = false,
        submitLabel,
        loading = false,
        errorMessage = '',
        successMessage = '',
        testIdPrefix = 'password-update',
        onsubmit,
    }: Props = $props();

    let currentPassword = $state('');
    let newPassword = $state('');
    let confirmPassword = $state('');
    let revokeOtherSessions = $state(false);
    let validationError = $state('');

    function handleSubmit(e: Event) {
        e.preventDefault();
        validationError = '';

        if (newPassword.length < 8) {
            validationError = $t('auth.password_too_short');
            return;
        }

        if (newPassword !== confirmPassword) {
            validationError = $t('auth.passwords_not_match');
            return;
        }

        const payload: PasswordUpdatePayload = {
            newPassword,
        };

        if (showCurrentPassword) {
            payload.currentPassword = currentPassword;
        }

        if (showRevokeOtherSessions) {
            payload.revokeOtherSessions = revokeOtherSessions;
        }

        onsubmit(payload);
    }

    /** Reset fields after a successful operation (called by parent) */
    export function reset() {
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        revokeOtherSessions = false;
        validationError = '';
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4">
    {#if errorMessage || validationError}
        <div data-testid="{testIdPrefix}-error" class="text-error-500 text-sm">
            {errorMessage || validationError}
        </div>
    {/if}

    {#if successMessage}
        <div data-testid="{testIdPrefix}-success" class="text-success-500 text-sm">
            {successMessage}
        </div>
    {/if}

    {#if showCurrentPassword}
        <div>
            <label for="{testIdPrefix}-current-password" class="block text-sm font-semibold text-surface-500">
                {$t('auth.current_password')}
            </label>
            <input
                bind:value={currentPassword}
                type="password"
                id="{testIdPrefix}-current-password"
                data-testid="{testIdPrefix}-current-password"
                autocomplete="current-password"
                class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-1 border text-surface-900 focus:border-primary-500 focus:bg-surface-50 focus:outline-none"
                required
            />
        </div>
    {/if}

    <div>
        <label for="{testIdPrefix}-new-password" class="block text-sm font-semibold text-surface-500">
            {$t('auth.new_password')}
        </label>
        <input
            bind:value={newPassword}
            type="password"
            id="{testIdPrefix}-new-password"
            data-testid="{testIdPrefix}-new-password"
            autocomplete="new-password"
            minlength="8"
            class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-1 border text-surface-900 focus:border-primary-500 focus:bg-surface-50 focus:outline-none"
            required
        />
    </div>

    <div>
        <label for="{testIdPrefix}-confirm-password" class="block text-sm font-semibold text-surface-500">
            {$t('auth.confirm_password')}
        </label>
        <input
            bind:value={confirmPassword}
            type="password"
            id="{testIdPrefix}-confirm-password"
            data-testid="{testIdPrefix}-confirm-password"
            autocomplete="new-password"
            minlength="8"
            class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-1 border text-surface-900 focus:border-primary-500 focus:bg-surface-50 focus:outline-none"
            required
        />
    </div>

    {#if showRevokeOtherSessions}
        <label class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
            <input
                type="checkbox"
                bind:checked={revokeOtherSessions}
                data-testid="{testIdPrefix}-revoke-sessions"
                class="checkbox"
            />
            {$t('auth.revoke_other_sessions')}
        </label>
    {/if}

    <button
        type="submit"
        disabled={loading}
        data-testid="{testIdPrefix}-submit"
        class="w-full btn preset-filled-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {#if loading}
            {$t('auth.submitting')}
        {:else}
            {submitLabel || $t('auth.reset_password_button')}
        {/if}
    </button>
</form>
