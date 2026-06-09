<script lang="ts">
    import type { PageData } from './$types';
    import { t } from '$lib/translations';
    import { goto } from '$app/navigation';
    import LanguageStep from './components/LanguageStep.svelte';
    import LocationStep from './components/LocationStep.svelte';
    import ClaimStep from './components/ClaimStep.svelte';
    import PhoneStep from './components/PhoneStep.svelte';
    import VerifyEmailStep from './components/VerifyEmailStep.svelte';
    import Icon from '@iconify/svelte';
    import posthog from 'posthog-js';

    type UnclaimedIntent = NonNullable<PageData['unclaimedExternalParticipants']>[number];

    let { data }: { data: PageData } = $props();

    // --- Wizard state ---
    let currentStep = $state(0);
    // svelte-ignore state_referenced_locally
    let steps = $state([...data.steps]);
    let totalSteps = $derived(steps.length);
    let currentStepId = $derived(steps[currentStep]);
    let isSubmitting = $state(false);

    // svelte-ignore state_referenced_locally
    let unclaimedIntents: UnclaimedIntent[] = $state([...(data.unclaimedExternalParticipants || [])]);

    function goBack() {
        if (currentStep > 0) {
            currentStep--;
        }
    }

    function advanceOrFinish() {
        if (currentStep < totalSteps - 1) {
            currentStep++;
        } else {
            console.log('Onboarding complete, redirecting to home and invalidating session data');
            posthog.capture('onboarding_completed', { steps_count: totalSteps });
            goto('/');
        }
    }

    function handleClaimSuccess(claimedIds: string[]) {
        if (claimedIds.length > 0) {
            unclaimedIntents = unclaimedIntents.filter((intent) => !claimedIds.includes(intent.id));
        }

        advanceOrFinish();
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
        {#if currentStep > 0}
            <button
                type="button"
                class="btn btn-sm preset-tonal"
                onclick={goBack}
                disabled={isSubmitting}
                data-testid="onboarding-previous"
            >
                <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
                {$t('onboarding.previous')}
            </button>
        {/if}
    </div>

    <!-- Welcome header (shown on first step) -->
    {#if currentStep === 0}
        <div class="text-center space-y-2">
            <h3 class="h3">{$t('onboarding.welcome', { name: data.userName })}</h3>
            <p class="text-surface-600-400">{$t('onboarding.welcome_subtitle')}</p>
            <a href="/how-it-works/participant" class="anchor text-sm">
                {$t('how_it_works_guides.cross_link.to_participant_link')} →
            </a>
        </div>
    {/if}

    {#if steps.includes('language')}
        <div hidden={currentStepId !== 'language'}>
            <LanguageStep bind:isSubmitting onSuccess={advanceOrFinish} />
        </div>
    {/if}

    {#if steps.includes('location')}
        <div hidden={currentStepId !== 'location'}>
            <LocationStep bind:isSubmitting onSuccess={advanceOrFinish} />
        </div>
    {/if}

    {#if steps.includes('claim')}
        <div hidden={currentStepId !== 'claim'}>
            <ClaimStep {unclaimedIntents} bind:isSubmitting onSuccess={handleClaimSuccess} />
        </div>
    {/if}

    {#if steps.includes('phone')}
        <div hidden={currentStepId !== 'phone'}>
            <PhoneStep bind:isSubmitting onSuccess={advanceOrFinish} />
        </div>
    {/if}

    {#if steps.includes('verify-email')}
        <div hidden={currentStepId !== 'verify-email'}>
            <VerifyEmailStep
                userEmail={data.userEmail}
                isActive={currentStepId === 'verify-email'}
                bind:isSubmitting
                onSuccess={advanceOrFinish}
            />
        </div>
    {/if}
</div>
