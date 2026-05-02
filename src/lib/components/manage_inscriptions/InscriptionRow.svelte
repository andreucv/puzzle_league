<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { t } from '$lib/translations';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import AccountEditOutlineIcon from '@iconify-svelte/mdi/account-edit-outline';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import BellRingOutlineIcon from '@iconify-svelte/mdi/bell-ring-outline';
    import ChevronRightIcon from '@iconify-svelte/mdi/chevron-right';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import ConfirmPopover from '$lib/components/common/ConfirmPopover.svelte';
    import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/inscription';

    let { record, showConfirm = false, showRefuse = false, showRemind = false, processing = false, selected = false, onConfirm, onRefuse, onRemind, onSelect }: {
        record: any;
        showConfirm?: boolean;
        showRefuse?: boolean;
        showRemind?: boolean;
        processing?: boolean;
        selected?: boolean;
        onConfirm?: (id: string) => void;
        onRefuse?: (id: string) => void;
        onRemind?: (id: string, note?: string) => void;
        onSelect?: (id: string) => void;
    } = $props();

    let hasActions = $derived(showConfirm || showRefuse || showRemind);
    let showReminderPopover = $state(false);

    let isOnCooldown = $derived(() => {
        if (!record.lastRemindedAt) return false;
        return Date.now() - new Date(record.lastRemindedAt).getTime() < PAYMENT_REMINDER_COOLDOWN_MS;
    });

    function formatRelativeTime(date: string | Date): string {
        const ms = Date.now() - new Date(date).getTime();
        const hours = Math.floor(ms / (1000 * 60 * 60));
        if (hours < 1) return '<1h';
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }

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

    <!-- Right side: table number + date + actions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="relative flex items-center shrink-0 ml-auto"
    >
        <!-- Table number badge (only for confirmed records with an assigned table) -->
        {#if record.tableNumber != null}
            <span class="badge preset-tonal-primary text-xs mr-2" data-testid="table-number-{record.id}">
                {$t('manage_inscriptions.table_number', { number: record.tableNumber })}
            </span>
        {/if}

        <!-- Date (always visible, sits behind buttons when selected) -->
        {#if inscriptionDate}
            <div class="text-right whitespace-nowrap">
                <span class="text-[0.7rem] leading-tight text-surface-400 dark:text-surface-500">
                    {inscriptionDate.date} · {inscriptionDate.time}
                </span>
                {#if showRemind && record.lastRemindedAt}
                    <div class="text-[0.6rem] leading-tight {isOnCooldown() ? 'text-warning-500' : 'text-surface-400 dark:text-surface-500'}">
                        {$t('manage_inscriptions.last_reminded', { time: formatRelativeTime(record.lastRemindedAt) })}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Chevron (always rendered when hasActions to keep layout stable) -->
        {#if hasActions}
            <ChevronRightIcon width="1.1rem" height="1.1rem" class="text-surface-400 ml-1 {selected ? 'invisible' : ''}" />
        {/if}

        <!-- Action buttons overlay when selected -->
        {#if selected}
            <div class="absolute inset-0 flex items-center justify-end gap-3 z-10 pointer-events-none">
                {#if showRemind}
                    <div class="pointer-events-auto relative" onclick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            class="btn-icon w-4 h-4 preset-filled-warning-500 rounded-full"
                            disabled={processing || isOnCooldown()}
                            onclick={() => showReminderPopover = !showReminderPopover}
                            data-testid="remind-inscription"
                        >
                            <BellRingOutlineIcon width="1rem" height="1rem" />
                        </button>
                        {#if showReminderPopover}
                            <ConfirmPopover
                                title={$t('manage_inscriptions.remind_confirm_title')}
                                message={$t('manage_inscriptions.remind_confirm_message')}
                                colorClass="preset-filled-warning-500"
                                onConfirm={(note) => {
                                    showReminderPopover = false;
                                    onRemind?.(record.id, note);
                                    onSelect?.(record.id);
                                }}
                                onCancel={() => showReminderPopover = false}
                                isProcessing={processing}
                                inputConfig={{ placeholder: $t('manage_inscriptions.remind_note_placeholder'), maxLength: 200 }}
                            />
                        {/if}
                    </div>
                {/if}
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
