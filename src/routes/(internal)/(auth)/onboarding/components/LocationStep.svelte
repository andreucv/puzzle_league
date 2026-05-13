<script lang="ts">
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import CountryCombobox from '$lib/components/common/CountryCombobox.svelte';
    import { createEnhanceHandler } from '$lib/utils/form_enhance';

    let {
        isSubmitting = $bindable(false),
        onSuccess,
    }: {
        isSubmitting?: boolean;
        onSuccess: () => void | Promise<void>;
    } = $props();

    let countryValue = $state<string[]>([]);
    let countryInputValue = $state('');
    let postalCodeValue = $state('');
    let locationError = $state<string | null>(null);

    function getErrorMessage(error: string) {
        return error.includes('.') ? $t(error) : error;
    }
</script>

<div data-testid="onboarding-step-location">
    <GenericTitle text={$t('add_location.title')} />

    <p class="text-surface-600 dark:text-surface-400">
        {$t('add_location.description')}
    </p>

    <p class="text-sm text-surface-500 dark:text-surface-400 italic">
        {$t('add_location.skip_hint')}
    </p>

    {#if locationError}
        <div class="p-3 rounded-lg preset-filled-error-500 text-sm">
            {getErrorMessage(locationError)}
        </div>
    {/if}

    <Card>
        <form
            method="POST"
            action="?/saveLocation"
            use:enhance={createEnhanceHandler(
                (msg) => (locationError = msg),
                'locationError',
                {
                    onSuccess,
                    setSubmitting: (v) => (isSubmitting = v),
                }
            )}
            class="space-y-4"
        >
            <input type="hidden" name="country" value={countryValue[0] || ''} />

            <div class="space-y-2">
                <CountryCombobox
                    bind:value={countryValue}
                    bind:inputValue={countryInputValue}
                    placeholder={$t('add_location.country_placeholder')}
                    testId="onboarding-location-country"
                />
                <input
                    name="postalCode"
                    type="text"
                    autocomplete="postal-code"
                    pattern={'[a-zA-Z0-9\\s-]{3,10}'}
                    minlength="3"
                    maxlength="10"
                    title={$t('add_location.validation_postal_code_format')}
                    class="input text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                    placeholder={$t('add_location.postal_code_placeholder')}
                    bind:value={postalCodeValue}
                    data-testid="onboarding-location-postal-code"
                />
            </div>

            <button
                type="submit"
                class="btn preset-filled-primary-500 w-full"
                disabled={isSubmitting}
                data-testid="onboarding-location-save"
            >
                {isSubmitting ? '...' : $t('add_location.save_button')}
            </button>
        </form>
    </Card>

    <form
        method="POST"
        action="?/skipLocation"
        use:enhance={createEnhanceHandler(
            (msg) => (locationError = msg),
            'error',
            {
                onSuccess,
                setSubmitting: (v) => (isSubmitting = v),
            }
        )}
    >
        <button
            type="submit"
            class="btn preset-tonal w-full"
            disabled={isSubmitting}
            data-testid="onboarding-location-skip"
        >
            {$t('add_location.skip_button')}
        </button>
    </form>
</div>
