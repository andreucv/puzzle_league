<script lang="ts">
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { createEnhanceHandler } from '$lib/utils/form_enhance';

    let {
        isSubmitting = $bindable(false),
        onSuccess,
    }: {
        isSubmitting?: boolean;
        onSuccess: () => void | Promise<void>;
    } = $props();

    let selectedLocale = $state<string>('');
    let localeError = $state<string | null>(null);
</script>

<div data-testid="onboarding-step-language">
    <GenericTitle text={$t('select_language.title')} />

    <p class="text-surface-600 dark:text-surface-400">
        {$t('select_language.description')}
    </p>

    <p class="text-sm text-surface-500 dark:text-surface-400 italic">
        {$t('select_language.skip_hint')}
    </p>

    {#if localeError}
        <div class="p-3 rounded-lg preset-filled-error-500 text-sm">
            {localeError}
        </div>
    {/if}

    <Card>
        <form
            method="POST"
            action="?/saveLocale"
            use:enhance={createEnhanceHandler(
                (msg) => (localeError = msg),
                'localeError',
                {
                    onSuccess,
                    setSubmitting: (v) => (isSubmitting = v),
                }
            )}
            class="space-y-4"
        >
            <input type="hidden" name="locale" value={selectedLocale === 'auto' ? '' : selectedLocale} />

            <div class="space-y-2">
                <button
                    type="button"
                    onclick={() => (selectedLocale = 'auto')}
                    class="w-full flex items-center gap-3 p-4 rounded-lg border transition-all
                        {selectedLocale === 'auto'
                            ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500'
                            : 'border-surface-300-700 hover:border-surface-400-600'}"
                    data-testid="select-language-auto"
                >
                    <span class="text-lg font-medium">Auto</span>
                    {#if selectedLocale === 'auto'}
                        <span class="ml-auto text-primary-500">✓</span>
                    {/if}
                </button>
                {#each [
                    { code: 'ca', name: 'Català' },
                    { code: 'es', name: 'Español' },
                    { code: 'en', name: 'English' },
                ] as lang}
                    <button
                        type="button"
                        onclick={() => (selectedLocale = lang.code)}
                        class="w-full flex items-center gap-3 p-4 rounded-lg border transition-all
                            {selectedLocale === lang.code
                                ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500'
                                : 'border-surface-300-700 hover:border-surface-400-600'}"
                        data-testid="select-language-{lang.code}"
                    >
                        <span class="text-lg font-medium">{lang.name}</span>
                        {#if selectedLocale === lang.code}
                            <span class="ml-auto text-primary-500">✓</span>
                        {/if}
                    </button>
                {/each}
            </div>

            <button
                type="submit"
                disabled={!selectedLocale || isSubmitting}
                class="btn preset-filled-primary-500 w-full"
                data-testid="onboarding-language-save"
            >
                {#if isSubmitting}
                    {$t('select_language.saving')}
                {:else}
                    {$t('select_language.save')}
                {/if}
            </button>
        </form>
    </Card>

    <form
        method="POST"
        action="?/skipLocale"
        use:enhance={createEnhanceHandler(
            (msg) => (localeError = msg),
            'error',
            {
                onSuccess,
                setSubmitting: (v) => (isSubmitting = v),
            }
        )}
    >
        <button
            type="submit"
            class="btn preset-outlined-surface-200-800 w-full"
            disabled={isSubmitting}
            data-testid="onboarding-language-skip"
        >
            {$t('select_language.skip')}
        </button>
    </form>
</div>
