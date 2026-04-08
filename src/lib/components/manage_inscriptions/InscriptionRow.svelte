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

    function formatDateTime(date: string | Date): { time: string; date: string } {
        const d = new Date(date);
        return {
            time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
        };
    }

    let inscriptionDate = $derived(record.createdAt ? formatDateTime(record.createdAt) : null);
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

    <!-- Right side: date + actions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="relative flex items-center shrink-0 ml-auto"
    >
        <!-- Date (always visible, sits behind buttons when selected) -->
        {#if inscriptionDate}
            <span class="text-[0.7rem] leading-tight text-surface-400 dark:text-surface-500 text-right whitespace-nowrap">
                {inscriptionDate.date} · {inscriptionDate.time}
            </span>
        {/if}

        <!-- Chevron (always rendered when hasActions to keep layout stable) -->
        {#if hasActions}
            <ChevronRightIcon width="1.1rem" height="1.1rem" class="text-surface-400 ml-1 {selected ? 'invisible' : ''}" />
        {/if}

        <!-- Action buttons overlay when selected -->
        {#if selected}
            <div class="absolute inset-0 flex items-center justify-end gap-3 z-10 pointer-events-none">
                {#if showConfirm}
                    <div class="pointer-events-auto" onclick={(e) => e.stopPropagation()}>
                    <ConfirmActionButton
                        icon={CheckIcon}
                        colorClass="preset-filled-success-500"
                        confirmTitle={$t('manage_inscriptions.confirm_accept_title')}
                        confirmMessage={$t('manage_inscriptions.confirm_accept_message')}
                        onConfirm={() => onConfirm?.(record.id)}
                        disabled={processing}
                        testId="confirm-inscription"
                    />
                    </div>
                {/if}
                {#if showRefuse}
                    <div class="pointer-events-auto" onclick={(e) => e.stopPropagation()}>
                    <ConfirmActionButton
                        icon={CloseIcon}
                        colorClass="preset-filled-error-500"
                        confirmTitle={$t('manage_inscriptions.confirm_refuse_title')}
                        confirmMessage={$t('manage_inscriptions.confirm_refuse_message')}
                        onConfirm={() => onRefuse?.(record.id)}
                        disabled={processing}
                        testId="refuse-inscription"
                    />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
