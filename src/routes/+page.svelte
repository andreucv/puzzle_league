<script lang="ts">
    import { t } from '$lib/translations';
    import NearCompetitionsCaroussel from '$lib/components/landing_page/NearCompetitionsCaroussel.svelte';
    import ProofStrip from '$lib/components/landing_page/ProofStrip.svelte';
    import HowItWorks from '$lib/components/landing_page/HowItWorks.svelte';
    import OrganizerCTA from '$lib/components/landing_page/OrganizerCTA.svelte';

    let { data } = $props();
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

<!-- Hero -->
<div class="landing-hero">
    <enhanced:img src="../../static/landing_page_2.jpg" alt={$t('landing_page.image_alt')} class="hero-image" fetchpriority="high" loading="eager"/>
    <div class="hero-overlay">
        <div class="hero-content space-y-3">
            <h1 class="font-sans text-3xl sm:text-4xl font-bold leading-tight text-white text-center drop-shadow-lg max-w-2xl">
                {$t('landing_page.value_prop')}
            </h1>
            <p class="text-sm text-white/90 text-center max-w-xl drop-shadow-md">
                {$t('landing_page.participant_welcome_text')}
            </p>
            <a
                href="/competitions/explore_competitions"
                class="btn preset-filled-primary-500 rounded-4xl w-full max-w-50 justify-center text-center text-sm min-h-10"
                data-testid="explore-competitions-button"
            >
                {$t('landing_page.explore_competitions_cta')}
            </a>
            <div class="flex gap-2 justify-center flex-wrap">
                <a href="/login" class="btn preset-outlined rounded-4xl px-5 text-sm text-white border-white/50 hover:border-white min-h-9">
                    {$t('landing_page.sign_in')}
                </a>
                <a href="/login?action=register" class="btn preset-outlined rounded-4xl px-5 text-sm text-white border-white/50 hover:border-white min-h-9">
                    {$t('landing_page.join_now')}
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Proof strip -->
<ProofStrip stats={data.landingStats} />

<!-- Featured competitions -->
{#if data.featuredCompetitions && data.featuredCompetitions.length > 0}
    <section class="py-8 md:py-10 px-4">
        <div class="container mx-auto space-y-4">
            <h2 class="font-sans text-xl font-bold text-center">{$t('landing_page.featured_competitions')}</h2>
            <NearCompetitionsCaroussel competitions={data.featuredCompetitions} />
        </div>
    </section>
{/if}

<!-- How it works -->
<HowItWorks />

<!-- Organizer CTA -->
<OrganizerCTA />

<style>
    .landing-hero {
        position: relative;
        width: 100%;
        height: clamp(300px, 42vh, 460px);
        overflow: hidden;
    }

    .hero-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 45%;
    }

    .landing-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.82) 100%);
        pointer-events: none;
    }

    .hero-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem 1rem;
        z-index: 1;
    }

    .hero-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding: 1.5rem 1.25rem;
        border-radius: 1rem;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        max-width: 36rem;
    }
</style>
