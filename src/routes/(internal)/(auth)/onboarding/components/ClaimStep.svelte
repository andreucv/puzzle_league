<script lang="ts">
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { createEnhanceHandler } from '$lib/utils/form_enhance';
    import Icon from '@iconify/svelte';

    let {
        unclaimedIntents,
        isSubmitting = $bindable(false),
        onSuccess,
    }: {
        unclaimedIntents: any[];
        isSubmitting?: boolean;
        onSuccess: () => void | Promise<void>;
    } = $props();

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
</script>

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
            use:enhance={createEnhanceHandler(
                (msg) => (claimError = msg),
                'claimError',
                {
                    onSuccess,
                    setSubmitting: (v) => (isSubmitting = v),
                }
            )}
        >
            <input type="hidden" name="externalParticipantIds" value={Array.from(selectedIds).join(',')} />
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
            use:enhance={createEnhanceHandler(
                (msg) => (claimError = msg),
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
                data-testid="onboarding-claim-skip"
            >
                {$t('claim_participations.skip')}
            </button>
        </form>
    </div>
{/if}
