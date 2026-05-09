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
            <h1 data-testid="forgot-password-title" class="h3">
                {$t('auth.forgot_password_title')}
            </h1>

            {#if submitted}
                <div data-testid="forgot-password-success" class="mt-6 p-4 rounded-lg bg-surface-200 text-surface-700 dark:text-surface-300">
                    <p>{$t('auth.forgot_password_success')}</p>
                </div>
                <p class="mt-4">
                    <a href="/login" class="anchor font-semibold">
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
                            class="input rounded-lg bg-primary-50-950 mt-2"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        data-testid="forgot-password-submit"
                        class="btn preset-filled-primary-500 w-full mt-4"
                    >
                        {#if isLoading}{$t('auth.forgot_password_sending')}{:else}{$t('auth.forgot_password_submit')}{/if}
                    </button>
                </form>

                <p class="mt-4">
                    <a href="/login" class="anchor font-semibold">
                        {$t('auth.back_to_login')}
                    </a>
                </p>
            {/if}
        </div>
    </div>
</section>
