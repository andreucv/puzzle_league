<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { t } from '$lib/translations';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import AccountEditOutlineIcon from '@iconify-svelte/mdi/account-edit-outline';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import ChevronRightIcon from '@iconify-svelte/mdi/chevron-right';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';

    let { record, showConfirm = false, showRefuse = false, processing = false, selected = false, onConfirm, onRefuse, onSelect }: {
        record: any;
        showConfirm?: boolean;
        showRefuse?: boolean;
        processing?: boolean;
        selected?: boolean;
        onConfirm?: (id: string) => void;
        onRefuse?: (id: string) => void;
        onSelect?: (id: string) => void;
    } = $props();

    let hasActions = $derived(showConfirm || showRefuse);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="flex items-center gap-2 py-2 px-1 w-full border-b border-surface-200 dark:border-surface-700 last:border-b-0 {processing ? 'opacity-50' : ''} {hasActions ? 'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors' : ''}"
    data-testid="inscription-record-{record.id}"
    onclick={() => hasActions && onSelect?.(record.id)}
>
    <!-- Stacked avatars -->
    <div class="flex items-center shrink-0">
        {#each record.users as user, i}
            <Avatar class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 {i > 0 ? '-ml-4' : ''}">
                <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                <Avatar.Fallback class="text-[0.6rem]">{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
            </Avatar>
        {/each}
        {#each record.userIntents || [] as intent, i}
            <div class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(record.users.length + i) > 0 ? '-ml-4' : ''}">
                <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
            </div>
        {/each}
    </div>

    <!-- Names & creator -->
    <div class="min-w-0 flex-1">
        <div class="text-xs font-medium flex flex-wrap gap-x-1">
            {#each [...record.users.map((u: any) => u.name), ...(record.userIntents || []).map((ui: any) => ui.name)] as name, i}
                <span>{name}{i < record.users.length + (record.userIntents?.length ?? 0) - 1 ? ',' : ''}</span>
            {/each}
        </div>
        {#if record.creator}
            <a href="/public_profile/{record.creator.id}" class="inline-flex items-center gap-0.5 text-[0.65rem] text-surface-500 dark:text-surface-400 hover:text-primary-500 hover:underline transition-colors truncate max-w-full">
                <AccountEditOutlineIcon width="0.75rem" height="0.75rem" class="shrink-0" />
                {record.creator.name ?? record.creator.email}
            </a>
        {/if}
    </div>

    <!-- Actions: slide in from right when selected -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="flex items-center shrink-0 ml-auto transition-all duration-200 {selected ? 'max-w-32 gap-3 opacity-100' : hasActions ? 'max-w-5 opacity-60 overflow-hidden' : 'max-w-0 opacity-0 overflow-hidden'}"
        onclick={(e) => e.stopPropagation()}
    >
        {#if selected}
            {#if showConfirm}
                <ConfirmActionButton
                    icon={CheckIcon}
                    colorClass="preset-filled-success-500"
                    confirmTitle={$t('manage_inscriptions.confirm_accept_title')}
                    confirmMessage={$t('manage_inscriptions.confirm_accept_message')}
                    onConfirm={() => onConfirm?.(record.id)}
                    disabled={processing}
                    testId="confirm-inscription"
                />
            {/if}
            {#if showRefuse}
                <ConfirmActionButton
                    icon={CloseIcon}
                    colorClass="preset-filled-error-500"
                    confirmTitle={$t('manage_inscriptions.confirm_refuse_title')}
                    confirmMessage={$t('manage_inscriptions.confirm_refuse_message')}
                    onConfirm={() => onRefuse?.(record.id)}
                    disabled={processing}
                    testId="refuse-inscription"
                />
            {/if}
        {:else if hasActions}
            <ChevronRightIcon width="1.1rem" height="1.1rem" class="text-surface-400" />
        {/if}
    </div>
</div>
