<script lang="ts">
    import type { PageData } from './$types';
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { countries, getCountryFlag } from '$lib/utils/country_utils';
    import Icon from '@iconify/svelte';
    import { authClient } from '$lib/auth_client';

    let { data, form }: { data: PageData; form: any } = $props();

    // --- Wizard state ---
    let currentStep = $state(0);
    let steps = $derived(data.steps);
    let totalSteps = $derived(steps.length);
    let currentStepId = $derived(steps[currentStep]);
    let isSubmitting = $state(false);

    // --- Language step state ---
    let selectedLocale = $state<string>('');
    let localeError = $state<string | null>(null);

    // --- Claim step state ---
    let unclaimedIntents = $derived(data.unclaimedIntents || []);
    let selectedIds: Set<string> = $state(new Set());
    let claimError = $state<string | null>(null);

    function toggleSelection(id: string) {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        selectedIds = next;
    }

    function selectAll() {
        selectedIds = new Set(unclaimedIntents.map((ui: any) => ui.id));
    }

    function deselectAll() {
        selectedIds = new Set();
    }

    // --- Phone step state ---
    let phonePrefixValue = $state<string[]>([]);
    let phonePrefixInputValue = $state('');
    let phoneNumberValue = $state('');
    let phoneError = $state<string | null>(null);

    // --- Verify email step state ---
    let isResendingEmail = $state(false);
    let emailResent = $state(false);

    const getPhonePrefixData = () => {
        const seen = new Set<string>();
        const prefixes: { label: string; value: string }[] = [];
        for (const c of countries) {
            if (c.phonePrefix && !seen.has(c.phonePrefix)) {
                seen.add(c.phonePrefix);
                prefixes.push({
                    label: `${getCountryFlag(c.code)} ${c.phonePrefix}`,
                    value: c.phonePrefix,
                });
            }
        }
        return prefixes;
    };

    const phonePrefixData = getPhonePrefixData();
    let filteredPrefixes = $state(phonePrefixData);

    const phonePrefixCollection = $derived(useListCollection({
        items: filteredPrefixes,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
    }));

    // --- Step advancement ---
    function advanceOrFinish() {
        if (currentStep < totalSteps - 1) {
            currentStep++;
        } else {
            goto('/');
        }
    }

    // --- Shared enhance callback factory ---
    function createEnhanceHandler(errorSetter: (msg: string | null) => void, errorKey: string) {
        return () => {
            isSubmitting = true;
            errorSetter(null);
            return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
                isSubmitting = false;
                if (result.type === 'success') {
                    advanceOrFinish();
                } else if (result.type === 'failure') {
                    const errorMsg = result.data?.[errorKey] || result.data?.error;
                    if (errorMsg) {
                        errorSetter(errorMsg as string);
                    } else {
                        await update();
                    }
                } else {
                    await update();
                }
            };
        };
    }

    async function resendVerificationEmail() {
        if (isResendingEmail) return;
        isResendingEmail = true;
        emailResent = false;
        try {
            await authClient.sendVerificationEmail({
                email: data.userEmail,
                callbackURL: '/verify-email',
            });
            emailResent = true;
        } catch (err) {
            console.error('Failed to resend verification email:', err);
        } finally {
            isResendingEmail = false;
        }
    }
</script>

<div class="container mx-auto max-w-lg space-y-6 py-4" data-testid="onboarding-wizard">
    <!-- Progress indicator -->
    <div class="flex flex-col items-center gap-2">
        <div class="flex items-center gap-2">
            {#each steps as _, i}
                <div
                    class="w-3 h-3 rounded-full transition-all {i === currentStep
                        ? 'bg-primary-500 scale-125'
                        : i < currentStep
                            ? 'bg-primary-500/50'
                            : 'bg-surface-300-700'}"
                ></div>
            {/each}
        </div>
        <p class="text-sm text-surface-500">
            {$t('onboarding.step_of', { current: currentStep + 1, total: totalSteps })}
        </p>
    </div>

    <!-- Welcome header (shown on first step) -->
    {#if currentStep === 0}
        <div class="text-center space-y-2">
            <h3 class="h3">{$t('onboarding.welcome', { name: data.userName })}</h3>
            <p class="text-surface-600-400">{$t('onboarding.welcome_subtitle')}</p>
        </div>
    {/if}

    <!-- ==================== LANGUAGE STEP ==================== -->
    {#if currentStepId === 'language'}
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
                use:enhance={createEnhanceHandler((msg) => (localeError = msg), 'localeError')}
                class="space-y-4"
            >
                <input type="hidden" name="locale" value={selectedLocale} />

                <div class="space-y-2">
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
            use:enhance={createEnhanceHandler((msg) => (localeError = msg), 'error')}
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
    {/if}

    <!-- ==================== CLAIM STEP ==================== -->
    {#if currentStepId === 'claim'}
        <GenericTitle text={$t('claim_participations.title')} />

        <p class="text-surface-600 dark:text-surface-400">
            {$t('claim_participations.description')}
        </p>

        {#if claimError}
            <div class="p-3 rounded-lg preset-filled-error-500 text-sm flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width="1.2rem" height="1.2rem" />
                <span>{claimError}</span>
            </div>
        {/if}

        {#if unclaimedIntents.length === 0}
            <Card>
                <div class="text-center py-6">
                    <Icon icon="mdi:check-all" width="3rem" height="3rem" class="text-success-500 mx-auto mb-2" />
                    <p class="text-surface-600 dark:text-surface-400">{$t('claim_participations.no_matches')}</p>
                </div>
            </Card>
        {:else}
            <!-- Select all / Deselect all -->
            <div class="flex justify-end gap-2">
                <button type="button" class="btn btn-sm preset-tonal" onclick={selectAll}>
                    {$t('claim_participations.select_all')}
                </button>
                <button type="button" class="btn btn-sm preset-tonal" onclick={deselectAll}>
                    {$t('claim_participations.deselect_all')}
                </button>
            </div>

            <div class="space-y-3">
                {#each unclaimedIntents as intent (intent.id)}
                    {@const isSelected = selectedIds.has(intent.id)}
                    <button
                        type="button"
                        class="card w-full text-left p-4 transition-all {isSelected ? 'preset-outlined-primary-500 ring-2 ring-primary-500' : 'preset-outlined-surface-200-800'}"
                        onclick={() => toggleSelection(intent.id)}
                    >
                        <div class="flex items-start gap-3">
                            <div class="mt-0.5 shrink-0">
                                {#if isSelected}
                                    <Icon icon="mdi:checkbox-marked" width="1.5rem" height="1.5rem" class="text-primary-500" />
                                {:else}
                                    <Icon icon="mdi:checkbox-blank-outline" width="1.5rem" height="1.5rem" class="text-surface-400" />
                                {/if}
                            </div>

                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <Icon icon="mdi:account-question" width="1.2rem" height="1.2rem" class="text-warning-500" />
                                    <span class="font-semibold">{intent.name}</span>
                                </div>

                                <p class="text-xs text-surface-500 mb-2">
                                    {$t('claim_participations.registered_by')} {intent.createdBy.name}
                                </p>

                                {#if intent.records.length > 0}
                                    <div class="flex flex-wrap gap-1">
                                        {#each intent.records as record}
                                            <span class="badge preset-tonal-primary text-xs p-1.5">
                                                <Icon icon="mdi:trophy-outline" width="0.8rem" height="0.8rem" />
                                                {record.category.competition.name} — {record.category.description}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </button>
                {/each}
            </div>

            <!-- Claim actions -->
            <div class="flex gap-3 pt-2">
                <form
                    method="POST"
                    action="?/claimIntents"
                    class="flex-1"
                    use:enhance={createEnhanceHandler((msg) => (claimError = msg), 'claimError')}
                >
                    <input type="hidden" name="userIntentIds" value={Array.from(selectedIds).join(',')} />
                    <button
                        type="submit"
                        class="btn preset-filled-primary-500 w-full"
                        disabled={selectedIds.size === 0 || isSubmitting}
                        data-testid="onboarding-claim-save"
                    >
                        <Icon icon="mdi:account-check" width="1.2rem" height="1.2rem" />
                        {$t('claim_participations.claim_selected')} ({selectedIds.size})
                    </button>
                </form>

                <form
                    method="POST"
                    action="?/skipClaim"
                    class="flex-1"
                    use:enhance={createEnhanceHandler((msg) => (claimError = msg), 'error')}
                >
                    <button
                        type="submit"
                        class="btn preset-outlined-surface-200-800 w-full"
                        disabled={isSubmitting}
                        data-testid="onboarding-claim-skip"
                    >
                        {$t('claim_participations.skip')}
                    </button>
                </form>
            </div>
        {/if}
    {/if}

    <!-- ==================== PHONE STEP ==================== -->
    {#if currentStepId === 'phone'}
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
                {$t(phoneError)}
            </div>
        {/if}

        <Card>
            <form
                method="POST"
                action="?/savePhone"
                use:enhance={createEnhanceHandler((msg) => (phoneError = msg), 'phoneError')}
                class="space-y-4"
            >
                <div class="grid grid-cols-[7rem_1fr] gap-2">
                    <input type="hidden" name="phonePrefix" value={phonePrefixValue[0] || ''} />
                    <div class="border border-surface-300 bg-white rounded-lg overflow-hidden">
                        <Combobox
                            collection={phonePrefixCollection}
                            value={phonePrefixValue}
                            inputValue={phonePrefixInputValue}
                            onValueChange={(e) => (phonePrefixValue = e.value)}
                            onInputValueChange={(e) => {
                                phonePrefixInputValue = e.inputValue;
                                filteredPrefixes = phonePrefixData.filter((item) =>
                                    item.label.toLowerCase().includes(e.inputValue.toLowerCase()) ||
                                    item.value.includes(e.inputValue)
                                );
                            }}
                            onOpenChange={() => { filteredPrefixes = phonePrefixData; }}
                            placeholder={$t('add_phone.prefix_placeholder')}
                        >
                            <Combobox.Control>
                                <Combobox.Input
                                    class="input text-sm px-3 py-2 bg-transparent border-none w-full"
                                    data-testid="onboarding-phone-prefix"
                                />
                                <Combobox.Trigger />
                            </Combobox.Control>
                            <Portal>
                                <Combobox.Positioner>
                                    <Combobox.Content class="card bg-surface-50 p-2 shadow-xl max-h-48 overflow-y-auto rounded-lg">
                                        {#each phonePrefixCollection.items as item}
                                            <Combobox.Item {item}>
                                                <Combobox.ItemText>
                                                    <div class="flex items-center gap-2 p-1">
                                                        <span>{item.label}</span>
                                                    </div>
                                                </Combobox.ItemText>
                                                <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                                            </Combobox.Item>
                                        {/each}
                                    </Combobox.Content>
                                </Combobox.Positioner>
                            </Portal>
                        </Combobox>
                    </div>
                    <input
                        name="phoneNumber"
                        type="text"
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
            use:enhance={createEnhanceHandler((msg) => (phoneError = msg), 'error')}
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
    {/if}

    <!-- ==================== VERIFY EMAIL STEP ==================== -->
    {#if currentStepId === 'verify-email'}
        <div data-testid="onboarding-step-verify-email">
        <GenericTitle text={$t('onboarding.verify_email_title')} />

        <Card>
            <div class="text-center space-y-4 py-4">
                <Icon icon="mdi:email-check-outline" width="3rem" height="3rem" class="text-primary-500 mx-auto" />

                <p class="text-surface-600 dark:text-surface-400">
                    {$t('onboarding.verify_email_sent', { email: data.userEmail })}
                </p>

                <p class="text-sm text-surface-500 dark:text-surface-400">
                    {$t('onboarding.verify_email_check')}
                </p>

                {#if emailResent}
                    <div class="p-3 rounded-lg preset-filled-success-500 text-sm flex items-center justify-center gap-2">
                        <Icon icon="mdi:check-circle" width="1.2rem" height="1.2rem" />
                        <span>{$t('onboarding.verify_email_resent')}</span>
                    </div>
                {/if}

                <button
                    type="button"
                    onclick={resendVerificationEmail}
                    disabled={isResendingEmail}
                    class="btn preset-outlined-primary-500 w-full"
                    data-testid="onboarding-verify-email-resend"
                >
                    <Icon icon="mdi:email-sync-outline" width="1.2rem" height="1.2rem" />
                    {isResendingEmail ? $t('onboarding.verify_email_resending') : $t('onboarding.verify_email_resend')}
                </button>
            </div>
        </Card>

        <form
            method="POST"
            action="?/skipEmailVerification"
            use:enhance={createEnhanceHandler(() => {}, 'error')}
        >
            <button
                type="submit"
                class="btn preset-tonal w-full"
                disabled={isSubmitting}
                data-testid="onboarding-verify-email-skip"
            >
                {$t('onboarding.verify_email_skip')}
            </button>
        </form>
        </div>
    {/if}
</div>
