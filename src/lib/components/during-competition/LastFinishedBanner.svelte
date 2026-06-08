<script lang="ts">
    import { slide } from 'svelte/transition';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import UndoIcon from '@iconify-svelte/mdi/undo';
    import { t } from '$lib/translations';

    let {
        recordId,
        position,
        tableNumber,
        names,
        duration,
        gap,
        onUndo
    }: {
        recordId: string;
        position: number;
        tableNumber: number | null;
        names: string[];
        duration: string | null;
        gap: string | null;
        onUndo: () => void;
    } = $props();
</script>

<div
    class="space-y-2 py-2 px-3 rounded-lg preset-tonal-success text-xs"
    data-testid="last-finished-banner-{recordId}"
    in:slide={{ duration: 200 }}
>
    <!-- Row 1: identity — who finished (table + name) + undo -->
    <div class="flex items-center gap-2">
        <CheckCircleIcon width="1rem" height="1rem" class="shrink-0 text-success-500" />
        {#if tableNumber != null}
            <span class="badge preset-outlined-success-500 font-mono text-[0.7rem] shrink-0">
                T{tableNumber}
            </span>
        {/if}
        <span class="min-w-0 flex-1 break-words font-semibold">{names.join(', ')}</span>

        <button
            type="button"
            class="btn-icon w-6 h-6 preset-tonal rounded-full shrink-0"
            onclick={onUndo}
            data-testid="last-finished-undo-{recordId}"
            aria-label={$t('during_competition.undo')}
            title={$t('during_competition.undo')}
        >
            <UndoIcon width="0.85rem" height="0.85rem" />
        </button>
    </div>

    <!-- Row 2: result — labelled stat columns (full width now Undo moved up).
         items-start aligns the captions on one line; each value sits in a shared-height
         box so the taller place chip and the plain-text values still line up. -->
    <div class="flex items-start justify-between gap-4">
        <!-- Place (finishing position, synced across judges) -->
        <div class="flex flex-col gap-0.5">
            <span class="text-[0.6rem] uppercase tracking-wide text-surface-500">
                {$t('during_competition.place_label')}
            </span>
            <span class="flex h-6 items-center">
                <span class="badge preset-filled-success-500 font-mono text-[0.7rem] font-bold">
                    #{position}
                </span>
            </span>
        </div>

        {#if duration}
            <div class="flex flex-col gap-0.5">
                <span class="text-[0.6rem] uppercase tracking-wide text-surface-500">
                    {$t('during_competition.time_label')}
                </span>
                <span class="flex h-6 items-center font-mono whitespace-nowrap">{duration}</span>
            </div>
        {/if}

        {#if gap}
            <div class="flex flex-col gap-0.5">
                <span class="text-[0.6rem] uppercase tracking-wide text-surface-500">
                    {$t('during_competition.gap_label')}
                </span>
                <span class="flex h-6 items-center font-mono whitespace-nowrap text-success-700 dark:text-success-300">{gap}</span>
            </div>
        {/if}
    </div>
</div>
