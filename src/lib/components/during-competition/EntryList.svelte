<script lang="ts">
    import EntryRow from './EntryRow.svelte';
    import LoadingIcon from '@iconify-svelte/mdi/loading';
    import ChevronUpIcon from '@iconify-svelte/mdi/chevron-up';
    import ChevronDownIcon from '@iconify-svelte/mdi/chevron-down';
    import { untrack } from 'svelte';
    import { slide } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import type { RecordActionMode, RecordActionHandler } from './types';

    let {
        icon: Icon,
        label,
        records,
        loading,
        categoryRealStartTime,
        mode,
        onAction,
        totalPieces,
        emptyMessage,
        initialOpen = false,
        alwaysShow = false,
        forceOpen = false,
        isSearching = false
    }: {
        icon: any;
        label: string;
        records: any[];
        loading: boolean;
        categoryRealStartTime: string | null;
        mode: RecordActionMode;
        onAction: RecordActionHandler;
        totalPieces?: number | null;
        emptyMessage: string;
        initialOpen?: boolean;
        alwaysShow?: boolean;
        forceOpen?: boolean;
        isSearching?: boolean;
    } = $props();

    // Disable transitions during search to prevent viewport jitter from continuous
    // height changes as records appear/disappear on every keystroke.
    let transitionDuration = $derived(isSearching ? 0 : 200);

    // Selection state is owned by EntryList — no need to thread through parent
    let selectedRecord = $state<string | null>(null);

    // eslint-disable-next-line svelte/valid-compile -- initialOpen is intentionally captured once
    let open = $state(untrack(() => initialOpen));

    $effect(() => {
        if (forceOpen) open = true;
    });

    function toggleSelection(id: string) {
        selectedRecord = selectedRecord === id ? null : id;
    }

    // Wrap onAction to clear selection after a successful action
    async function handleAction(recordId: string, data?: { nPiecesCompleted: number }) {
        await onAction(recordId, data);
        selectedRecord = null;
    }
</script>

{#if records.length > 0 || loading || alwaysShow || isSearching}
    <div class="space-y-2">
        <button
            class="btn btn-sm preset-tonal w-full justify-between"
            onclick={() => (open = !open)}
        >
            <span class="flex items-center gap-1">
                <Icon width="1rem" height="1rem" />
                {label} ({records.length})
            </span>
            {#if open}
                <ChevronUpIcon width="1rem" height="1rem" />
            {:else}
                <ChevronDownIcon width="1rem" height="1rem" />
            {/if}
        </button>

        {#if open}
            <div class="{isSearching ? 'h-96' : 'max-h-96'} overflow-y-auto">
                {#if loading}
                    <div class="flex items-center justify-center p-4">
                        <LoadingIcon class="animate-spin" width="1.5rem" height="1.5rem" />
                    </div>
                {:else if records.length > 0}
                    {#each records as record (record.id)}
                        <div transition:slide={{ duration: transitionDuration }} animate:flip={{ duration: transitionDuration }} style="overflow-anchor: none">
                            <EntryRow
                                {record}
                                {categoryRealStartTime}
                                selected={selectedRecord === record.id}
                                onSelect={toggleSelection}
                                {mode}
                                onAction={handleAction}
                                {totalPieces}
                            />
                        </div>
                    {/each}
                {:else}
                    <p class="text-sm text-surface-500 text-center p-4">{emptyMessage}</p>
                {/if}
            </div>
        {/if}
    </div>
{/if}
