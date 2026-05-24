<script lang="ts">
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import PhonePrefixCombobox from '$lib/components/common/PhonePrefixCombobox.svelte';
    import { createEnhanceHandler } from '$lib/utils/form_enhance';

    let {
        isSubmitting = $bindable(false),
        onSuccess,
    }: {
        isSubmitting?: boolean;
        onSuccess: () => void | Promise<void>;
    } = $props();

    let phonePrefixValue = $state<string[]>([]);
    let phonePrefixInputValue = $state('');
    let phoneNumberValue = $state('');
    let phoneError = $state<string | null>(null);

    function getErrorMessage(error: string) {
        return error.includes('.') ? $t(error) : error;
    }
</script>

<div data-testid="onboarding-step-phone">
    <GenericTitle text={$t('add_phone.title')} />

    <p class="text-surface-600 dark:text-surface-400">
        {$t('add_phone.description')}
    </p>

    <p class="text-sm text-surface-500 dark:text-surface-400 italic">
        {$t('add_phone.skip_hint')}
    </p>

    {#if phoneError}
        <div class="p-3 rounded-lg preset-filled-error-500 text-sm">
            {getErrorMessage(phoneError)}
        </div>
    {/if}

    <Card>
        <form
            method="POST"
            action="?/savePhone"
            use:enhance={createEnhanceHandler(
                (msg) => (phoneError = msg),
                'phoneError',
                {
                    onSuccess,
                    setSubmitting: (v) => (isSubmitting = v),
                }
            )}
            class="space-y-4"
        >
            <div class="grid grid-cols-[7rem_1fr] gap-2">
                <input type="hidden" name="phonePrefix" value={phonePrefixValue[0] || ''} />
                <PhonePrefixCombobox
                    bind:value={phonePrefixValue}
                    bind:inputValue={phonePrefixInputValue}
                    placeholder={$t('add_phone.prefix_placeholder')}
                    testId="onboarding-phone-prefix"
                />
                <input
                    name="phoneNumber"
                    type="text"
                    inputmode="numeric"
                    autocomplete="tel-national"
                    pattern={'\\d{6,12}'}
                    minlength="6"
                    maxlength="12"
                    title={$t('add_phone.validation_number_format')}
                    class="input text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                    placeholder={$t('add_phone.number_placeholder')}
                    bind:value={phoneNumberValue}
                    data-testid="onboarding-phone-number"
                />
            </div>

            <button
                type="submit"
                class="btn preset-filled-primary-500 w-full"
                disabled={isSubmitting}
                data-testid="onboarding-phone-save"
            >
                {isSubmitting ? '...' : $t('add_phone.save_button')}
            </button>
        </form>
    </Card>

    <form
        method="POST"
        action="?/skipPhone"
        use:enhance={createEnhanceHandler(
            (msg) => (phoneError = msg),
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
            data-testid="onboarding-phone-skip"
        >
            {$t('add_phone.skip_button')}
        </button>
    </form>
</div>
