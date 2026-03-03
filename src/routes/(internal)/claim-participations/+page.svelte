<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    import { goto } from '$app/navigation';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';

    let { data } = $props();

    let userIntents = $derived(data.userIntents || []);
    let selectedIds: Set<string> = $state(new Set());
    let isSubmitting = $state(false);
    let resultMessage = $state<{ success: boolean; message: string } | null>(null);

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
        selectedIds = new Set(userIntents.map((ui: any) => ui.id));
    }

    function deselectAll() {
        selectedIds = new Set();
    }

    async function claimSelected() {
        if (selectedIds.size === 0) return;
        isSubmitting = true;
        resultMessage = null;

        try {
            const response = await fetch('/api/user-intents/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIntentIds: Array.from(selectedIds) })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                resultMessage = { success: true, message: result.message };
                // Redirect to home after a short delay
                setTimeout(() => goto('/'), 2000);
            } else {
                resultMessage = { success: false, message: result.error || 'Failed to claim participations' };
            }
        } catch {
            resultMessage = { success: false, message: 'An unexpected error occurred' };
        } finally {
            isSubmitting = false;
        }
    }

    async function skipClaim() {
        await goto('/');
    }
</script>

<div class="container mx-auto max-w-2xl space-y-6">
    <TitleBackButton href="/" text={$t('claim_participations.title')} />

    <p class="text-surface-600 dark:text-surface-400">
        {$t('claim_participations.description')}
    </p>

    {#if resultMessage}
        <div class="p-4 rounded-lg {resultMessage.success ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
            <div class="flex items-center gap-2">
                <Icon icon={resultMessage.success ? 'mdi:check-circle' : 'mdi:alert-circle'} width="1.2rem" height="1.2rem" />
                <span>{resultMessage.message}</span>
            </div>
        </div>
    {/if}

    {#if userIntents.length === 0}
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
            {#each userIntents as intent (intent.id)}
                {@const isSelected = selectedIds.has(intent.id)}
                <button
                    type="button"
                    class="card w-full text-left p-4 transition-all {isSelected ? 'preset-outlined-primary-500 ring-2 ring-primary-500' : 'preset-outlined-surface-200-800'}"
                    onclick={() => toggleSelection(intent.id)}
                >
                    <div class="flex items-start gap-3">
                        <!-- Checkbox indicator -->
                        <div class="mt-0.5 shrink-0">
                            {#if isSelected}
                                <Icon icon="mdi:checkbox-marked" width="1.5rem" height="1.5rem" class="text-primary-500" />
                            {:else}
                                <Icon icon="mdi:checkbox-blank-outline" width="1.5rem" height="1.5rem" class="text-surface-400" />
                            {/if}
                        </div>

                        <div class="flex-1 min-w-0">
                            <!-- Intent name -->
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="mdi:account-question" width="1.2rem" height="1.2rem" class="text-warning-500" />
                                <span class="font-semibold">{intent.name}</span>
                            </div>

                            <!-- Who registered this -->
                            <p class="text-xs text-surface-500 mb-2">
                                {$t('claim_participations.registered_by')} {intent.createdBy.name}
                            </p>

                            <!-- Associated competitions/categories -->
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

        <!-- Action buttons -->
        <div class="flex gap-3 pt-4 pb-6">
            <button
                type="button"
                class="btn preset-filled-primary-500 flex-1"
                disabled={selectedIds.size === 0 || isSubmitting}
                onclick={claimSelected}
            >
                <Icon icon="mdi:account-check" width="1.2rem" height="1.2rem" />
                {$t('claim_participations.claim_selected')} ({selectedIds.size})
            </button>
            <button
                type="button"
                class="btn preset-tonal flex-1"
                onclick={skipClaim}
            >
                {$t('claim_participations.skip')}
            </button>
        </div>
    {/if}
</div>
