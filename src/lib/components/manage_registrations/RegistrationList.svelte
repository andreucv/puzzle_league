<script lang="ts">
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import ClockAlertOutlineIcon from '@iconify-svelte/mdi/clock-alert-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import { t } from '$lib/translations';
    import CollapsibleSection from './CollapsibleSection.svelte';
    import RegistrationRow from './RegistrationRow.svelte';

    let { entries, availableTags = [], processingEntryId = null, searchFilter = '', onConfirm, onRefuse, onRemind }: {
        entries: any[];
        // Enum tag values (e.g. LOCAL_MUNICIPALITY); the manage page passes
        // category.tagCategories.map(tc => tc.tag) and RegistrationRow consumes a string[].
        availableTags?: string[];
        processingEntryId?: string | null;
        searchFilter?: string;
        onConfirm: (id: string) => void;
        onRefuse: (id: string) => void;
        onRemind: (id: string, note?: string) => void;
    } = $props();

    let selectedEntryId: string | null = $state(null);

    function toggleSelect(id: string) {
        selectedEntryId = selectedEntryId === id ? null : id;
    }

    function filterBySearch(recs: any[]): any[] {
        if (!searchFilter.trim()) return recs;
        const query = searchFilter.toLowerCase();
        return recs.filter((r: any) =>
            r.users.some((u: any) => u.name?.toLowerCase().includes(query)) ||
            (r.externalParticipants || []).some((ui: any) => ui.name?.toLowerCase().includes(query)) ||
            r.creator?.name?.toLowerCase().includes(query) ||
            r.creator?.email?.toLowerCase().includes(query)
        );
    }

    function byStatus(recs: any[], status: string): any[] {
        return recs.filter((r: any) => r.status === status);
    }

    let filteredEntries = $derived(filterBySearch(entries));
    let pendingEntries = $derived(byStatus(filteredEntries, 'PENDING_CONFIRMATION'));
    let waitlistedEntries = $derived(byStatus(filteredEntries, 'WAITLISTED'));
    // Confirmed entries sorted by confirmedAt ASC (earliest confirmed first)
    let confirmedEntries = $derived(
        byStatus(filteredEntries, 'CONFIRMED')
            .sort((a: any, b: any) =>
                new Date(a.confirmedAt).getTime() - new Date(b.confirmedAt).getTime()
            )
    );
</script>

{#snippet entryList(recs: any[], showConfirm: boolean, showRefuse: boolean, showRemind: boolean)}
    <div>
        {#each recs as entry (entry.id)}
            <RegistrationRow
                {entry}
                {availableTags}
                {showConfirm}
                {showRefuse}
                {showRemind}
                processing={processingEntryId === entry.id}
                selected={selectedEntryId === entry.id}
                {onConfirm}
                {onRefuse}
                {onRemind}
                onSelect={toggleSelect}
            />
        {/each}
    </div>
{/snippet}

{#if filteredEntries.length === 0}
    <p class="text-sm text-surface-500 italic" data-testid="no-registrations">
        {searchFilter.trim() ? $t('manage_registrations.no_results_for_search') : $t('manage_registrations.no_registrations')}
    </p>
{:else}
    <div class="space-y-3">
        <!-- Pending section (always visible) -->
        {#if pendingEntries.length > 0}
            <div data-testid="section-pending">
                <div class="flex items-center gap-2 mb-1">
                    <ClockOutlineIcon width="1rem" height="1rem" />
                    <span class="text-sm font-semibold" data-testid="entry-status-badge">{$t('manage_registrations.pending_confirmation')}</span>
                    <span class="badge preset-tonal-warning text-xs">{pendingEntries.length}</span>
                </div>
                {@render entryList(pendingEntries, true, true, true)}
            </div>
        {/if}

        <!-- Waitlisted section (collapsible) -->
        {#if waitlistedEntries.length > 0}
            <CollapsibleSection
                icon={ClockAlertOutlineIcon}
                label={$t('manage_registrations.waitlisted')}
                count={waitlistedEntries.length}
                badgeClass="preset-tonal-secondary"
                testId="toggle-section-waitlisted"
            >
                <div data-testid="section-waitlisted">
                    {@render entryList(waitlistedEntries, false, true, false)}
                </div>
            </CollapsibleSection>
        {/if}

        <!-- Confirmed section (collapsible) -->
        {#if confirmedEntries.length > 0}
            <CollapsibleSection
                icon={CheckCircleIcon}
                label={$t('manage_registrations.confirmed')}
                count={confirmedEntries.length}
                badgeClass="preset-tonal-success"
                testId="toggle-section-confirmed"
            >
                <div data-testid="section-confirmed">
                    {@render entryList(confirmedEntries, false, true, false)}
                </div>
            </CollapsibleSection>
        {/if}
    </div>
{/if}
