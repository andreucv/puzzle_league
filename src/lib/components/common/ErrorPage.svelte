<script lang="ts">
    import { page } from '$app/stores';
    import { t } from '$lib/translations';
    import Icon from '@iconify/svelte';

    let { fullHeight = false }: { fullHeight?: boolean } = $props();

    const statusConfig: Record<number, { icon: string; titleKey: string }> = {
        401: { icon: 'mdi:lock-outline', titleKey: 'error_pages.sign_in_required' },
        403: { icon: 'mdi:shield-lock-outline', titleKey: 'error_pages.access_denied' },
        404: { icon: 'mdi:file-search-outline', titleKey: 'error_pages.not_found' },
        500: { icon: 'mdi:alert-circle-outline', titleKey: 'error_pages.something_wrong' },
    };

    const defaultConfig = { icon: 'mdi:alert-outline', titleKey: 'error_pages.error' };

    let config = $derived(statusConfig[$page.status] ?? defaultConfig);

    const defaultMessages: Record<number, string> = {
        401: 'error_pages.sign_in_message',
        403: 'error_pages.access_denied_message',
        404: 'error_pages.not_found_message',
        500: 'error_pages.something_wrong_message',
    };

    let displayMessage = $derived(
        $page.error?.message || $t(defaultMessages[$page.status] ?? 'error_pages.generic_message')
    );
</script>

<svelte:head>
    <title>{$t(config.titleKey)} - PuzzLigas</title>
</svelte:head>

<div class="flex items-center justify-center px-4" class:min-h-screen={fullHeight} class:min-h-[60vh]={!fullHeight}>
    <div class="text-center max-w-md space-y-4">
        <div class="flex justify-center">
            <Icon icon={config.icon} class="text-7xl text-error-500" />
        </div>

        <p class="text-4xl font-mono font-semibold text-surface-400 dark:text-surface-600 tracking-widest">{$page.status}</p>

        <h1 class="h2 font-sans font-bold" style="font-stretch: 125%;">{$t(config.titleKey)}</h1>

        <p class="text-surface-600 dark:text-surface-400 text-lg font-light leading-relaxed">{displayMessage}</p>

        <div class="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 pt-4">
            {#if $page.status === 401}
                <a href="/login" class="btn preset-filled-primary-500 w-full sm:w-auto">
                    <Icon icon="mdi:login" class="mr-2" />
                    {$t('error_pages.sign_in')}
                </a>
            {:else}
                <button onclick={() => history.back()} class="btn preset-outlined-surface-200-800 w-full sm:w-auto">
                    <Icon icon="mdi:arrow-left" class="mr-2" />
                    {$t('error_pages.go_back')}
                </button>
            {/if}
            <a href="/" class="btn preset-outlined-surface-200-800 w-full sm:w-auto">
                <Icon icon="mdi:home-outline" class="mr-2" />
                {$t('error_pages.go_home')}
            </a>
            {#if $page.status === 500}
                <button onclick={() => location.reload()} class="btn preset-outlined-surface-200-800 w-full sm:w-auto">
                    <Icon icon="mdi:refresh" class="mr-2" />
                    {$t('error_pages.try_again')}
                </button>
            {/if}
        </div>
    </div>
</div>
