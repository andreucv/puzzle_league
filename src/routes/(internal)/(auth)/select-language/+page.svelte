<script lang="ts">
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';

    let selectedLocale = $state<string>('');
    let isSaving = $state(false);
    let localeError = $state<string | null>(null);

    const languages = [
        { code: 'ca', name: 'Català' },
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'English' },
    ];
</script>

<div class="container mx-auto max-w-lg space-y-6">
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
            use:enhance={() => {
                isSaving = true;
                localeError = null;
                return async ({ result, update }) => {
                    isSaving = false;
                    if (result.type === 'failure' && result.data?.localeError) {
                        localeError = result.data.localeError as string;
                    } else {
                        await update();
                    }
                };
            }}
            class="space-y-4"
        >
            <input type="hidden" name="locale" value={selectedLocale} />

            <div class="space-y-2">
                {#each languages as lang}
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
                disabled={!selectedLocale || isSaving}
                class="btn preset-filled-primary-500 w-full"
                data-testid="select-language-save"
            >
                {#if isSaving}
                    {$t('select_language.saving')}
                {:else}
                    {$t('select_language.save')}
                {/if}
            </button>
        </form>
    </Card>

    <form method="POST" action="?/skip" use:enhance>
        <button
            type="submit"
            class="btn preset-outlined-surface-200-800 w-full"
            data-testid="select-language-skip"
        >
            {$t('select_language.skip')}
        </button>
    </form>
</div>
