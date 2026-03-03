<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    import CollapsibleSection from './CollapsibleSection.svelte';
    import InscriptionRow from './InscriptionRow.svelte';

    let { records, processingRecordId = null, searchFilter = '', onAccept, onRefuse }: {
        records: any[];
        processingRecordId?: string | null;
        searchFilter?: string;
        onAccept: (id: string) => void;
        onRefuse: (id: string) => void;
    } = $props();

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
    let pendingRecords = $derived(byStatus(filteredRecords, 'PENDING'));
    let waitlistedRecords = $derived(byStatus(filteredRecords, 'WAITLISTED'));
    let acceptedRecords = $derived(byStatus(filteredRecords, 'ACCEPTED'));
</script>

{#snippet recordList(recs: any[], showAccept: boolean, showRefuse: boolean)}
    <div>
        {#each recs as record (record.id)}
            <InscriptionRow
                {record}
                {showAccept}
                {showRefuse}
                processing={processingRecordId === record.id}
                {onAccept}
                {onRefuse}
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
                    <Icon icon="mdi:clock-outline" width="1rem" height="1rem" />
                    <span class="text-sm font-semibold" data-testid="record-status-badge">{$t('manage_inscriptions.pending')}</span>
                    <span class="badge preset-tonal-warning text-xs">{pendingRecords.length}</span>
                </div>
                {@render recordList(pendingRecords, true, true)}
            </div>
        {/if}

        <!-- Waitlisted section (collapsible) -->
        {#if waitlistedRecords.length > 0}
            <CollapsibleSection
                icon="mdi:clock-alert-outline"
                label={$t('manage_inscriptions.waitlisted')}
                count={waitlistedRecords.length}
                badgeClass="preset-tonal-secondary"
            >
                {@render recordList(waitlistedRecords, true, true)}
            </CollapsibleSection>
        {/if}

        <!-- Accepted section (collapsible) -->
        {#if acceptedRecords.length > 0}
            <CollapsibleSection
                icon="mdi:check-circle"
                label={$t('manage_inscriptions.accepted')}
                count={acceptedRecords.length}
                badgeClass="preset-tonal-success"
            >
                {@render recordList(acceptedRecords, false, true)}
            </CollapsibleSection>
        {/if}
    </div>
{/if}
