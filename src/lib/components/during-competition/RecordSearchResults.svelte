<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import Icon from '@iconify/svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { t } from '$lib/translations';

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

    let {
        records,
        categoryRealStartTime,
        handleRecordFinish
    }: {
        records: RecordData[];
        categoryRealStartTime: string | null;
        handleRecordFinish: (recordId: string) => void;
    } = $props();

    // Per-record submission state
    let submittingFinish: Record<string, boolean> = $state({});

    async function onRecordFinish(recordId: string) {
        submittingFinish[recordId] = true;
        await handleRecordFinish(recordId);
        submittingFinish[recordId] = false;
    }
</script>

<div class="space-y-2">
    {#each records as record}
        <div class="p-3 rounded-lg bg-surface-50-950 space-y-2">
            <!-- Record header: table number + participants -->
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                    {#if record.tableNumber != null}
                        <span class="badge preset-outlined-primary-500 font-mono text-xs">
                            #{record.tableNumber}
                        </span>
                    {/if}
                    <div class="flex flex-wrap items-center gap-1">
                        {#each record.users as user}
                            <div class="flex items-center gap-1">
                                <Avatar class="w-8 h-8">
                                    {#if user.image}
                                        <Avatar.Image src={user.image} alt={user.name} />
                                    {/if}
                                    <Avatar.Fallback>{user.name?.substring(0, 2) ?? '?'}</Avatar.Fallback>
                                </Avatar>
                                <span class="text-xs">{user.name}</span>
                            </div>
                        {/each}
                        {#if record.userIntents && record.userIntents.length > 0}
                            {#each record.userIntents as userIntent}
                                <div class="flex items-center gap-1">
                                    <Avatar class="w-8 h-8">
                                        <Avatar.Fallback>??</Avatar.Fallback>
                                    </Avatar>
                                    <span class="text-xs italic text-surface-600">{userIntent.name}</span>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>

                <!-- Status -->
                {#if record.finishTime}
                    <span class="text-xs text-success-500 flex items-center gap-1">
                        <Icon icon="mdi:check" width="0.8rem" />
                        {#if categoryRealStartTime}
                            {calculateDuration(new Date(categoryRealStartTime), new Date(record.finishTime))}
                        {:else}
                            {$t('during_competition.finished')}
                        {/if}
                    </span>
                {:else}
                    <span class="text-xs text-warning-500">
                        {$t('during_competition.pending')}
                    </span>
                {/if}
            </div>

            <!-- Actions for unfinished records -->
            {#if !record.finishTime}
                <button
                    class="btn btn-sm preset-filled-success-500 gap-1 w-full"
                    disabled={submittingFinish[record.id]}
                    onclick={() => onRecordFinish(record.id)}
                >
                    {#if submittingFinish[record.id]}
                        <Icon icon="mdi:loading" class="animate-spin" width="0.8rem" />
                    {:else}
                        <Icon icon="mdi:flag-checkered" width="0.8rem" />
                    {/if}
                    {$t('during_competition.record_finish')}
                </button>
            {/if}

            {#if record.nPiecesCompleted != null}
                <p class="text-xs text-surface-500">
                    <Icon icon="mdi:puzzle" width="0.8rem" class="inline" />
                    {record.nPiecesCompleted} {$t('during_competition.pieces_completed')}
                </p>
            {/if}
        </div>
    {/each}
</div>
