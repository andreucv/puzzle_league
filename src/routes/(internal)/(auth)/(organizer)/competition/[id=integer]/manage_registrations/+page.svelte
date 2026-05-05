<script lang="ts">
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import AlertCircleIcon from '@iconify-svelte/mdi/alert-circle';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import SeatOutlineIcon from '@iconify-svelte/mdi/seat-outline';
    import InboxOutlineIcon from '@iconify-svelte/mdi/inbox-outline';
    import TableFurnitureIcon from '@iconify-svelte/mdi/table-furniture';
    import LoadingIcon from '@iconify-svelte/mdi/loading';
    import HistoryIcon from '@iconify-svelte/mdi/history';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import ManageRegistrationStatus from './components/ManageRegistrationStatus.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import SearchInput from '$lib/components/common/SearchInput.svelte';
    import RegistrationList from '$lib/components/manage_registrations/RegistrationList.svelte';
    import CollapsibleSection from '$lib/components/manage_registrations/CollapsibleSection.svelte';
    import ConfirmPopover from '$lib/components/common/ConfirmPopover.svelte';
    import BellRingOutlineIcon from '@iconify-svelte/mdi/bell-ring-outline';
    import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/registration';

    let { data } = $props();

    let competition = $derived(data.competition);
    let categoriesWithRegistrations = $derived(data.categoriesWithRegistrations || []);
    // Only NOT_STARTED categories in the main view; started/completed ones go in a collapsed section
    let activeCategories = $derived(
        categoriesWithRegistrations.filter((c: any) => c.status === 'NOT_STARTED')
    );
    let startedCategories = $derived(
        categoriesWithRegistrations.filter((c: any) => c.status !== 'NOT_STARTED')
    );
    let registrationOpen = $state(data.competition.registrationOpen);
    let searchFilter = $state('');

    // Loading state for individual actions
    let processingEntryId: string | null = $state(null);
    let publishingCategoryId: number | null = $state(null);
    let confirmingCategoryId: number | null = $state(null);
    let remindingCategoryId: number | null = $state(null);
    let resultMessage = $state<{ success: boolean; message: string } | null>(null);
    let messageDismissTimer: ReturnType<typeof setTimeout> | null = null;
    let messageProgressKey = $state(0);

    function showResultMessage(msg: { success: boolean; message: string }) {
        if (messageDismissTimer) clearTimeout(messageDismissTimer);
        resultMessage = msg;
        messageProgressKey++;
        messageDismissTimer = setTimeout(() => {
            resultMessage = null;
            messageDismissTimer = null;
        }, 5000);
    }

    async function handleConfirm(entryId: string) {
        processingEntryId = entryId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
        try {
            const response = await fetch(`/api/registrations/${entryId}/confirm`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.confirmed_success') });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.confirm_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.confirm_error') });
        } finally {
            processingEntryId = null;
        }
    }

    async function handleRefuse(entryId: string) {
        processingEntryId = entryId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

        try {
            const response = await fetch(`/api/registrations/${entryId}/refuse`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.refused_success') });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.refuse_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.refuse_error') });
        } finally {
            processingEntryId = null;
        }
    }

    async function handlePublishTables(categoryId: number) {
        publishingCategoryId = categoryId;
        try {
            const response = await fetch(`/api/categories/${categoryId}/publish-tables`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.publish_tables_success', { count: result.assignedCount }) });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.publish_tables_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.publish_tables_error') });
        } finally {
            publishingCategoryId = null;
        }
    }

    async function handleRemind(entryId: string, note?: string) {
        processingEntryId = entryId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
        try {
            const response = await fetch(`/api/registrations/${entryId}/remind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note }),
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.remind_success', { count: result.remindedCount }) });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.remind_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.remind_error') });
        } finally {
            processingEntryId = null;
        }
    }

    async function handleBulkRemind(categoryId: number, note?: string) {
        remindingCategoryId = categoryId;
        try {
            const response = await fetch(`/api/categories/${categoryId}/remind-pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.remind_bulk_success', { reminded: result.remindedCount, skipped: result.skippedCount }) });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.remind_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.remind_error') });
        } finally {
            remindingCategoryId = null;
        }
    }
</script>

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <div class="space-y-4">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('manage_registrations.title')} subtitle={competition.name}/>
    </div>

    <!-- Manage Registration Status -->
    <div>
        <ManageRegistrationStatus competition_id={competition.id} competition_registration_status={registrationOpen} hasCategories={categoriesWithRegistrations.length > 0} onStatusChange={(status) => registrationOpen = status} />
    </div>

    <!-- User Search -->
    <SearchInput bind:filter={searchFilter} placeholder={$t('manage_registrations.search_placeholder')} />

    <!-- Result message -->
    {#if resultMessage}
        <div class="rounded-lg overflow-hidden {resultMessage.success ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
            <div class="p-4 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    {#if resultMessage.success}
                        <CheckCircleIcon width="1.2rem" height="1.2rem" />
                    {:else}
                        <AlertCircleIcon width="1.2rem" height="1.2rem" />
                    {/if}
                    <span>{resultMessage.message}</span>
                </div>
                <button type="button" class="opacity-70 hover:opacity-100" onclick={() => { resultMessage = null; if (messageDismissTimer) { clearTimeout(messageDismissTimer); messageDismissTimer = null; } }}>
                    <CloseIcon width="1rem" height="1rem" />
                </button>
            </div>
            {#key messageProgressKey}
                <div class="h-1 w-full {resultMessage.success ? 'bg-success-900/30' : 'bg-error-900/30'}">
                    <div class="h-full {resultMessage.success ? 'bg-success-200' : 'bg-error-200'} animate-shrink"></div>
                </div>
            {/key}
        </div>
    {/if}

    <!-- Categories with registrations -->
    {#snippet categoryCard(category: any, showActions: boolean)}
        <Card>
            <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
                <CategoryCardTitle type={category.type} subname={category.subname ?? ''}/>
                {#if category.maxParties}
                    {@const confirmedCount = category.entries.filter((r: any) => r.status === 'CONFIRMED').length}
                    {@const remaining = category.maxParties - confirmedCount}
                    <span class="text-sm {remaining > 0 ? 'text-surface-600 dark:text-surface-400' : 'text-error-600 dark:text-error-400'}">
                        <SeatOutlineIcon width="1rem" height="1rem" class="inline-block align-text-bottom mr-1" />
                        {$t('manage_registrations.seats_available', { accepted: confirmedCount, max: category.maxParties })}
                    </span>
                {/if}
            </div>

            <RegistrationList
                entries={category.entries}
                processingEntryId={processingEntryId}
                {searchFilter}
                onConfirm={handleConfirm}
                onRefuse={handleRefuse}
                onRemind={handleRemind}
            />

            <!-- Action buttons only for active (NOT_STARTED) categories -->
            {#if showActions}
            <!-- Bulk remind pending button -->
            {@const pendingEntries = category.entries.filter((r: any) => r.status === 'PENDING_CONFIRMATION')}
            {@const eligiblePendingCount = pendingEntries.filter((r: any) => {
                if (!r.lastRemindedAt) return true;
                return Date.now() - new Date(r.lastRemindedAt).getTime() >= PAYMENT_REMINDER_COOLDOWN_MS;
            }).length}
            {#if pendingEntries.length > 0}
                <div class="border-t border-surface-200 dark:border-surface-700">
                    <div class="relative w-full">
                        <button
                            type="button"
                            class="btn preset-filled-warning-500 gap-2 w-full"
                            disabled={remindingCategoryId === category.id || eligiblePendingCount === 0}
                            onclick={() => remindingCategoryId = remindingCategoryId === category.id ? null : category.id}
                            data-testid="bulk-remind-pending"
                        >
                            {#if remindingCategoryId === category.id}
                                <LoadingIcon width="1.1rem" height="1.1rem" class="animate-spin" />
                            {:else}
                                <BellRingOutlineIcon width="1.1rem" height="1.1rem" />
                            {/if}
                            {$t('manage_registrations.remind_all_pending', { count: eligiblePendingCount })}
                        </button>
                        {#if remindingCategoryId === category.id && eligiblePendingCount > 0}
                            <ConfirmPopover
                                title={$t('manage_registrations.remind_confirm_title')}
                                message={$t('manage_registrations.remind_bulk_confirm_message')}
                                colorClass="preset-filled-warning-500"
                                onConfirm={async (note) => {
                                    const catId = category.id;
                                    remindingCategoryId = null;
                                    await handleBulkRemind(catId, note);
                                }}
                                onCancel={() => remindingCategoryId = null}
                                isProcessing={false}
                                inputConfig={{ placeholder: $t('manage_registrations.remind_note_placeholder'), maxLength: 200 }}
                            />
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Assign tables button: placed at the card level for quick 1-click access -->
            {@const confirmedCount = category.entries.filter((r: any) => r.status === 'CONFIRMED').length}
            {#if confirmedCount > 0}
                <div class="border-t border-surface-200 dark:border-surface-700">
                    <div class="relative w-full">
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 gap-2 w-full"
                            disabled={publishingCategoryId === category.id}
                            onclick={() => confirmingCategoryId = confirmingCategoryId === category.id ? null : category.id}
                            data-testid="publish-tables"
                        >
                            {#if publishingCategoryId === category.id}
                                <LoadingIcon width="1.1rem" height="1.1rem" class="animate-spin" />
                            {:else}
                                <TableFurnitureIcon width="1.1rem" height="1.1rem" />
                            {/if}
                            {$t('manage_registrations.publish_tables')}
                        </button>
                        {#if confirmingCategoryId === category.id}
                            <ConfirmPopover
                                title={$t('manage_registrations.publish_tables_confirm_title')}
                                message={$t('manage_registrations.publish_tables_confirm_message')}
                                colorClass="preset-filled-primary-500"
                                onConfirm={async () => {
                                    confirmingCategoryId = null;
                                    await handlePublishTables(category.id);
                                }}
                                onCancel={() => confirmingCategoryId = null}
                                isProcessing={publishingCategoryId === category.id}
                            />
                        {/if}
                    </div>
                </div>
            {/if}
            {/if}
        </Card>
    {/snippet}

    <div class="space-y-6">
        {#each activeCategories as category (category.id)}
            {@render categoryCard(category, true)}
        {/each}
    </div>

    <!-- Started / completed categories (collapsed by default) -->
    {#if startedCategories.length > 0}
        <CollapsibleSection
            icon={HistoryIcon}
            label={$t('manage_registrations.started_categories')}
            count={startedCategories.length}
            badgeClass="preset-tonal-secondary"
            testId="toggle-section-started-categories"
        >
            <div class="space-y-6">
                {#each startedCategories as category (category.id)}
                    {@render categoryCard(category, false)}
                {/each}
            </div>
        </CollapsibleSection>
    {/if}

    {#if categoriesWithRegistrations.length === 0}
        <div class="card p-8 text-center">
            <InboxOutlineIcon class="text-6xl text-surface-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">{$t('manage_registrations.no_categories')}</h3>
        </div>
    {/if}
</div>

<style>
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
    .animate-shrink {
        animation: shrink 5s linear forwards;
    }
</style>
