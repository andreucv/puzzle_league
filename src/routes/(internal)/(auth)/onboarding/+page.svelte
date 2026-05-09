<script lang="ts">
    import type { PageData } from './$types';
    import { t } from '$lib/translations';
    import { goto, invalidateAll } from '$app/navigation';
    import LanguageStep from './components/LanguageStep.svelte';
    import LocationStep from './components/LocationStep.svelte';
    import ClaimStep from './components/ClaimStep.svelte';
    import PhoneStep from './components/PhoneStep.svelte';
    import VerifyEmailStep from './components/VerifyEmailStep.svelte';

    let { data }: { data: PageData } = $props();

    // --- Wizard state ---
    let currentStep = $state(0);
    let steps = $derived(data.steps);
    let totalSteps = $derived(steps.length);
    let currentStepId = $derived(steps[currentStep]);
    let isSubmitting = $state(false);

    let unclaimedIntents = $derived(data.unclaimedExternalParticipants || []);

    function advanceOrFinish() {
        if (currentStep < totalSteps - 1) {
            currentStep++;
        } else {
            console.log('Onboarding complete, redirecting to home and invalidating session data');
            goto('/');
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

    {#if currentStepId === 'language'}
        <LanguageStep bind:isSubmitting onSuccess={advanceOrFinish} />
    {:else if currentStepId === 'location'}
        <LocationStep bind:isSubmitting onSuccess={advanceOrFinish} />
    {:else if currentStepId === 'claim'}
        <ClaimStep {unclaimedIntents} bind:isSubmitting onSuccess={advanceOrFinish} />
    {:else if currentStepId === 'phone'}
        <PhoneStep bind:isSubmitting onSuccess={advanceOrFinish} />
    {:else if currentStepId === 'verify-email'}
        <VerifyEmailStep userEmail={data.userEmail} bind:isSubmitting onSuccess={advanceOrFinish} />
    {/if}
</div>
