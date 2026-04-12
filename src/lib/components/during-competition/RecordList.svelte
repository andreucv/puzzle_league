<script lang="ts">
    import RecordRow from './RecordRow.svelte';
    import LoadingIcon from '@iconify-svelte/mdi/loading';
    import ChevronUpIcon from '@iconify-svelte/mdi/chevron-up';
    import ChevronDownIcon from '@iconify-svelte/mdi/chevron-down';

    let {
        icon: Icon,
        label,
        records,
        loading,
        categoryRealStartTime,
        selectedRecord,
        onSelectRecord,
        onFinish,
        onUndoFinish,
        onSubmitPieces,
        onUndoPieces,
        totalPieces,
        emptyMessage,
        initialOpen = false,
        alwaysShow = false
    }: {
        icon: any;
        label: string;
        records: any[];
        loading: boolean;
        categoryRealStartTime: string | null;
        selectedRecord: string | null;
        onSelectRecord: (id: string) => void;
        onFinish?: (recordId: string) => void;
        onUndoFinish?: (recordId: string) => void;
        onSubmitPieces?: (recordId: string, nPiecesCompleted: number) => void;
        onUndoPieces?: (recordId: string) => void;
        totalPieces?: number | null;
        emptyMessage: string;
        initialOpen?: boolean;
        alwaysShow?: boolean;
    } = $props();

    let open = $state(initialOpen);
</script>

{#if records.length > 0 || loading || alwaysShow}
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
            <div class="max-h-96 overflow-y-auto">
                {#if loading}
                    <div class="flex items-center justify-center p-4">
                        <LoadingIcon class="animate-spin" width="1.5rem" height="1.5rem" />
                    </div>
                {:else if records.length > 0}
                    {#each records as record (record.id)}
                        <RecordRow
                            {record}
                            {categoryRealStartTime}
                            selected={selectedRecord === record.id}
                            onSelect={onSelectRecord}
                            {onFinish}
                            {onUndoFinish}
                            {onSubmitPieces}
                            {onUndoPieces}
                            {totalPieces}
                        />
                    {/each}
                {:else}
                    <p class="text-sm text-surface-500 text-center p-4">{emptyMessage}</p>
                {/if}
            </div>
        {/if}
    </div>
{/if}
