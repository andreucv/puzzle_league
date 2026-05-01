<script lang="ts">
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import ClockAlertOutlineIcon from '@iconify-svelte/mdi/clock-alert-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import TableFurnitureIcon from '@iconify-svelte/mdi/table-furniture';
    import ConfirmPopover from '$lib/components/common/ConfirmPopover.svelte';
    import LoadingIcon from '@iconify-svelte/mdi/loading';
    import { t } from '$lib/translations';
    import CollapsibleSection from './CollapsibleSection.svelte';
    import InscriptionRow from './InscriptionRow.svelte';

    let { records, processingRecordId = null, searchFilter = '', publishingTables = false, onConfirm, onRefuse, onPublishTables }: {
        records: any[];
        processingRecordId?: string | null;
        searchFilter?: string;
        publishingTables?: boolean;
        onConfirm: (id: string) => void;
        onRefuse: (id: string) => void;
        onPublishTables?: () => void;
    } = $props();

    let selectedRecordId: string | null = $state(null);
    let showPublishConfirm = $state(false);
    let isPublishing = $state(false);

    function toggleSelect(id: string) {
        selectedRecordId = selectedRecordId === id ? null : id;
    }

    function filterBySearch(recs: any[]): any[] {
        if (!searchFilter.trim()) return recs;
        const query = searchFilter.toLowerCase();
        return recs.filter((r: any) =>
            r.users.some((u: any) => u.name?.toLowerCase().includes(query)) ||
            (r.userIntents || []).some((ui: any) => ui.name?.toLowerCase().includes(query)) ||
            r.creator?.name?.toLowerCase().includes(query) ||
            r.creator?.email?.toLowerCase().includes(query)
        );
    }

    function byStatus(recs: any[], status: string): any[] {
        return recs.filter((r: any) => r.status === status);
    }

    let filteredRecords = $derived(filterBySearch(records));
    let pendingRecords = $derived(byStatus(filteredRecords, 'PENDING_CONFIRMATION'));
    let waitlistedRecords = $derived(byStatus(filteredRecords, 'WAITLISTED'));
    let confirmedRecords = $derived(byStatus(filteredRecords, 'CONFIRMED'));
</script>

{#snippet recordList(recs: any[], showConfirm: boolean, showRefuse: boolean)}
    <div>
        {#each recs as record (record.id)}
            <InscriptionRow
                {record}
                {showConfirm}
                {showRefuse}
                processing={processingRecordId === record.id}
                selected={selectedRecordId === record.id}
                {onConfirm}
                {onRefuse}
                onSelect={toggleSelect}
            />
        {/each}
    </div>
{/snippet}

{#if filteredRecords.length === 0}
    <p class="text-sm text-surface-500 italic">
        {searchFilter.trim() ? $t('manage_inscriptions.no_results_for_search') : $t('manage_inscriptions.no_inscriptions')}
    </p>
{:else}
    <div class="space-y-3">
        <!-- Pending section (always visible) -->
        {#if pendingRecords.length > 0}
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <ClockOutlineIcon width="1rem" height="1rem" />
                    <span class="text-sm font-semibold" data-testid="record-status-badge">{$t('manage_inscriptions.pending_confirmation')}</span>
                    <span class="badge preset-tonal-warning text-xs">{pendingRecords.length}</span>
                </div>
                {@render recordList(pendingRecords, true, true)}
            </div>
        {/if}

        <!-- Waitlisted section (collapsible) -->
        {#if waitlistedRecords.length > 0}
            <CollapsibleSection
                icon={ClockAlertOutlineIcon}
                label={$t('manage_inscriptions.waitlisted')}
                count={waitlistedRecords.length}
                badgeClass="preset-tonal-secondary"
                testId="toggle-section-waitlisted"
            >
                {@render recordList(waitlistedRecords, true, true)}
            </CollapsibleSection>
        {/if}

        <!-- Confirmed section (collapsible) -->
        {#if confirmedRecords.length > 0}
            <CollapsibleSection
                icon={CheckCircleIcon}
                label={$t('manage_inscriptions.confirmed')}
                count={confirmedRecords.length}
                badgeClass="preset-tonal-success"
                testId="toggle-section-confirmed"
            >
                {@render recordList(confirmedRecords, false, true)}
                {#if onPublishTables}
                    <div class="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex justify-end">
                        <div class="relative">
                            <button
                                type="button"
                                class="btn preset-filled-primary-500 gap-2"
                                disabled={publishingTables || isPublishing}
                                onclick={() => showPublishConfirm = !showPublishConfirm}
                                data-testid="publish-tables"
                            >
                                {#if publishingTables || isPublishing}
                                    <LoadingIcon width="1.1rem" height="1.1rem" class="animate-spin" />
                                {:else}
                                    <TableFurnitureIcon width="1.1rem" height="1.1rem" />
                                {/if}
                                {$t('manage_inscriptions.publish_tables')}
                            </button>
                            {#if showPublishConfirm}
                                <ConfirmPopover
                                    title={$t('manage_inscriptions.publish_tables_confirm_title')}
                                    message={$t('manage_inscriptions.publish_tables_confirm_message')}
                                    colorClass="preset-filled-primary-500"
                                    onConfirm={async () => {
                                        isPublishing = true;
                                        try { await onPublishTables?.(); }
                                        finally { isPublishing = false; showPublishConfirm = false; }
                                    }}
                                    onCancel={() => showPublishConfirm = false}
                                    isProcessing={isPublishing}
                                />
                            {/if}
                        </div>
                    </div>
                {/if}
            </CollapsibleSection>
        {/if}
    </div>
{/if}
