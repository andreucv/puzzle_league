<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import FlagCheckeredIcon from '@iconify-svelte/mdi/flag-checkered';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import ChevronRightIcon from '@iconify-svelte/mdi/chevron-right';
    import UndoIcon from '@iconify-svelte/mdi/undo';
    import PuzzlePieceIcon from '@iconify-svelte/mdi/puzzle';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import RecordActionButton from './RecordActionButton.svelte';
    import { t } from '$lib/translations';
    import type { RecordActionMode, RecordActionHandler } from './types';

    interface RecordUser {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    }

    interface UserIntent {
        id: string;
        name: string;
    }

    interface RecordData {
        id: string;
        tableNumber: number | null;
        finishTime: string | null;
        nPiecesCompleted: number | null;
        status: string;
        users: RecordUser[];
        userIntents: UserIntent[];
    }

    // Action config lookup — maps mode to visual + behavioral config
    const ACTION_CONFIG = {
        'finish': { icon: FlagCheckeredIcon, colorClass: 'preset-filled-success-500', testIdPrefix: 'finish-record' },
        'undo-finish': { icon: UndoIcon, colorClass: 'preset-filled-warning-500', testIdPrefix: 'undo-finish-record' },
        'pieces': { icon: PuzzlePieceIcon, colorClass: 'preset-filled-warning-500', testIdPrefix: 'pieces-record' },
        'undo-pieces': { icon: UndoIcon, colorClass: 'preset-filled-warning-500', testIdPrefix: 'undo-pieces-record' }
    } as const;

    let {
        record,
        categoryRealStartTime,
        selected = false,
        onSelect,
        mode,
        onAction,
        totalPieces
    }: {
        record: RecordData;
        categoryRealStartTime: string | null;
        selected?: boolean;
        onSelect?: (id: string) => void;
        mode: RecordActionMode;
        onAction: RecordActionHandler;
        totalPieces?: number | null;
    } = $props();

    let submitting = $state(false);
    let piecesInput = $state('');

    let actionConfig = $derived(ACTION_CONFIG[mode]);
    let isPiecesMode = $derived(mode === 'pieces');

    // Compute pieces remaining for display
    let piecesRemaining = $derived.by(() => {
        if (record.nPiecesCompleted == null || totalPieces == null) return null;
        return totalPieces - record.nPiecesCompleted;
    });

    async function handleAction(e: MouseEvent) {
        e.stopPropagation();
        if (submitting || isPiecesMode) return;
        submitting = true;
        await onAction(record.id);
        submitting = false;
    }

    async function handleSubmitPieces() {
        if (submitting) return;
        const remaining = parseInt(piecesInput);
        if (isNaN(remaining) || remaining < 0) return;
        // TODO: re-enable when all categories have puzzle data
        // if (totalPieces != null && remaining > totalPieces) return;
        const nPiecesCompleted = totalPieces != null ? totalPieces - remaining : remaining;
        submitting = true;
        await onAction(record.id, { nPiecesCompleted });
        piecesInput = '';
        submitting = false;
    }

    function handlePiecesKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmitPieces();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onSelect?.('');
        }
    }

    function cancelPieces(e: MouseEvent) {
        e.stopPropagation();
        piecesInput = '';
        onSelect?.('');
    }

    let allNames = $derived([
        ...record.users.map(u => u.name),
        ...(record.userIntents ?? []).map(ui => ui.name)
    ]);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="relative flex items-center gap-2 py-2 px-1 w-full border-b border-surface-200 dark:border-surface-700 last:border-b-0 {submitting ? 'opacity-50' : ''} cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
    data-testid="record-row-{record.id}"
    onclick={() => onSelect?.(record.id)}
>
    <!-- Table number badge -->
    {#if record.tableNumber != null}
        <span class="badge preset-outlined-primary-500 font-mono text-xs shrink-0">
            #{record.tableNumber}
        </span>
    {/if}

    <!-- Stacked avatars -->
    <div class="flex items-center shrink-0">
        {#each record.users as user, i}
            <Avatar class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 {i > 0 ? '-ml-4' : ''}">
                {#if user.image}
                    <Avatar.Image src={user.image} alt={user.name ?? 'User'} />
                {/if}
                <Avatar.Fallback class="text-[0.6rem]">{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
            </Avatar>
        {/each}
        {#each record.userIntents ?? [] as _intent, i}
            <div class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(record.users.length + i) > 0 ? '-ml-4' : ''}">
                <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
            </div>
        {/each}
    </div>

    <!-- Names -->
    <div class="min-w-0 flex-1">
        <div class="text-xs font-medium flex flex-wrap gap-x-1">
            {#each allNames as name, i}
                <span>{name}{i < allNames.length - 1 ? ',' : ''}</span>
            {/each}
        </div>
    </div>

    <!-- Right side: status/time or action -->
    <div class="flex items-center shrink-0 ml-auto">
        {#if record.finishTime}
            <span class="text-xs text-success-500 flex items-center gap-1">
                <CheckIcon width="0.8rem" height="0.8rem" />
                {#if categoryRealStartTime}
                    {calculateDuration(new Date(categoryRealStartTime), new Date(record.finishTime))}
                {/if}
            </span>
        {:else if record.nPiecesCompleted != null}
            <span class="text-xs text-warning-600 dark:text-warning-400 flex items-center gap-1">
                <PuzzlePieceIcon width="0.8rem" height="0.8rem" />
                {#if piecesRemaining != null}
                    {piecesRemaining} {$t('during_competition.pieces_left')}
                {:else}
                    {record.nPiecesCompleted} {$t('during_competition.pieces_completed')}
                {/if}
            </span>
        {/if}

        <ChevronRightIcon width="1.1rem" height="1.1rem" class="text-surface-400 {selected ? 'invisible' : ''}" />

        {#if selected}
            <div class="absolute inset-0 flex items-center justify-end z-10 rounded-md overflow-hidden">
                {#if isPiecesMode}
                    <!-- svelte-ignore a11y_autofocus -->
                    <div class="flex items-center bg-surface-50-950 border border-surface-300-700 rounded-lg px-2 py-1 space-x-2">
                        <input
                            type="number"
                            min="0"
                            inputmode="numeric"
                            class="input text-xs text-center w-16 mr-4"
                            placeholder={$t('during_competition.pieces_left')}
                            bind:value={piecesInput}
                            onkeydown={handlePiecesKeydown}
                            onclick={(e) => e.stopPropagation()}
                            autofocus
                            data-testid="pieces-input-{record.id}"
                        />
                        <RecordActionButton
                            icon={CheckIcon}
                            colorClass="preset-filled-success-500"
                            submitting={submitting}
                            disabled={!piecesInput}
                            onclick={(e) => { e.stopPropagation(); handleSubmitPieces(); }}
                            data-testid="pieces-submit-{record.id}"
                        />
                        <RecordActionButton
                            icon={CloseIcon}
                            colorClass="preset-tonal"
                            submitting={false}
                            onclick={cancelPieces}
                            data-testid="pieces-cancel-{record.id}"
                        />
                    </div>
                {:else}
                    <RecordActionButton
                        icon={actionConfig.icon}
                        colorClass={actionConfig.colorClass}
                        {submitting}
                        onclick={handleAction}
                        data-testid="{actionConfig.testIdPrefix}-{record.id}"
                    />
                {/if}
            </div>
        {/if}
    </div>
</div>
