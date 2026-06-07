<script lang="ts">
    import { slide } from 'svelte/transition';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import UndoIcon from '@iconify-svelte/mdi/undo';
    import { t } from '$lib/translations';

    let {
        recordId,
        tableNumber,
        names,
        duration,
        onUndo
    }: {
        recordId: string;
        tableNumber: number | null;
        names: string[];
        duration: string | null;
        onUndo: () => void;
    } = $props();
</script>

<div
    class="flex items-center gap-2 py-1.5 px-2 rounded-lg preset-tonal-success text-xs"
    data-testid="last-finished-banner-{recordId}"
    in:slide={{ duration: 200 }}
>
    <CheckCircleIcon width="1rem" height="1rem" class="shrink-0 text-success-500" />
    <span class="font-semibold shrink-0">{$t('during_competition.just_marked')}</span>

    {#if tableNumber != null}
        <span class="badge preset-outlined-success-500 font-mono text-[0.7rem] shrink-0">
            #{tableNumber}
        </span>
    {/if}

    <span class="min-w-0 flex-1 truncate">{names.join(', ')}</span>

    {#if duration}
        <span class="font-mono shrink-0">{duration}</span>
    {/if}

    <button
        type="button"
        class="btn btn-sm preset-tonal gap-1 shrink-0"
        onclick={onUndo}
        data-testid="last-finished-undo-{recordId}"
    >
        <UndoIcon width="0.9rem" height="0.9rem" />
        {$t('during_competition.undo')}
    </button>
</div>
