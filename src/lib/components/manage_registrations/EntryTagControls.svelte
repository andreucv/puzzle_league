<script lang="ts">
    import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
    import { t } from '$lib/translations';
    import { invalidateAll } from '$app/navigation';
    import TagOutlineIcon from '@iconify-svelte/mdi/tag-outline';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import TrashCanOutlineIcon from '@iconify-svelte/mdi/trash-can-outline';

    let { entry, availableTags = [], open = $bindable(false) }: {
        entry: any;
        availableTags?: string[];
        // Bindable so the row's action-menu button can open the modal for untagged entries.
        open?: boolean;
    } = $props();

    let tagProcessing = $state(false);
    let selectedTag = $state('');

    async function runTagRequest(url: string, method: string, body?: unknown) {
        tagProcessing = true;
        try {
            const res = await fetch(url, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (res.ok) {
                await invalidateAll();
                open = false;
            }
        } finally {
            tagProcessing = false;
        }
    }

    const confirmTag = () => runTagRequest(`/api/entry-tags/${entry.entryTag.id}/confirm`, 'POST');
    const rejectTag = () => runTagRequest(`/api/entry-tags/${entry.entryTag.id}/reject`, 'POST');
    const removeTag = () => runTagRequest(`/api/entry-tags/${entry.entryTag.id}`, 'DELETE');
    function assignTag() {
        if (!selectedTag) return;
        runTagRequest('/api/entry-tags', 'POST', { entryId: entry.id, tag: selectedTag });
    }

    // Chip color + status label, mirroring the previous inline badge styling.
    let chipClass = $derived(
        entry.entryTag?.status === 'CONFIRMED' ? 'preset-filled-success-500'
        : entry.entryTag?.status === 'REJECTED' ? 'preset-tonal-error'
        : 'preset-tonal-warning'
    );
    let statusLabel = $derived(
        entry.entryTag?.status === 'CONFIRMED' ? $t('manage_registrations.tag_status_confirmed')
        : entry.entryTag?.status === 'REJECTED' ? $t('manage_registrations.tag_status_rejected')
        : $t('manage_registrations.tag_status_pending')
    );

    let participantNames = $derived(
        [
            ...(entry.users ?? []).map((u: any) => u.name),
            ...(entry.externalParticipants ?? []).map((p: any) => p.name),
        ].filter(Boolean).join(', ')
    );

    function openModal(e: MouseEvent) {
        e.stopPropagation();
        selectedTag = '';
        open = true;
    }
</script>

{#if entry.entryTag}
    <!-- Tagged: always-visible status chip is the modal trigger -->
    <div class="mt-1">
        <button
            type="button"
            class="badge {chipClass} text-[0.65rem] gap-1 max-w-full"
            onclick={openModal}
            data-testid="entry-tag-chip-{entry.id}"
        >
            <TagOutlineIcon width="0.8rem" height="0.8rem" class="shrink-0" />
            <span class="truncate">{$t('participant_tags.' + entry.entryTag.tag)}{#if entry.entryTag.status !== 'CONFIRMED'} · {statusLabel}{/if}</span>
        </button>
    </div>
{/if}

<!-- Management modal -->
<Dialog {open} onOpenChange={(e) => (open = e.open)}>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-3">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <Dialog.Content
                class="relative w-full max-w-md card bg-surface-50 dark:bg-surface-900 p-4 shadow-xl space-y-3"
                onclick={(e) => e.stopPropagation()}
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <h3 class="text-sm font-semibold">{$t('manage_registrations.tag_modal_title')}</h3>
                        {#if participantNames}
                            <p class="text-xs text-surface-500 dark:text-surface-400 truncate">{participantNames}</p>
                        {/if}
                    </div>
                    <Dialog.CloseTrigger class="btn-icon btn-icon-sm preset-tonal shrink-0" aria-label={$t('manage_registrations.close')}>
                        <CloseIcon width="1rem" height="1rem" />
                    </Dialog.CloseTrigger>
                </div>

                {#if entry.entryTag}
                    <div class="flex items-center gap-2">
                        <span class="badge {chipClass} text-xs gap-1">
                            <TagOutlineIcon width="0.9rem" height="0.9rem" class="shrink-0" />
                            {$t('participant_tags.' + entry.entryTag.tag)}
                        </span>
                        <span class="text-xs text-surface-500 dark:text-surface-400">{statusLabel}</span>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        {#if entry.entryTag.status === 'PENDING'}
                            <button type="button" class="btn btn-sm preset-filled-success-500 gap-1" disabled={tagProcessing} onclick={confirmTag} data-testid="modal-tag-confirm">
                                <CheckIcon width="1rem" height="1rem" />
                                {$t('manage_registrations.tag_confirm')}
                            </button>
                            <button type="button" class="btn btn-sm preset-filled-error-500 gap-1" disabled={tagProcessing} onclick={rejectTag} data-testid="modal-tag-reject">
                                <CloseIcon width="1rem" height="1rem" />
                                {$t('manage_registrations.tag_reject')}
                            </button>
                        {/if}
                        <button type="button" class="btn btn-sm preset-tonal gap-1" disabled={tagProcessing} onclick={removeTag} data-testid="modal-tag-remove">
                            <TrashCanOutlineIcon width="1rem" height="1rem" />
                            {$t('manage_registrations.tag_remove')}
                        </button>
                    </div>
                {:else}
                    <div class="flex flex-col gap-2">
                        <select class="select select-sm text-sm" disabled={tagProcessing} bind:value={selectedTag} data-testid="modal-tag-select">
                            <option value="">{$t('manage_registrations.tag_assign_placeholder')}</option>
                            {#each availableTags as tagOption}
                                <option value={tagOption}>{$t('participant_tags.' + tagOption)}</option>
                            {/each}
                        </select>
                        <button type="button" class="btn btn-sm preset-filled-primary-500 gap-1 self-start" disabled={tagProcessing || !selectedTag} onclick={assignTag} data-testid="modal-tag-assign">
                            <CheckIcon width="1rem" height="1rem" />
                            {$t('manage_registrations.tag_assign')}
                        </button>
                    </div>
                {/if}
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
