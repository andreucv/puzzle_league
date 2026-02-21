<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
    import FilterTabs from '$lib/components/FilterTabs.svelte';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import ManageRegistrationStatus from '$lib/components/ManageRegistrationStatus.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';

    let { data } = $props();

    let competition = $derived(data.competition);
    let categoriesWithInscriptions = $derived(data.categoriesWithInscriptions || []);
    let registrationOpen = $state(data.competition.registrationOpen);

    // Filter state
    type FilterStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REFUSED';
    let activeFilter: FilterStatus = $state('ALL');

    // Filter tabs for FilterTabs component
    let totalAll = $derived(
        categoriesWithInscriptions.reduce((sum: number, cat: any) => sum + cat.records.length, 0)
    );

    let filterTabs = $derived([
        { id: 'ALL', label: $t('manage_inscriptions.all') || 'All', count: totalAll },
        { id: 'PENDING', label: $t('manage_inscriptions.pending'), count: categoriesWithInscriptions.reduce((sum: number, cat: any) => sum + countByStatus(cat.records, 'PENDING'), 0) },
        { id: 'ACCEPTED', label: $t('manage_inscriptions.accepted'), count: categoriesWithInscriptions.reduce((sum: number, cat: any) => sum + countByStatus(cat.records, 'ACCEPTED'), 0) },
        { id: 'REFUSED', label: $t('manage_inscriptions.refused'), count: categoriesWithInscriptions.reduce((sum: number, cat: any) => sum + countByStatus(cat.records, 'REFUSED'), 0) },
    ]);

    // Loading state for individual actions
    let processingRecordId: string | null = $state(null);
    let isLoading = $state(false);
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

    // Filter records in a category by active filter
    function filterRecords(records: any[]) {
        if (activeFilter === 'ALL') return records;
        return records.filter((r: any) => r.status === activeFilter);
    }

    // Count records by status
    function countByStatus(records: any[], status: string): number {
        return records.filter((r: any) => r.status === status).length;
    }

    // Get status badge classes
    function getStatusBadgeClasses(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'preset-filled-success-500';
            case 'PENDING': return 'preset-filled-warning-500';
            case 'REFUSED': return 'preset-filled-error-500';
            default: return 'preset-tonal';
        }
    }

    function getStatusIcon(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'mdi:check-circle';
            case 'PENDING': return 'mdi:clock-outline';
            case 'REFUSED': return 'mdi:close-circle';
            default: return 'mdi:help-circle';
        }
    }

    async function handleAccept(recordId: string) {
        processingRecordId = recordId;
        isLoading = true;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

        try {
            const response = await fetch(`/api/inscriptions/${recordId}/accept`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_inscriptions.accepted_success') });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_inscriptions.accept_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_inscriptions.accept_error') });
        } finally {
            processingRecordId = null;
            isLoading = false;
        }
    }

    async function handleRefuse(recordId: string) {
        processingRecordId = recordId;
        isLoading = true;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

        try {
            const response = await fetch(`/api/inscriptions/${recordId}/refuse`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_inscriptions.refused_success') });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_inscriptions.refuse_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_inscriptions.refuse_error') });
        } finally {
            processingRecordId = null;
            isLoading = false;
        }
    }

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString();
    };
</script>

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <div class="space-y-4">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('manage_inscriptions.title')}/>
        <CompetitionTitle title={competition.name} />
    </div>

    <!-- Manage Registration Status -->
    <div>
        <ManageRegistrationStatus competition_id={competition.id} competition_registration_status={registrationOpen} hasCategories={categoriesWithInscriptions.length > 0} onStatusChange={(status) => registrationOpen = status} />
    </div>

    <!-- Result message -->
    {#if resultMessage}
        <div class="rounded-lg overflow-hidden {resultMessage.success ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
            <div class="p-4 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <Icon icon={resultMessage.success ? 'mdi:check-circle' : 'mdi:alert-circle'} width="1.2rem" height="1.2rem" />
                    <span>{resultMessage.message}</span>
                </div>
                <button type="button" class="opacity-70 hover:opacity-100" onclick={() => { resultMessage = null; if (messageDismissTimer) { clearTimeout(messageDismissTimer); messageDismissTimer = null; } }}>
                    <Icon icon="mdi:close" width="1rem" height="1rem" />
                </button>
            </div>
            {#key messageProgressKey}
                <div class="h-1 w-full {resultMessage.success ? 'bg-success-900/30' : 'bg-error-900/30'}">
                    <div class="h-full {resultMessage.success ? 'bg-success-200' : 'bg-error-200'} animate-shrink"></div>
                </div>
            {/key}
        </div>
    {/if}

    <!-- Filter tabs -->
    <div>
        <FilterTabs tabs={filterTabs} bind:activeTab={activeFilter} />
    </div>

    <!-- Categories with inscriptions -->
    <div class="space-y-6">
        {#each categoriesWithInscriptions as category (category.id)}
            {@const filteredRecords = filterRecords(category.records)}
            {@const pendingCount = countByStatus(category.records, 'PENDING')}
            {@const acceptedCount = countByStatus(category.records, 'ACCEPTED')}
            {@const refusedCount = countByStatus(category.records, 'REFUSED')}

            <Card>
                <CategoryCardTitle type={category.type} subname={category.subname ?? ''}/>

                <!-- Status summary for this category -->
                <div class="flex flex-wrap gap-2 mb-4">
                    {#if pendingCount > 0}
                        <span class="badge preset-filled-warning-500 text-xs">
                            {pendingCount} {$t('manage_inscriptions.pending')}
                        </span>
                    {/if}
                    <span class="badge preset-filled-success-500 text-xs">
                        {acceptedCount} {$t('manage_inscriptions.accepted')}
                    </span>
                    {#if refusedCount > 0}
                        <span class="badge preset-filled-error-500 text-xs">
                            {refusedCount} {$t('manage_inscriptions.refused')}
                        </span>
                    {/if}
                    {#if category.maxParties}
                        <span class="badge preset-tonal text-xs">
                            {$t('manage_inscriptions.max_slots')}: {acceptedCount}/{category.maxParties}
                        </span>
                    {/if}
                </div>

                <!-- Inscription records list -->
                {#if filteredRecords.length === 0}
                    <p class="text-sm text-surface-500 italic">
                        {activeFilter === 'ALL' ? $t('manage_inscriptions.no_inscriptions') : $t('manage_inscriptions.no_inscriptions_for_filter')}
                    </p>
                {:else}
                    <div class="space-y-3">
                        {#each filteredRecords as record (record.id)}
                            <div class="p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg {processingRecordId === record.id ? 'opacity-50' : ''}">
                                <!-- Status badge & date row -->
                                <div class="flex items-center justify-between mb-2">
                                    <span class="badge {getStatusBadgeClasses(record.status)} text-xs flex items-center gap-1">
                                        <Icon icon={getStatusIcon(record.status)} width="0.8rem" height="0.8rem" />
                                        {$t(`manage_inscriptions.status_${record.status.toLowerCase()}`)}
                                    </span>
                                    <span class="text-xs text-surface-500">{formatDate(record.createdAt)}</span>
                                </div>

                                <!-- Participants list (vertical) -->
                                <div class="space-y-2 mb-3">
                                    {#each record.users as user}
                                        <div class="flex items-center gap-2">
                                            <Avatar class="w-8 h-8 shrink-0">
                                                <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                                                <Avatar.Fallback>{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                            </Avatar>
                                            <span class="text-sm font-medium">{user.name}</span>
                                        </div>
                                    {/each}
                                </div>

                                <!-- Actions -->
                                {#if record.status === 'PENDING'}
                                    <div class="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            class="btn-icon btn-icon-sm preset-filled-success-500 rounded-full"
                                            disabled={processingRecordId === record.id}
                                            onclick={() => handleAccept(record.id)}
                                        >
                                            <Icon icon="mdi:check" width="1.2rem" height="1.2rem" />
                                        </button>
                                        <button
                                            type="button"
                                            class="btn-icon btn-icon-sm preset-filled-error-500 rounded-full"
                                            disabled={processingRecordId === record.id}
                                            onclick={() => handleRefuse(record.id)}
                                        >
                                            <Icon icon="mdi:close" width="1.2rem" height="1.2rem" />
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
                </Card>
        {/each}
    </div>

    {#if categoriesWithInscriptions.length === 0}
        <div class="card p-8 text-center">
            <Icon icon="mdi:inbox-outline" class="text-6xl text-surface-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">{$t('manage_inscriptions.no_categories')}</h3>
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
