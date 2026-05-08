<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth_client";
    import { t } from '$lib/translations';
    import PasswordUpdateForm from '$lib/components/common/auth/PasswordUpdateForm.svelte';
    import type { PasswordUpdatePayload } from '$lib/components/common/auth/PasswordUpdateForm.svelte';

    // Better Auth redirects here with ?token=VALID_TOKEN or ?error=INVALID_TOKEN
    let token = $derived(page.url.searchParams.get('token'));
    let tokenError = $derived(page.url.searchParams.get('error'));

    let isLoading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    // Determine initial state based on query params
    let hasValidToken = $derived(!!token && !tokenError);
    let hasError = $derived(!!tokenError || (!token && !successMessage));

    async function handleSubmit(payload: PasswordUpdatePayload) {
        if (!token) return;
        isLoading = true;
        errorMessage = '';

        try {
            const { error } = await authClient.resetPassword({
                newPassword: payload.newPassword,
                token,
            });

            if (error) {
                errorMessage = error.message || $t('auth.reset_password_invalid_token');
            } else {
                successMessage = $t('auth.reset_password_success');
                // Redirect to login after a brief delay so user sees the success message
                setTimeout(() => goto('/login'), 2000);
            }
        } catch {
            errorMessage = $t('auth.reset_password_invalid_token');
        } finally {
            isLoading = false;
        }
    }
</script>

<section class="flex flex-col md:mt-40 h-screen">
    <div class="w-full md:max-w-md lg:max-w-full md:mx-auto md:w-1/2 xl:w-1/3 mt-4 lg:px-16 xl:px-12 flex items-center justify-center">
        <div class="w-full h-100">
            <h1 data-testid="reset-password-title" class="text-xl md:text-2xl font-bold leading-tight">
                {$t('auth.reset_password_title')}
            </h1>

            {#if successMessage}
                <div data-testid="reset-password-success" class="mt-6 p-4 rounded-lg bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300">
                    <p>{successMessage}</p>
                </div>
                <p class="mt-4">
                    <a href="/login" data-testid="reset-password-login-link" class="text-primary-500 hover:text-primary-700 font-semibold">
                        {$t('auth.back_to_login')}
                    </a>
                </p>
            {:else if hasValidToken}
                <div class="mt-6">
                    <PasswordUpdateForm
                        submitLabel={$t('auth.reset_password_button')}
                        loading={isLoading}
                        errorMessage={errorMessage}
                        testIdPrefix="reset-password"
                        onsubmit={handleSubmit}
                    />
                </div>
            {:else}
                <!-- Invalid/expired token or no token at all -->
                <div data-testid="reset-password-invalid" class="mt-6 p-4 rounded-lg bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300">
                    <p>{$t('auth.reset_password_invalid_token')}</p>
                </div>
                <div class="mt-4 space-y-2">
                    <a href="/forgot-password" data-testid="reset-password-request-new" class="text-primary-500 hover:text-primary-700 font-semibold">
                        {$t('auth.reset_password_request_new')}
                    </a>
                </div>
            {/if}
        </div>
    </div>
</section>
