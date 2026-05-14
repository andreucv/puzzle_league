<script lang="ts">
    import { t } from '$lib/translations';
    import CompetitionList from '$lib/components/competition/CompetitionList.svelte';
    import ButtonLink from '$lib/components/landing_page/ButtonLink.svelte';
    import NearCompetitionsCaroussel from '$lib/components/landing_page/NearCompetitionsCaroussel.svelte';
    import LastResultsList from '$lib/components/landing_page/LastResultsList.svelte';
    import RegistrationStatusCard from '$lib/components/landing_page/RegistrationStatusCard.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { afterNavigate, invalidateAll } from '$app/navigation';
    import CalendarIcon from '@iconify-svelte/mdi/calendar';

    let { data } = $props();
    // Re-fetch data when navigating back to the home page (e.g. after registration)
    afterNavigate(({ from }) => {
        if (from) {
            invalidateAll();
        }
    });
</script>

<svelte:head>
   <title>{$t('head.title')}</title>
    <meta name="description" content="Join speed puzzling competitions worldwide. Track your times, compete with other participants, and participate in competitions. Sign up free today!">
    <meta name="keywords" content="speed puzzling, puzzle competitions, jigsaw puzzle competitions, competitive puzzling, puzzle timer, puzzle league, puzzle community, puzzle championships">

    <!-- Open Graph -->
    <meta property="og:title" content="PuzzLigas - The Premier Speed Puzzling Platform">
    <meta property="og:description" content="Join the fastest-growing speed puzzling community. Compete, track, and improve your puzzle times.">
    <meta property="og:image" content="https://puzzligas.com/og-image.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="https://puzzligas.com">
    <meta property="og:site_name" content="PuzzLigas">

    <!-- Additional SEO -->
    <link rel="canonical" href="https://puzzligas.com">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
</svelte:head>

{#if data.user}
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

        <!-- Upcoming competitions carousel -->
        {#await data.props.nearCompetitions}
            <section>
                <GenericTitle text={$t('competitions.other_upcoming_competitions')} />
                <div class="flex gap-3 overflow-hidden">
                    {#each { length: 2 } as _, index (index)}
                        <div class="h-72 sm:h-80 min-w-[60%] lg:min-w-[32%] rounded-2xl bg-surface-100-700 animate-pulse shrink-0"></div>
                    {/each}
                </div>
            </section>
        {:then nearCompetitions}
            {#if nearCompetitions}
                <section>
                    <GenericTitle text={$t('competitions.other_upcoming_competitions')} />
                    {#if nearCompetitions.length > 0}
                        <NearCompetitionsCaroussel competitions={nearCompetitions} />
                    {:else}
                        <p class="text-surface-500">{$t('landing_page.no_near_competitions')}</p>
                    {/if}
                </section>
            {/if}
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
    </div>
{:else}
    <div class="landing-page-container">
        <div class="landing-page-container-image">
            <enhanced:img src="../../static/landing_page_2.jpg" alt={$t('landing_page.image_alt')} class="cover-image" fetchpriority="high" loading="eager"/>
            <div class="landing-page-container-text-overlay space-y-2" style="bottom: 10%;">
                <div class="p-2 text-center rounded-lg text-white">
                    <p class="h4 font-sans">{$t('landing_page.welcome_text')}</p>
                </div>
                <a href="/login" class="btn preset-filled-primary-500 rounded-4xl w-48 justify-center text-center">{$t('landing_page.sign_in')}</a>
                <a href="/login?action=register" class="btn preset-filled-primary-50-950 rounded-4xl w-48 justify-center text-center">{$t('landing_page.join_now')}</a>
                <br />
                <a href="/competitions/explore_competitions" class="text-white/80 hover:text-white text-sm underline">{$t('landing_page.or_explore')}</a>
            </div>
        </div>
    </div>
    <div class="space-y-4 mt-2 p-4">
        <div class="space-y-4">
            <h2 class="text-center font-sans">{$t('landing_page.who_we_are')}</h2>
            <p class="text-lg text-center px-6 font-sans">{$t('landing_page.participant_welcome_text')}</p>
            <ButtonLink href="/competitions/explore_competitions"
                        title={$t('landing_page.explore_title')}
                        subtitle={$t('landing_page.explore_subtitle')}
                    icon={CalendarIcon}
                    data-testid="explore-competitions-button" />
        </div>
        <section class="pt-12 px-4 bg-surface-100-800-token">
            <div class="container mx-auto">
                <h2 class="font-sans text-center mb-2">{$t('landing_page.why_choose')}</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22A9,9 0 0,0 21,13A9,9 0 0,0 12,4M12.5,8H11V14L15.75,16.85L16.5,15.62L12.5,13.25V8M7.88,3.39L6.6,1.86L2,5.71L3.29,7.24L7.88,3.39M22,5.72L17.4,1.86L16.11,3.39L20.71,7.25L22,5.72Z"/>
                            </svg>
                        </div>
                        <h3 class="h4">{$t('landing_page.features.track_times')}</h3>
                        <p>{$t('landing_page.features.track_times_description')}</p>
                    </div>
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"/>
                            </svg>
                        </div>
                        <h3 class="h4">{$t('landing_page.features.join_community')}</h3>
                        <p>{$t('landing_page.features.join_community_description')}</p>
                    </div>
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
                            </svg>
                        </div>
                        <h3 class="h4">{$t('landing_page.features.get_calendar')}</h3>
                        <p>{$t('landing_page.features.get_calendar_description')}</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
{/if}

<style>

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
        height: 100%;
        width: 100%;
        object-fit: cover;
        object-position: center;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .landing-page-container-image::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 80%);
        pointer-events: none;
    }

    .landing-page-container-text-overlay {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        z-index: 1;
    }

    /* Remove the custom dashboard styles since we're using Skeleton UI classes */
</style>
