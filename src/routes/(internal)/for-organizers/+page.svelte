<script lang="ts">
    import { t } from '$lib/translations';
    import PencilOutlineIcon from '@iconify-svelte/mdi/pencil-outline';
    import FormatListBulletedIcon from '@iconify-svelte/mdi/format-list-bulleted';
    import CurrencyUsdIcon from '@iconify-svelte/mdi/currency-usd';
    import ToggleSwitchOutlineIcon from '@iconify-svelte/mdi/toggle-switch-outline';
    import AccountCheckOutlineIcon from '@iconify-svelte/mdi/account-check-outline';
    import AccountArrowUpOutlineIcon from '@iconify-svelte/mdi/account-arrow-up-outline';
    import TableIcon from '@iconify-svelte/mdi/table';
    import EmailSendOutlineIcon from '@iconify-svelte/mdi/email-send-outline';
    import PlayCircleOutlineIcon from '@iconify-svelte/mdi/play-circle-outline';
    import TimerOutlineIcon from '@iconify-svelte/mdi/timer-outline';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import AccountTieOutlineIcon from '@iconify-svelte/mdi/account-tie-outline';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';
    import EyeOutlineIcon from '@iconify-svelte/mdi/eye-outline';
    import Card from '$lib/components/common/card/Card.svelte';

    const setupFeatures = [
        { icon: PencilOutlineIcon, title: 'for_organizers.setup1_title', desc: 'for_organizers.setup1_desc' },
        { icon: FormatListBulletedIcon, title: 'for_organizers.setup2_title', desc: 'for_organizers.setup2_desc' },
        { icon: CurrencyUsdIcon, title: 'for_organizers.setup3_title', desc: 'for_organizers.setup3_desc' },
        { icon: ToggleSwitchOutlineIcon, title: 'for_organizers.setup4_title', desc: 'for_organizers.setup4_desc' },
    ];

    const registrationFeatures = [
        { icon: AccountCheckOutlineIcon, title: 'for_organizers.reg1_title', desc: 'for_organizers.reg1_desc' },
        { icon: AccountArrowUpOutlineIcon, title: 'for_organizers.reg2_title', desc: 'for_organizers.reg2_desc' },
        { icon: TableIcon, title: 'for_organizers.reg3_title', desc: 'for_organizers.reg3_desc' },
        { icon: EmailSendOutlineIcon, title: 'for_organizers.reg4_title', desc: 'for_organizers.reg4_desc' },
    ];

    const competitionDayFeatures = [
        { icon: PlayCircleOutlineIcon, title: 'for_organizers.day1_title', desc: 'for_organizers.day1_desc' },
        { icon: TimerOutlineIcon, title: 'for_organizers.day2_title', desc: 'for_organizers.day2_desc' },
        { icon: PuzzleOutlineIcon, title: 'for_organizers.day3_title', desc: 'for_organizers.day3_desc' },
        { icon: AccountTieOutlineIcon, title: 'for_organizers.day4_title', desc: 'for_organizers.day4_desc' },
    ];

    const resultsFeatures = [
        { icon: TrophyOutlineIcon, title: 'for_organizers.results1_title', desc: 'for_organizers.results1_desc' },
        { icon: EyeOutlineIcon, title: 'for_organizers.results2_title', desc: 'for_organizers.results2_desc' },
    ];
</script>

<svelte:head>
    <title>{$t('for_organizers.page_title')}</title>
    <meta name="description" content="Create and manage your own speed puzzling competitions on PuzzLigas">
</svelte:head>

<div class="container mx-auto px-4 py-10 max-w-2xl space-y-8 mb-8">

    <!-- Hero intro -->
    <div class="text-center space-y-3">
        <h1 class="h2 font-bold font-sans">{$t('for_organizers.title')}</h1>
        <p class="text-lg text-surface-600-300">{$t('for_organizers.subtitle')}</p>
        <p class="text-sm text-surface-500-400 max-w-xl mx-auto leading-relaxed">{$t('for_organizers.tagline')}</p>
    </div>

    <!-- Set up your competition -->
    <Card>
        <div class="space-y-4">
            <h2 class="font-semibold font-sans flex items-center gap-2">
                <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
                {$t('for_organizers.section_setup')}
            </h2>
            <ul class="space-y-3">
                {#each setupFeatures as feature}
                    {@const FeatureIcon = feature.icon}
                    <li class="flex items-start gap-3">
                        <FeatureIcon width="1.1rem" height="1.1rem" class="text-primary-500 shrink-0 mt-0.5" />
                        <span class="text-sm"><span class="font-medium">{$t(feature.title)}</span> — <span class="text-surface-600-300">{$t(feature.desc)}</span></span>
                    </li>
                {/each}
            </ul>
        </div>
    </Card>

    <!-- Manage registrations -->
    <Card>
        <div class="space-y-4">
            <h2 class="font-semibold font-sans flex items-center gap-2">
                <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
                {$t('for_organizers.section_registration')}
            </h2>
            <ul class="space-y-3">
                {#each registrationFeatures as feature}
                    {@const FeatureIcon = feature.icon}
                    <li class="flex items-start gap-3">
                        <FeatureIcon width="1.1rem" height="1.1rem" class="text-primary-500 shrink-0 mt-0.5" />
                        <span class="text-sm"><span class="font-medium">{$t(feature.title)}</span> — <span class="text-surface-600-300">{$t(feature.desc)}</span></span>
                    </li>
                {/each}
            </ul>
        </div>
    </Card>

    <!-- Competition day -->
    <Card>
        <div class="space-y-4">
            <h2 class="font-semibold font-sans flex items-center gap-2">
                <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
                {$t('for_organizers.section_competition_day')}
            </h2>
            <ul class="space-y-3">
                {#each competitionDayFeatures as feature}
                    {@const FeatureIcon = feature.icon}
                    <li class="flex items-start gap-3">
                        <FeatureIcon width="1.1rem" height="1.1rem" class="text-primary-500 shrink-0 mt-0.5" />
                        <span class="text-sm"><span class="font-medium">{$t(feature.title)}</span> — <span class="text-surface-600-300">{$t(feature.desc)}</span></span>
                    </li>
                {/each}
            </ul>
        </div>
    </Card>

    <!-- Results -->
    <Card>
        <div class="space-y-4">
            <h2 class="font-semibold font-sans flex items-center gap-2">
                <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
                {$t('for_organizers.section_results')}
            </h2>
            <ul class="space-y-3">
                {#each resultsFeatures as feature}
                    {@const FeatureIcon = feature.icon}
                    <li class="flex items-start gap-3">
                        <FeatureIcon width="1.1rem" height="1.1rem" class="text-primary-500 shrink-0 mt-0.5" />
                        <span class="text-sm"><span class="font-medium">{$t(feature.title)}</span> — <span class="text-surface-600-300">{$t(feature.desc)}</span></span>
                    </li>
                {/each}
            </ul>
        </div>
    </Card>

    <!-- CTA -->
    <div class="text-center pt-2">
        <a href="/login?action=register" class="btn preset-filled-primary-500 rounded-4xl px-8 min-h-12 text-base">
            {$t('for_organizers.cta')}
        </a>
        <p class="text-xs text-surface-500 mt-3">{$t('for_organizers.cta_hint')}</p>
    </div>

</div>
