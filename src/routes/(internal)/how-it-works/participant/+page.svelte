<script lang="ts">
    import { t } from '$lib/translations';
    import GuideStep from '$lib/components/guide/GuideStep.svelte';
    import ComponentDemo from '$lib/components/guide/ComponentDemo.svelte';
    import FaqAccordion from '$lib/components/guide/FaqAccordion.svelte';
    import GuideAccountCta from '$lib/components/guide/GuideAccountCta.svelte';
    import CompetitionStatusChip from '$lib/components/competition/CompetitionStatusChip.svelte';
    import CategoryRegistrationChip from '$lib/components/category/CategoryRegistrationChip.svelte';
    import EntryRegistrationStatusBadge from '$lib/components/registration/EntryRegistrationStatusBadge.svelte';

    const faqItems = [
        { q: 'how_it_works_guides.participant.faq.q1', a: 'how_it_works_guides.participant.faq.a1' },
        { q: 'how_it_works_guides.participant.faq.q2', a: 'how_it_works_guides.participant.faq.a2' },
        { q: 'how_it_works_guides.participant.faq.q3', a: 'how_it_works_guides.participant.faq.a3' },
        { q: 'how_it_works_guides.participant.faq.q4', a: 'how_it_works_guides.participant.faq.a4' },
        { q: 'how_it_works_guides.participant.faq.q5', a: 'how_it_works_guides.participant.faq.a5' },
    ];
</script>

<svelte:head>
    <title>{$t('how_it_works_guides.participant.page_title')}</title>
    <meta name="description" content="A step-by-step guide to taking part in speed puzzling competitions on PuzzLigas" />
</svelte:head>

<!-- Hero -->
<div class="text-center space-y-3">
    <h1 class="h2 font-bold font-sans">{$t('how_it_works_guides.participant.title')}</h1>
    <p class="text-lg text-surface-600-300">{$t('how_it_works_guides.participant.subtitle')}</p>
</div>

<!-- Account CTA banner -->
<GuideAccountCta />

<!-- Steps -->
<GuideStep number={1} title={$t('how_it_works_guides.participant.step1_title')}>
    <p>{$t('how_it_works_guides.participant.step1_body')}</p>
    <ComponentDemo caption={$t('how_it_works_guides.participant.demo_browse_caption')}>
        <CompetitionStatusChip competition_status="NOT_STARTED" />
        <CompetitionStatusChip competition_status="STARTED" />
        <CompetitionStatusChip competition_status="FINISHED" />
    </ComponentDemo>
    <ComponentDemo caption={$t('how_it_works_guides.participant.demo_browse_category_caption')}>
        <CategoryRegistrationChip categoryType="INDIVIDUAL" />
    </ComponentDemo>
    <a href="/competitions/explore_competitions" class="anchor text-sm">{$t('how_it_works_guides.participant.step1_link')} →</a>
</GuideStep>

<GuideStep number={2} title={$t('how_it_works_guides.participant.step2_title')}>
    <p>{$t('how_it_works_guides.participant.step2_body')}</p>
    <ComponentDemo caption={$t('how_it_works_guides.participant.demo_register_caption')}>
        <CategoryRegistrationChip categoryType="INDIVIDUAL" />
        <CategoryRegistrationChip categoryType="PAIRS" />
        <CategoryRegistrationChip categoryType="TEAM" />
        <CategoryRegistrationChip categoryType="JUNIOR_INDIVIDUAL" />
    </ComponentDemo>
</GuideStep>

<GuideStep number={3} title={$t('how_it_works_guides.participant.step3_title')}>
    <p>{$t('how_it_works_guides.participant.step3_body')}</p>
    <ComponentDemo caption={$t('how_it_works_guides.participant.demo_status_caption')}>
        <EntryRegistrationStatusBadge status="PENDING_CONFIRMATION" />
        <EntryRegistrationStatusBadge status="CONFIRMED" />
        <EntryRegistrationStatusBadge status="WAITLISTED" />
    </ComponentDemo>
    <ul class="space-y-2 list-none">
        <li>{$t('how_it_works_guides.participant.status_pending_desc')}</li>
        <li>{$t('how_it_works_guides.participant.status_confirmed_desc')}</li>
        <li>{$t('how_it_works_guides.participant.status_waitlisted_desc')}</li>
    </ul>
</GuideStep>

<GuideStep number={4} title={$t('how_it_works_guides.participant.step4_title')}>
    <p>{$t('how_it_works_guides.participant.step4_body')}</p>
</GuideStep>

<GuideStep number={5} title={$t('how_it_works_guides.participant.step5_title')}>
    <p>{$t('how_it_works_guides.participant.step5_body')}</p>
</GuideStep>

<!-- FAQ -->
<div class="space-y-4">
    <h2 class="font-semibold font-sans flex items-center gap-2">
        <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
        {$t('how_it_works_guides.faq_title')}
    </h2>
    <FaqAccordion items={faqItems} />
</div>
