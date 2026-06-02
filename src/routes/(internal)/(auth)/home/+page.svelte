<script lang="ts">
    import { t } from '$lib/translations';
    import CompetitionList from '$lib/components/competition/CompetitionList.svelte';
    import CompetitionCard from '$lib/components/competition/CompetitionCard.svelte';
    import InfiniteScroll from '$lib/components/common/InfiniteScroll.svelte';
    import LastResultsList from '$lib/components/landing_page/LastResultsList.svelte';
    import RegistrationStatusCard from '$lib/components/landing_page/RegistrationStatusCard.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { afterNavigate, invalidate } from '$app/navigation';

    let { data } = $props();

    // Re-fetch dashboard data when navigating back to the home page (e.g. after registration)
    afterNavigate(({ from }) => {
        if (from) {
            invalidate('data:home-dashboard');
        }
    });

    // Other upcoming competitions infinite feed state
    let otherCompetitions = $state<any[]>([]);
    let otherHasMore = $state(true);
    let otherInitialized = $state(false);
    let otherLoading = $state(false);

    // Initialize from server data (already resolved, no longer a promise)
    $effect(() => {
        if (!otherInitialized && data.props.otherUpcomingCompetitions) {
            const competitions = data.props.otherUpcomingCompetitions;
            otherCompetitions = competitions;
            otherHasMore = competitions.length >= 10;
            otherInitialized = true;
        }
    });

    async function loadMoreOtherCompetitions() {
        if (otherLoading || !otherHasMore) return;
        otherLoading = true;
        try {
            const res = await fetch(`/api/competitions/other-upcoming?offset=${otherCompetitions.length}&limit=10`);
            if (res.ok) {
                const { competitions, hasMore } = await res.json();
                otherCompetitions = [...otherCompetitions, ...competitions];
                otherHasMore = hasMore;
            }
        } finally {
            otherLoading = false;
        }
    }
</script>

<svelte:head>
    <title>{$t('head.title')}</title>
</svelte:head>

<div class="container mx-auto px-4 space-y-6 mb-8">

    <!-- Registration statuses -->
    {#await data.props.registrationStatuses}
        <section>
            <GenericTitle text={$t('landing_page.my_registrations')} />
            <div class="space-y-2">
                {#each { length: 1 } as _, index (index)}
                    <div class="card p-3 placeholder animate-pulse">
                        <div class="h-4 w-3/5 rounded bg-surface-100-700"></div>
                        <div class="mt-2 flex gap-2">
                            <div class="h-3 w-16 rounded-full bg-surface-100-700"></div>
                            <div class="h-3 w-16 rounded-full bg-surface-100-700"></div>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {:then registrationStatuses}
        {#if registrationStatuses && registrationStatuses.length > 0}
            <section>
                <GenericTitle text={$t('landing_page.my_registrations')} />
                <RegistrationStatusCard registrations={registrationStatuses} />
            </section>
        {/if}
    {/await}

    <!-- Live now: competitions that have started -->
    {#await data.props.startedCompetitions}
        <section>
            <GenericTitle text={$t('landing_page.live_now')} />
            <div class="space-y-2">
                {#each { length: 1 } as _, index (index)}
                    <div class="card flex placeholder animate-pulse p-2 gap-3">
                        <div class="w-28 sm:w-36 h-24 rounded-xl bg-surface-100-700 shrink-0"></div>
                        <div class="flex-1 space-y-2 py-1">
                            <div class="h-4 w-4/5 rounded bg-surface-100-700"></div>
                            <div class="h-3 w-2/5 rounded bg-surface-100-700"></div>
                            <div class="flex gap-2 mt-1">
                                <div class="h-3 w-14 rounded-full bg-surface-100-700"></div>
                                <div class="h-3 w-14 rounded-full bg-surface-100-700"></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {:then startedCompetitions}
        {#if startedCompetitions}
            <section>
                <GenericTitle text={$t('landing_page.live_now')} />
                {#if startedCompetitions.length > 0}
                    <CompetitionList competitions={startedCompetitions} n_show={2} currentUsedId={data.user.id} />
                {:else}
                    <p class="text-surface-500">{$t('landing_page.no_live_competitions')}</p>
                {/if}
            </section>
        {/if}
    {/await}

    <!-- Upcoming registered competitions -->
    {#await data.props.upcomingRegisteredCompetitions}
        <section>
            <GenericTitle text={$t('landing_page.your_upcoming_competitions')} />
            <div class="space-y-2">
                {#each { length: 1 } as _, index (index)}
                    <div class="card flex placeholder animate-pulse p-2 gap-3">
                        <div class="w-28 sm:w-36 h-24 rounded-xl bg-surface-100-700 shrink-0"></div>
                        <div class="flex-1 space-y-2 py-1">
                            <div class="h-4 w-4/5 rounded bg-surface-100-700"></div>
                            <div class="h-3 w-2/5 rounded bg-surface-100-700"></div>
                            <div class="flex gap-2 mt-1">
                                <div class="h-3 w-14 rounded-full bg-surface-100-700"></div>
                                <div class="h-3 w-14 rounded-full bg-surface-100-700"></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {:then upcomingRegisteredCompetitions}
        <section>
            {#if upcomingRegisteredCompetitions && upcomingRegisteredCompetitions.length === 0}
                <GenericTitle text={$t('landing_page.no_upcoming_competitions')} />
                <p class="text-surface-500">{$t('landing_page.no_upcoming_competitions_detail')}</p>
            {:else}
                <GenericTitle text={$t('landing_page.your_upcoming_competitions')} />
                <CompetitionList competitions={upcomingRegisteredCompetitions ?? []} n_show={2} currentUsedId={data.user.id} />
            {/if}
        </section>
    {/await}

    <!-- Last results -->
    {#await data.props.lastResults}
        <section>
            <GenericTitle text={$t('landing_page.your_last_results')} />
            <div class="space-y-3">
                {#each { length: 3 } as _, index (index)}
                    <div class="card flex animate-pulse p-3 gap-3">
                        <div class="w-12 h-12 rounded-full bg-surface-100-700 shrink-0"></div>
                        <div class="flex-1 space-y-2 py-1">
                            <div class="h-4 w-3/5 rounded bg-surface-100-700"></div>
                            <div class="h-3 w-2/5 rounded bg-surface-100-700"></div>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {:then lastResults}
        {#if lastResults}
            <section>
                <GenericTitle text={$t('landing_page.your_last_results')} />
                {#if lastResults.length > 0}
                    <LastResultsList results={lastResults} currentUserId={data.user.id} />
                {:else}
                    <p class="text-surface-500">{$t('landing_page.no_last_results')}</p>
                {/if}
            </section>
        {/if}
    {/await}

    <!-- Other upcoming competitions feed -->
    <section data-testid="other-upcoming-section">
        <GenericTitle text={$t('competitions.other_upcoming_competitions')} />
        {#if !otherInitialized}
            <div class="space-y-2">
                {#each { length: 2 } as _, index (index)}
                    <div class="card flex placeholder animate-pulse p-2 gap-3">
                        <div class="w-28 sm:w-36 h-24 rounded-xl bg-surface-100-700 shrink-0"></div>
                        <div class="flex-1 space-y-2 py-1">
                            <div class="h-4 w-4/5 rounded bg-surface-100-700"></div>
                            <div class="h-3 w-2/5 rounded bg-surface-100-700"></div>
                            <div class="flex gap-2 mt-1">
                                <div class="h-3 w-14 rounded-full bg-surface-100-700"></div>
                                <div class="h-3 w-14 rounded-full bg-surface-100-700"></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if otherCompetitions.length === 0}
            <p class="text-surface-500" data-testid="other-upcoming-empty">{$t('landing_page.no_other_upcoming_competitions')}</p>
        {:else}
            <div class="space-y-2" data-testid="other-upcoming-list">
                {#each otherCompetitions as competition (competition.id)}
                    <CompetitionCard {competition} currentUserId={data.user.id} userCountry={data.user.country} userPostalCode={data.user.postalCode} />
                {/each}
            </div>
            <InfiniteScroll hasMore={otherHasMore} on:loadMore={loadMoreOtherCompetitions} />
        {/if}
    </section>
</div>
