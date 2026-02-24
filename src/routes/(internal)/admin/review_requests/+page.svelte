<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';

    export let data;

    let filter = '';
    $: filteredRequests = data.pendingRequests.filter(request =>
        request.user.name.toLowerCase().includes(filter.toLowerCase()) ||
        request.user.email.toLowerCase().includes(filter.toLowerCase()) ||
        request.role.toLowerCase().includes(filter.toLowerCase()) ||
        (request.reason && request.reason.toLowerCase().includes(filter.toLowerCase()))
    );

    $: filteredCount = filteredRequests.length;
    $: totalCount = data.pendingRequests.length;

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString();
    };
    const formatRole = (role: string) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
</script>

<svelte:head>
    <title>Review Requests - Puzzle League</title>
</svelte:head>

<GenericTitle text={$t('admin.review_requests.title')} />
<div class="container mx-auto">

    <div class="mb-6">
        <SearchInput placeholder={$t('admin.review_requests.search_placeholder')} bind:filter />
    </div>

    <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">Pending Requests</h2>
        {#if filter !== ''}
            <span class="text-sm text-surface-500">{filteredCount} / {totalCount} requests</span>
        {:else}
            <span class="text-sm text-surface-500">{totalCount} requests</span>
        {/if}
    </div>

    {#if filteredRequests.length === 0}
        <div class="card p-8 text-center">
            <Icon icon="mdi:inbox-outline" class="text-6xl text-surface-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">No Requests Found</h3>
            <p class="text-surface-500">
                {#if filter !== ''}
                    No requests match your search criteria.
                {:else}
                    There are no pending permission requests at this time.
                {/if}
            </p>
        </div>
    {:else}
        <div class="space-y-4">
            {#each filteredRequests as request}
                <div class="card p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-4">
                            {#if request.user.image}
                                <img
                                    src={request.user.image}
                                    alt={request.user.name}
                                    class="w-12 h-12 rounded-full"
                                />
                            {:else}
                                <div class="w-12 h-12 rounded-full bg-surface-300 flex items-center justify-center">
                                    <Icon icon="mdi:account" class="text-xl text-surface-600" />
                                </div>
                            {/if}
                            <div>
                                <h3 class="text-lg font-semibold">{request.user.name}</h3>
                                <p class="text-surface-600">{request.user.email}</p>
                            </div>
                        </div>
                        <span class="badge preset-tonal-primary">
                            {formatRole(request.role)}
                        </span>
                    </div>

                    <div class="mb-4 space-y-2">
                        <div class="flex items-center gap-2 text-sm text-surface-600">
                            <Icon icon="mdi:calendar" />
                            <span>Requested on {formatDate(request.createdAt)}</span>
                        </div>

                        {#if request.competition}
                            <div class="flex items-center gap-2 text-sm text-surface-600">
                                <Icon icon="mdi:trophy" />
                                <span>Competition: {request.competition.name}</span>
                            </div>
                        {/if}
                    </div>

                    {#if request.reason}
                        <div class="mb-4 flex">
                            <h4 class="text-sm font-semibold text-surface-700 mb-1 pr-2">Reason:</h4>
                            <p class="text-sm text-surface-600">
                                {request.reason}
                            </p>
                        </div>
                    {/if}

                    {#if request.additionalInfo}
                        <div class="mb-4">
                            <h4 class="text-sm font-semibold text-surface-700 mb-1">Additional Information:</h4>
                            <p class="text-sm text-surface-600 bg-surface-100 p-3 rounded">
                                {request.additionalInfo}
                            </p>
                        </div>
                    {/if}

                    <div class="flex gap-3 mt-6">
                        <form method="POST" action="?/accept" use:enhance>
                            <input type="hidden" name="requestId" value={request.id} />
                            <button
                                type="submit"
                                class="btn preset-filled-success-500 flex items-center gap-2"
                            >
                                <Icon icon="mdi:check" />
                                Accept
                            </button>
                        </form>

                        <form method="POST" action="?/reject" use:enhance>
                            <input type="hidden" name="requestId" value={request.id} />
                            <button
                                type="submit"
                                class="btn preset-filled-error-500 flex items-center gap-2"
                            >
                                <Icon icon="mdi:close" />
                                Reject
                            </button>
                        </form>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .input-full-width {
        width: 100%;
        border: none;
        background-color: transparent;
    }

    .input-full-width:focus {
        outline: none;
    }
</style>
