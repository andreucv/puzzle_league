<script lang="ts">
    import { t } from '$lib/translations';
    import Icon from '@iconify/svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import UpcomingCompetitionCard from '$lib/components/UpcomingCompetitionCard.svelte';

    let { data } = $props();

    // Check if user has organizer role
    const hasOrganizerRole = $derived(
        data.roleAssignments?.some((role: any) => role.role === 'ORGANIZER') ?? false
    );

    const hasAdminRole = $derived(
        data.roleAssignments?.some((role: any) => role.role === 'ADMIN') ?? false
    );

    console.log("+page.svelte: data", data);
    console.log("+page.svelte: upcomingRegisteredCompetitions", data.props.upcomingRegisteredCompetitions);
    console.log("+page.svelte: upcomingRegisteredCompetitions.categories", data.props.upcomingRegisteredCompetitions?.at(0)?.categories?.at(0)?.entries.at(0)?.users);
</script>

<svelte:head>
    <title>Puzzle League</title>
</svelte:head>

{#if data.user}
    <h4>Your upcoming competitions</h4>
    <div class="container mx-auto space-y-4">
        <section class="space-y-4">
            {#if data?.props?.upcomingRegisteredCompetitions != null && data?.props?.upcomingRegisteredCompetitions?.length > 0}
                <div class="space-y-2">
                    {#each data?.props?.upcomingRegisteredCompetitions as competition}
                        <UpcomingCompetitionCard {competition} />
                    {/each}
                </div>
            {:else}
                <div class="card">
                    <section class="p-4 text-center">
                        <p class="text-sm">You are not registered to any competition soon</p>
                        <p class="text-sm">Choose a competition to register to</p>
                        <a href="/competitions" class="btn btn-sm preset-filled-primary-500">Browse Competitions</a>
                    </section>
                </div>
            {/if}

            {#if data?.props?.participatedCompetitions != null && data?.props?.participatedCompetitions?.length > 0}
                <h3 class="h3 text-center mb-4">Participated Competitions</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each data?.props?.participatedCompetitions as competition}
                        <div class="card">
                            <header class="card-header">
                                <h3 class="h3">{competition.name}</h3>
                            </header>
                            <section class="p-4">
                                <p class="text-xs opacity-75">Completed</p>
                            </section>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="card">
                    <section class="p-4 text-center">
                        <p class="text-sm">No completed competitions yet</p>
                    </section>
                </div>
            {/if}
        </section>

        {#if hasOrganizerRole}
        <section>
            <h4 class="h4">Organizer Actions</h4>
            <section class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/my_organized_competitions" class="card card-hover">
                        <div class="flex items-center gap-4 p-4">
                            <div class="flex-shrink-0">
                                <Icon icon="mdi:trophy" class="w-8 h-8"></Icon>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold">My Organized Competitions</h3>
                                <p class="text-sm opacity-75">Manage competitions you've created and monitor participants</p>
                            </div>
                        </div>
                    </a>
                    <a href="/create_competition" class="card card-hover">
                        <div class="flex items-center gap-4 p-4">
                            <div class="flex-shrink-0">
                                <Icon icon="mdi:newspaper-plus" class="w-8 h-8"></Icon>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold">Create New Competition</h3>
                                <p class="text-sm opacity-75">Set up a new puzzle competition with custom rules and formats</p>
                            </div>
                        </div>
                    </a>
                </div>
            </section>
        </section>
        {/if}

        {#if hasAdminRole}
        <section>
            <h4 class="h4">Admin Actions</h4>
            <section class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/admin/requests" class="card card-hover">
                        <div class="flex items-center gap-4 p-4">
                            <div class="flex-shrink-0">
                                <Icon icon="mdi:magnify" class="w-8 h-8"></Icon>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold">Review Permissions Requests</h3>
                                <p class="text-sm opacity-75">Review and approve pending permissions requests</p>
                            </div>
                        </div>
                    </a>
                </div>
            </section>
        </section>
        {/if}
    </div>
{:else}
    <div class="landing-page-container">
        <div class="landing-page-container-image">
            <enhanced:img src="../../static/landing_page.jpg" alt="Speed Puzzling Image" class="cover-image"/>
            <div class="landing-page-container-text-overlay" style="bottom: 10%;">
                <h1 class="h1-title card m-4 p-2 text-center">{$t('landing_page.welcome')}</h1>
                <div class="arrows">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                        <path d="M10 15 L20 25 L30 15" stroke="currentColor" stroke-width="3" fill="none"/>
                        <path d="M10 25 L20 35 L30 25" stroke="currentColor" stroke-width="3" fill="none"/>
                    </svg>
                </div>
            </div>
        </div>
        <div class="center-text-inside mt-10">
            <p>{$t('landing_page.welcome_text')}</p>
        </div>
        <div class="center-text-inside mt-10">
            <h2 class="my-2 h2-title">{$t('landing_page.participant_welcome')}</h2>
            <ul>
                <li>{$t('landing_page.participant_welcome_text')}</li>
            </ul>
        </div>
        <div class="center-text-inside mt-10">
            <h2 class="my-2 h2-title">{$t('landing_page.organizer_welcome')}</h2>
            <ul>
                <li>{$t('landing_page.organizer_welcome_text')}</li>
            </ul>
        </div>
    </div>
{/if}

<style>
    .arrows {
        animation: bounce 2s infinite;
    }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(10px); }
    }

    .landing-page-container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .landing-page-container-image {
        display: flex;
        height: 32vh;
        overflow: hidden;
        flex-direction: column;
        position: relative;
    }

    .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .landing-page-container-text-overlay {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
    }

    .center-text-inside {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding-inline: 3rem;
        text-align: center;
    }

    .h1-title {
        font-size: 2rem;
        font-weight: 800;
    }

    .h2-title {
        font-size: 1.5rem;
        font-weight: 800;
    }

    /* Remove the custom dashboard styles since we're using Skeleton UI classes */
</style>
