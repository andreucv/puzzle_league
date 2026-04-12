<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import FlagCheckeredIcon from '@iconify-svelte/mdi/flag-checkered';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import ChevronRightIcon from '@iconify-svelte/mdi/chevron-right';
    import UndoIcon from '@iconify-svelte/mdi/undo';
    import RecordActionButton from './RecordActionButton.svelte';

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
        record,
        categoryRealStartTime,
        selected = false,
        onSelect,
        onFinish,
        onUndoFinish
    }: {
        record: RecordData;
        categoryRealStartTime: string | null;
        selected?: boolean;
        onSelect?: (id: string) => void;
        onFinish?: (recordId: string) => void;
        onUndoFinish?: (recordId: string) => void;
    } = $props();

    let submitting = $state(false);
    let isPending = $derived(!record.finishTime);

    // Unified action config: null when no action is available
    let action = $derived.by(() => {
        if (isPending && onFinish) {
            return { icon: FlagCheckeredIcon, colorClass: 'preset-filled-success-500', handler: onFinish, testIdPrefix: 'finish-record' };
        }
        if (!isPending && onUndoFinish) {
            return { icon: UndoIcon, colorClass: 'preset-filled-warning-500', handler: onUndoFinish, testIdPrefix: 'undo-finish-record' };
        }
        return null;
    });

    let hasAction = $derived(!!action);

    async function handleAction(e: MouseEvent) {
        e.stopPropagation();
        if (!action || submitting) return;
        submitting = true;
        await action.handler(record.id);
        submitting = false;
    }

    let allNames = $derived([
        ...record.users.map(u => u.name),
        ...(record.userIntents ?? []).map(ui => ui.name)
    ]);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="relative flex items-center gap-2 py-2 px-1 w-full border-b border-surface-200 dark:border-surface-700 last:border-b-0 {submitting ? 'opacity-50' : ''} {hasAction ? 'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors' : ''}"
    data-testid="record-row-{record.id}"
    onclick={() => hasAction && onSelect?.(record.id)}
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
        {/if}

        {#if hasAction && action}
            <ChevronRightIcon width="1.1rem" height="1.1rem" class="text-surface-400 {selected ? 'invisible' : ''}" />

            {#if selected}
                <div class="absolute inset-0 flex items-center justify-end z-10">
                    <RecordActionButton
                        icon={action.icon}
                        colorClass={action.colorClass}
                        {submitting}
                        onclick={handleAction}
                        data-testid="{action.testIdPrefix}-{record.id}"
                    />
                </div>
            {/if}
        {/if}
    </div>
</div>
