<script lang="ts">
    import { t } from '$lib/translations';
    import SearchWebIcon from '@iconify-svelte/mdi/search-web';
    import ClipboardListOutlineIcon from '@iconify-svelte/mdi/clipboard-list-outline';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';

    const steps = [
        {
            number: 1,
            icon: SearchWebIcon,
            title: 'landing_page.how_it_works.step1_title',
            description: 'landing_page.how_it_works.step1_desc',
            detail: 'landing_page.how_it_works.step1_detail'
        },
        {
            number: 2,
            icon: ClipboardListOutlineIcon,
            title: 'landing_page.how_it_works.step2_title',
            description: 'landing_page.how_it_works.step2_desc',
            detail: 'landing_page.how_it_works.step2_detail'
        },
        {
            number: 3,
            icon: TrophyOutlineIcon,
            title: 'landing_page.how_it_works.step3_title',
            description: 'landing_page.how_it_works.step3_desc',
            detail: 'landing_page.how_it_works.step3_detail'
        }
    ];
</script>

<section class="py-10 px-4">
    <div class="container mx-auto max-w-4xl space-y-6">
        <h2 class="text-center font-sans text-2xl font-bold">{$t('landing_page.how_it_works.title')}</h2>
        <div class="grid gap-5 md:grid-cols-3">
            {#each steps as step}
                {@const StepIcon = step.icon}
                <div class="pl-4 flex items-start gap-3 md:block md:text-center md:space-y-3">
                    <div class="flex items-center gap-2 md:justify-center">
                        <div class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                            <StepIcon width="1.25rem" height="1.25rem" class="text-primary-500" />
                        </div>
                    </div>
                    <div class="space-y-1">
                        <h3 class="font-semibold leading-tight">{$t(step.title)}</h3>
                        <p class="text-surface-600-300 text-sm leading-relaxed">{$t(step.description)}</p>
                        <p class="text-surface-500-400 text-xs leading-relaxed">{$t(step.detail)}</p>
                    </div>
                </div>
            {/each}
        </div>
        <div class="text-center">
            <a href="/how-it-works/participant" class="anchor text-sm">
                {$t('how_it_works_guides.cross_link.to_participant_link')} →
            </a>
        </div>
    </div>
</section>
