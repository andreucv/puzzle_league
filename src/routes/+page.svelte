<script lang="ts">
    import { t } from '$lib/translations';
    import Icon from '@iconify/svelte';
    import CompetitionList from '$lib/components/competition/CompetitionList.svelte';
    import ButtonLink from '$lib/components/landing_page/ButtonLink.svelte';

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
    console.log("+page.svelte: upcomingRegisteredCompetitions.categories", data.props.upcomingRegisteredCompetitions?.at(0)?.categories?.at(0)?.records.at(0)?.users);
</script>

<svelte:head>
   <title>$t('head.title')</title>
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
    <div class="container mx-auto px-4 space-y-4">
        <section>
            {#if data.props.upcomingRegisteredCompetitions && data.props.upcomingRegisteredCompetitions.length === 0}
                <h4 class="font-sans mb-2 h4">{$t('landing_page.no_upcoming_competitions')}</h4>
                <p class="mb-2">{$t('landing_page.no_upcoming_competitions_detail')}</p>
                <ButtonLink href="/competitions/calendar/list"
                            title={$t('landing_page.explore_title')}
                            subtitle={$t('landing_page.explore_subtitle')}
                            icon="mdi:calendar" />
            {:else}
                <h4 class="font-sans mb-2 h4">{$t('landing_page.your_upcoming_competitions')}</h4>
                <CompetitionList competitions={data.props.upcomingRegisteredCompetitions} n_show=2 currentUsedId={data.user.id} />
            {/if}
        </section>
    </div>
{:else}
    <div class="landing-page-container">
        <div class="landing-page-container-image">
            <enhanced:img src="../../static/landing_page_2.jpg" alt={$t('landing_page.image_alt')} class="cover-image"/>
            <div class="landing-page-container-text-overlay space-y-2" style="bottom: 10%;">
                <div class="p-2 text-center rounded-lg text-white">
                    <p class="h4 font-sans">{$t('landing_page.welcome_text')}</p>
                </div>
                <!-- <button class="btn preset-outlined-primary-50-950 text-white border-white">{$t('landing_page.sign_in')}</button> -->
                <p class="text-white">{$t('landing_page.get_started')}</p>
                <div class="w-8 h-8">
                    <Icon icon="mdi:arrow-down" class="w-8 h-8 text-white"></Icon>
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
                        icon="mdi:calendar" />
        </div>
        <section class="pt-12 px-4 bg-surface-100-800-token">
            <div class="container mx-auto">
                <h2 class="font-sans text-center mb-2">{$t('landing_page.why_choose')}</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 mx-auto"><Icon icon="mdi:timer" class="w-12 h-12"/></div>
                        <h3 class="h4">{$t('landing_page.features.track_times')}</h3>
                        <p>{$t('landing_page.features.track_times_description')}</p>
                    </div>
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 mx-auto"><Icon icon="mdi:account-group" class="w-12 h-12"/></div>
                        <h3 class="h4">{$t('landing_page.features.join_community')}</h3>
                        <p>{$t('landing_page.features.join_community_description')}</p>
                    </div>
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 mx-auto"><Icon icon="mdi:calendar" class="w-12 h-12"/></div>
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
