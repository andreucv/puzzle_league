<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';

    let {
        categoryName,
        competitionName,
        unfinishedCount,
        onConfirm,
        onCancel
    }: {
        categoryName: string;
        competitionName: string;
        unfinishedCount: number;
        onConfirm: () => void;
        onCancel: () => void;
    } = $props();

    let isConfirming = $state(false);

    async function handleConfirm() {
        isConfirming = true;
        onConfirm();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={onCancel}
>
    <div
        class="card preset-outlined-surface-200-800 p-6 m-4 max-w-md w-full space-y-4"
        onclick={(e) => e.stopPropagation()}
    >
        <h3 class="h3 flex items-center gap-2">
            <Icon icon="mdi:alert" class="text-warning-500" width="1.5rem" />
            {$t('during_competition.stop_confirm_title')}
        </h3>

        <p class="text-sm">
            {$t('during_competition.stop_confirm_message')} '{categoryName}' {$t('during_competition.stop_confirm_of')} '{competitionName}'?
        </p>

        {#if unfinishedCount > 0}
            <div class="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30 text-sm space-y-1">
                <p class="font-semibold text-warning-700 dark:text-warning-400">
                    <Icon icon="mdi:information" width="1rem" class="inline" />
                    {unfinishedCount} {$t('during_competition.unfinished_warning')}
                </p>
                <p class="text-surface-600-400">
                    {$t('during_competition.auto_complete_notice')}
                </p>
            </div>
        {/if}

        <div class="flex justify-end gap-2">
            <button
                class="btn btn-sm preset-tonal"
                onclick={onCancel}
                disabled={isConfirming}
            >
                {$t('during_competition.cancel')}
            </button>
            <button
                class="btn btn-sm preset-filled-error-500"
                onclick={handleConfirm}
                disabled={isConfirming}
            >
                {#if isConfirming}
                    <Icon icon="mdi:loading" class="animate-spin" width="1rem" />
                {/if}
                {$t('during_competition.stop_confirm')}
            </button>
        </div>
    </div>
</div>
