<script lang="ts">
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import AlertCircleIcon from '@iconify-svelte/mdi/alert-circle';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import SeatOutlineIcon from '@iconify-svelte/mdi/seat-outline';
    import InboxOutlineIcon from '@iconify-svelte/mdi/inbox-outline';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import ManageRegistrationStatus from '$lib/components/ManageRegistrationStatus.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import InscriptionList from '$lib/components/manage_inscriptions/InscriptionList.svelte';

    let { data } = $props();

    let competition = $derived(data.competition);
    let categoriesWithInscriptions = $derived(data.categoriesWithInscriptions || []);
    let registrationOpen = $state(data.competition.registrationOpen);
    let searchFilter = $state('');

    // Loading state for individual actions
    let processingRecordId: string | null = $state(null);
    let publishingCategoryId: number | null = $state(null);
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

    async function handleConfirm(recordId: string) {
        processingRecordId = recordId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
        try {
            const response = await fetch(`/api/inscriptions/${recordId}/confirm`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_inscriptions.confirmed_success') });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_inscriptions.confirm_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_inscriptions.confirm_error') });
        } finally {
            processingRecordId = null;
        }
    }

    async function handleRefuse(recordId: string) {
        processingRecordId = recordId;
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
                showResultMessage({ success: true, message: $t('manage_inscriptions.publish_tables_success', { count: result.assignedCount }) });
                await invalidateAll();
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_inscriptions.publish_tables_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_inscriptions.publish_tables_error') });
        } finally {
            publishingCategoryId = null;
        }
    }
</script>

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <div class="space-y-4">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('manage_inscriptions.title')} subtitle={competition.name}/>
    </div>

    <!-- Manage Registration Status -->
    <div>
        <ManageRegistrationStatus competition_id={competition.id} competition_registration_status={registrationOpen} hasCategories={categoriesWithInscriptions.length > 0} onStatusChange={(status) => registrationOpen = status} />
    </div>

    <!-- User Search -->
    <SearchInput bind:filter={searchFilter} placeholder={$t('manage_inscriptions.search_placeholder')} />

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

    <!-- Categories with inscriptions -->
    <div class="space-y-6">
        {#each categoriesWithInscriptions as category (category.id)}
            <Card>
                <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <CategoryCardTitle type={category.type} subname={category.subname ?? ''}/>
                    {#if category.maxParties}
                        {@const remaining = category.maxParties - category.records.filter((r: any) => r.status === 'CONFIRMED').length}
                        <span class="text-sm {remaining > 0 ? 'text-surface-600 dark:text-surface-400' : 'text-error-600 dark:text-error-400'}">
                            <SeatOutlineIcon width="1rem" height="1rem" class="inline-block align-text-bottom mr-1" />
                            {remaining} {$t('manage_inscriptions.seats_remaining')}
                        </span>
                    {/if}
                </div>

                <InscriptionList
                    records={category.records}
                    {processingRecordId}
                    {searchFilter}
                    publishingTables={publishingCategoryId === category.id}
                    onConfirm={handleConfirm}
                    onRefuse={handleRefuse}
                    onPublishTables={() => handlePublishTables(category.id)}
                />
            </Card>
        {/each}
    </div>

    {#if categoriesWithInscriptions.length === 0}
        <div class="card p-8 text-center">
            <InboxOutlineIcon class="text-6xl text-surface-400 mx-auto mb-4" />
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
