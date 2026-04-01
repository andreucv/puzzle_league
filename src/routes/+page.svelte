<script lang="ts">
    import { t } from '$lib/translations';
    import CompetitionList from '$lib/components/competition/CompetitionList.svelte';
    import ButtonLink from '$lib/components/landing_page/ButtonLink.svelte';
    import NearCompetitionsCaroussel from '$lib/components/landing_page/NearCompetitionsCaroussel.svelte';
    import LastResultsList from '$lib/components/landing_page/LastResultsList.svelte';
    import InscriptionStatusCard from '$lib/components/landing_page/InscriptionStatusCard.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { afterNavigate, invalidateAll } from '$app/navigation';
    import CalendarIcon from '@iconify-svelte/mdi/calendar';

    let { data } = $props();
    console.log('routes/+page.svelte data: ', data);
    // Re-fetch data when navigating back to the home page (e.g. after inscription)
    afterNavigate(({ from }) => {
        if (from) {
            invalidateAll();
        }
    });

    // Lazy-load below-fold features section
    let featuresVisible = $state(false);
    let featuresRef: HTMLElement | undefined = $state();

    $effect(() => {
        if (!featuresRef) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    featuresVisible = true;
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(featuresRef);
        return () => observer.disconnect();
    });
</script>

<svelte:head>
   <title>{$t('head.title')}</title>
    <meta name="description" content="Join speed puzzling competitions worldwide. Track your times, compete with other puzzlers, and participate in events. Sign up free today!">
    <meta name="keywords" content="speed puzzling, puzzle competitions, jigsaw puzzle tournaments, competitive puzzling, puzzle timer, puzzle league, puzzle events, puzzle community, puzzle championships">

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

        <!-- Inscription statuses -->
        {#if data.props.inscriptionStatuses && data.props.inscriptionStatuses.length > 0}
            <section>
                <GenericTitle text={$t('landing_page.my_inscriptions')} />
                <InscriptionStatusCard inscriptions={data.props.inscriptionStatuses} />
            </section>
        {/if}

        <!-- Live now: competitions that have started -->
        {#if data.props.startedCompetitions && data.props.startedCompetitions.length > 0}
            <section>
                <GenericTitle text={$t('landing_page.live_now')} />
                <CompetitionList competitions={data.props.startedCompetitions ?? []} n_show={2} currentUsedId={data.user.id} />
            </section>
        {/if}

        <!-- Upcoming registered competitions -->
        <section>
            {#if data.props.upcomingRegisteredCompetitions && data.props.upcomingRegisteredCompetitions.length === 0}
                <GenericTitle text={$t('landing_page.no_upcoming_competitions')} />
                <p class="mb-2">{$t('landing_page.no_upcoming_competitions_detail')}</p>
            {:else}
                <GenericTitle text={$t('landing_page.your_upcoming_competitions')} />
                <CompetitionList competitions={data.props.upcomingRegisteredCompetitions ?? []} n_show={2} currentUsedId={data.user.id} />
            {/if}
        </section>

        <!-- Upcoming competitions carousel -->
        {#if data.props.nearCompetitions && data.props.nearCompetitions.length > 0}
            <section>
                <GenericTitle text={$t('competitions.other_upcoming_competitions')} />
                <NearCompetitionsCaroussel competitions={data.props.nearCompetitions} />
            </section>
        {/if}

        <!-- Last results -->
        {#if data.props.lastResults && data.props.lastResults.length > 0}
            <section>
                <GenericTitle text={$t('landing_page.your_last_results')} />
                <LastResultsList results={data.props.lastResults} currentUserId={data.user.id} />
            </section>
        {/if}
    </div>
{:else}
    <div class="landing-page-container">
        <div class="landing-page-container-image">
            <enhanced:img src="../../static/landing_page_2.jpg" alt={$t('landing_page.image_alt')} class="cover-image" fetchpriority="high" loading="eager"/>
            <div class="landing-page-container-text-overlay space-y-2" style="bottom: 10%;">
                <div class="p-2 text-center rounded-lg text-white">
                    <p class="h4 font-sans">{$t('landing_page.welcome_text')}</p>
                </div>
                <!-- <button class="btn preset-outlined-primary-50-950 text-white border-white">{$t('landing_page.sign_in')}</button> -->
                <p class="text-white">{$t('landing_page.get_started')}</p>
                <div class="w-8 h-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z"/>
                    </svg>
                </div>
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
        <section class="pt-12 px-4 bg-surface-100-800-token" bind:this={featuresRef}>
            <div class="container mx-auto">
                <h2 class="font-sans text-center mb-2">{$t('landing_page.why_choose')}</h2>
                {#if featuresVisible}
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
                {/if}
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
