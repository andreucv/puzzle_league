<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { t, locale } from '$lib/translations';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import AccountEditOutlineIcon from '@iconify-svelte/mdi/account-edit-outline';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import BellRingOutlineIcon from '@iconify-svelte/mdi/bell-ring-outline';
    import ChevronRightIcon from '@iconify-svelte/mdi/chevron-right';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import ConfirmPopover from '$lib/components/common/ConfirmPopover.svelte';
    import TrashCanOutlineIcon from '@iconify-svelte/mdi/trash-can-outline';
    import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/registration';
    import { invalidateAll } from '$app/navigation';

    let { entry, availableTags = [], showConfirm = false, showRefuse = false, showRemind = false, processing = false, selected = false, onConfirm, onRefuse, onRemind, onSelect }: {
        entry: any;
        availableTags?: string[];
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

    // ---- Entry tag (sub-prize) review -------------------------------------
    let tagProcessing = $state(false);

    async function runTagRequest(url: string, method: string, body?: unknown) {
        tagProcessing = true;
        try {
            const res = await fetch(url, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (res.ok) await invalidateAll();
        } finally {
            tagProcessing = false;
        }
    }

    const confirmTag = () => runTagRequest(`/api/entry-tags/${entry.entryTag.id}/confirm`, 'POST');
    const rejectTag = () => runTagRequest(`/api/entry-tags/${entry.entryTag.id}/reject`, 'POST');
    const removeTag = () => runTagRequest(`/api/entry-tags/${entry.entryTag.id}`, 'DELETE');
    function assignTag(tag: string) {
        if (!tag) return;
        runTagRequest('/api/entry-tags', 'POST', { entryId: entry.id, tag });
    }

    let hasActions = $derived(showConfirm || showRefuse || showRemind);
    let showReminderPopover = $state(false);

    let isOnCooldown = $derived(() => {
        if (!entry.lastRemindedAt) return false;
        return Date.now() - new Date(entry.lastRemindedAt).getTime() < PAYMENT_REMINDER_COOLDOWN_MS;
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
        const loc = $locale ?? undefined;
        return {
            time: d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }),
            date: d.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
        };
    }

    // Show confirmedAt for confirmed entries, createdAt for pending/waitlisted
    let displayDate = $derived(
        entry.status === 'CONFIRMED' ? entry.confirmedAt : entry.createdAt
    );
    let registrationDate = $derived(displayDate ? formatDateTime(displayDate) : null);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="flex items-center gap-2 py-2 px-1 w-full border-b border-surface-200 dark:border-surface-700 last:border-b-0 {processing ? 'opacity-50' : ''} {hasActions ? 'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors' : ''}"
    data-testid="registration-row-entry-{entry.id}"
    onclick={() => hasActions && onSelect?.(entry.id)}
>
    <!-- Stacked avatars -->
    <div class="flex items-center shrink-0">
        {#each entry.users as user, i}
            <Avatar class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 {i > 0 ? '-ml-4' : ''}">
                <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                <Avatar.Fallback class="text-[0.6rem]">{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
            </Avatar>
        {/each}
        {#each entry.externalParticipants || [] as intent, i}
            <div class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(entry.users.length + i) > 0 ? '-ml-4' : ''}">
                <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
            </div>
        {/each}
    </div>

    <!-- Names & creator -->
    <div class="min-w-0 flex-1">
        <div class="text-xs font-medium flex flex-wrap gap-x-1">
            {#each [...entry.users.map((u: any) => u.name), ...(entry.externalParticipants || []).map((ui: any) => ui.name)] as name, i}
                <span>{name}{i < entry.users.length + (entry.externalParticipants?.length ?? 0) - 1 ? ',' : ''}</span>
            {/each}
        </div>
        {#if entry.creator}
            <a href="/public_profile/{entry.creator.id}" class="inline-flex items-center gap-0.5 text-[0.65rem] text-surface-500 dark:text-surface-400 hover:text-primary-500 hover:underline transition-colors truncate max-w-full">
                <AccountEditOutlineIcon width="0.75rem" height="0.75rem" class="shrink-0" />
                {entry.creator.name ?? entry.creator.email}
            </a>
        {/if}

        <!-- Sub-prize tag review -->
        {#if entry.entryTag || availableTags.length > 0}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="mt-1 flex items-center gap-1 flex-wrap" onclick={(e) => e.stopPropagation()}>
                {#if entry.entryTag}
                    <span class="badge text-[0.6rem] {entry.entryTag.status === 'CONFIRMED' ? 'preset-filled-success-500' : entry.entryTag.status === 'REJECTED' ? 'preset-tonal-error' : 'preset-tonal-warning'}">
                        {$t('participant_tags.' + entry.entryTag.tag)}{#if entry.entryTag.status === 'PENDING'} · {$t('manage_registrations.tag_status_pending')}{:else if entry.entryTag.status === 'REJECTED'} · {$t('manage_registrations.tag_status_rejected')}{/if}
                    </span>
                    {#if entry.entryTag.status === 'PENDING'}
                        <button type="button" class="btn-icon btn-icon-sm preset-filled-success-500 w-5 h-5" disabled={tagProcessing} onclick={confirmTag} aria-label={$t('manage_registrations.tag_confirm')}>
                            <CheckIcon width="0.8rem" height="0.8rem" />
                        </button>
                        <button type="button" class="btn-icon btn-icon-sm preset-filled-error-500 w-5 h-5" disabled={tagProcessing} onclick={rejectTag} aria-label={$t('manage_registrations.tag_reject')}>
                            <CloseIcon width="0.8rem" height="0.8rem" />
                        </button>
                    {/if}
                    <button type="button" class="btn-icon btn-icon-sm preset-tonal w-5 h-5" disabled={tagProcessing} onclick={removeTag} aria-label={$t('manage_registrations.tag_remove')}>
                        <TrashCanOutlineIcon width="0.8rem" height="0.8rem" />
                    </button>
                {:else}
                    <select class="select select-sm text-xs h-6 py-0 max-w-[10rem]" disabled={tagProcessing} onchange={(e) => assignTag(e.currentTarget.value)}>
                        <option value="">{$t('manage_registrations.tag_assign_placeholder')}</option>
                        {#each availableTags as tagOption}
                            <option value={tagOption}>{$t('participant_tags.' + tagOption)}</option>
                        {/each}
                    </select>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Right side: table number + date + actions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="relative flex items-center shrink-0 ml-auto"
    >
        <!-- Table number badge (only for confirmed entries with an assigned table) -->
        {#if entry.tableNumber != null}
            <span class="badge preset-tonal-primary text-xs mr-2" data-testid="table-number-{entry.id}">
                {$t('manage_registrations.table_number', { number: entry.tableNumber })}
            </span>
        {/if}

        <!-- Date (always visible, sits behind buttons when selected) -->
        {#if registrationDate}
            <div class="text-right whitespace-nowrap">
                <span class="text-[0.7rem] leading-tight text-surface-400 dark:text-surface-500">
                    {registrationDate.date} · {registrationDate.time}
                </span>
                {#if showRemind && entry.lastRemindedAt}
                    <div class="text-[0.6rem] leading-tight {isOnCooldown() ? 'text-warning-500' : 'text-surface-400 dark:text-surface-500'}">
                        {$t('manage_registrations.last_reminded', { time: formatRelativeTime(entry.lastRemindedAt) })}
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
                            data-testid="remind-registration"
                        >
                            <BellRingOutlineIcon width="1rem" height="1rem" />
                        </button>
                        {#if showReminderPopover}
                            <ConfirmPopover
                                title={$t('manage_registrations.remind_confirm_title')}
                                message={$t('manage_registrations.remind_confirm_message')}
                                colorClass="preset-filled-warning-500"
                                onConfirm={(note) => {
                                    showReminderPopover = false;
                                    onRemind?.(entry.id, note);
                                    onSelect?.(entry.id);
                                }}
                                onCancel={() => showReminderPopover = false}
                                isProcessing={processing}
                                inputConfig={{ placeholder: $t('manage_registrations.remind_note_placeholder'), maxLength: 200 }}
                            />
                        {/if}
                    </div>
                {/if}
                {#if showConfirm}
                    <div class="pointer-events-auto" onclick={(e) => e.stopPropagation()}>
                    <ConfirmActionButton
                        icon={CheckIcon}
                        colorClass="preset-filled-success-500"
                        confirmTitle={$t('manage_registrations.confirm_accept_title')}
                        confirmMessage={$t('manage_registrations.confirm_accept_message')}
                        onConfirm={() => onConfirm?.(entry.id)}
                        disabled={processing}
                        testId="confirm-registration"
                    />
                    </div>
                {/if}
                {#if showRefuse}
                    <div class="pointer-events-auto" onclick={(e) => e.stopPropagation()}>
                    <ConfirmActionButton
                        icon={CloseIcon}
                        colorClass="preset-filled-error-500"
                        confirmTitle={$t('manage_registrations.confirm_refuse_title')}
                        confirmMessage={$t('manage_registrations.confirm_refuse_message')}
                        onConfirm={() => onRefuse?.(entry.id)}
                        disabled={processing}
                        testId="refuse-registration"
                    />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
