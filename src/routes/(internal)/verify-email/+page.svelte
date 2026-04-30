<script lang="ts">
    import { t } from '$lib/translations';
    import { page } from '$app/state';
    import Card from '$lib/components/common/card/Card.svelte';
    import Icon from '@iconify/svelte';

    // Better Auth redirects here after verification with no special query params on success.
    // If there's an error param, the verification failed.
    let hasError = $derived(page.url.searchParams.has('error'));
</script>

<div class="container mx-auto max-w-lg space-y-6 py-12">
    {#if hasError}
        <Card>
            <div class="text-center space-y-4 py-6" data-testid="verify-email-error">
                <Icon icon="mdi:alert-circle-outline" width="4rem" height="4rem" class="text-error-500 mx-auto" />
                <h2 class="h2">{$t('verify_email.error_title')}</h2>
                <p class="text-surface-600 dark:text-surface-400">
                    {$t('verify_email.error_message')}
                </p>
            </div>
        </Card>
    {:else}
        <Card>
            <div class="text-center space-y-4 py-6" data-testid="verify-email-success">
                <Icon icon="mdi:check-circle-outline" width="4rem" height="4rem" class="text-success-500 mx-auto" />
                <h2 class="h2">{$t('verify_email.success_title')}</h2>
                <p class="text-surface-600 dark:text-surface-400">
                    {$t('verify_email.success_message')}
                </p>
                <a href="/" class="btn preset-filled-primary-500">
                    {$t('verify_email.continue')}
                </a>
            </div>
        </Card>
    {/if}
</div>
