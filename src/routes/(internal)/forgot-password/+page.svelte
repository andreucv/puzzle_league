<script lang="ts">
    import { authClient } from "$lib/auth_client";
    import { t } from '$lib/translations';

    let email = $state('');
    let isLoading = $state(false);
    let submitted = $state(false);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (isLoading) return;
        isLoading = true;

        try {
            await authClient.requestPasswordReset({
                email,
                redirectTo: '/reset-password',
            });
        } catch {
            // Swallow errors — always show the same generic message
            // to avoid email enumeration
        } finally {
            isLoading = false;
            submitted = true;
        }
    }
</script>

<section class="flex flex-col md:mt-40 h-screen">
    <div class="w-full md:max-w-md lg:max-w-full md:mx-auto md:w-1/2 xl:w-1/3 mt-4 lg:px-16 xl:px-12 flex items-center justify-center">
        <div class="w-full h-100">
            <h1 data-testid="forgot-password-title" class="text-xl md:text-2xl font-bold leading-tight">
                {$t('auth.forgot_password_title')}
            </h1>

            {#if submitted}
                <div data-testid="forgot-password-success" class="mt-6 p-4 rounded-lg bg-surface-200 text-surface-700 dark:text-surface-300">
                    <p>{$t('auth.forgot_password_success')}</p>
                </div>
                <p class="mt-4">
                    <a href="/login" class="text-primary-500 hover:text-primary-700 font-semibold">
                        {$t('auth.back_to_login')}
                    </a>
                </p>
            {:else}
                <p class="mt-2 text-surface-600 dark:text-surface-400">{$t('auth.forgot_password_description')}</p>

                <form class="mt-6" onsubmit={handleSubmit}>
                    <div>
                        <label for="forgot-email" class="block">{$t('auth.email_label')}</label>
                        <input
                            bind:value={email}
                            type="email"
                            id="forgot-email"
                            data-testid="forgot-password-email"
                            placeholder={$t('auth.enter_email')}
                            autocomplete="email"
                            class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-2 border text-surface-900 focus:border-primary-500 focus:bg-surface-50 focus:outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        data-testid="forgot-password-submit"
                        class="w-full block bg-primary-500 hover:bg-primary-400 focus:bg-primary-400 text-white font-semibold rounded-lg px-4 py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if isLoading}{$t('auth.forgot_password_sending')}{:else}{$t('auth.forgot_password_submit')}{/if}
                    </button>
                </form>

                <p class="mt-4">
                    <a href="/login" class="text-primary-500 hover:text-primary-700 font-semibold">
                        {$t('auth.back_to_login')}
                    </a>
                </p>
            {/if}
        </div>
    </div>
</section>
