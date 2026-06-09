<script lang="ts">
    import { t } from '$lib/translations';
    import GuideStep from '$lib/components/guide/GuideStep.svelte';
    import ComponentDemo from '$lib/components/guide/ComponentDemo.svelte';
    import FaqAccordion from '$lib/components/guide/FaqAccordion.svelte';
    import GuideAccountCta from '$lib/components/guide/GuideAccountCta.svelte';
    import CategoryStatusChip from '$lib/components/category/CategoryStatusChip.svelte';
    import EntryRegistrationStatusBadge from '$lib/components/registration/EntryRegistrationStatusBadge.svelte';

    const faqItems = [
        { q: 'how_it_works_guides.organizer.faq.q1', a: 'how_it_works_guides.organizer.faq.a1' },
        { q: 'how_it_works_guides.organizer.faq.q2', a: 'how_it_works_guides.organizer.faq.a2' },
        { q: 'how_it_works_guides.organizer.faq.q3', a: 'how_it_works_guides.organizer.faq.a3' },
    ];
</script>

<svelte:head>
    <title>{$t('how_it_works_guides.organizer.page_title')}</title>
    <meta name="description" content="A step-by-step guide to creating and running speed puzzling competitions on PuzzLigas" />
</svelte:head>

<!-- Hero -->
<div class="text-center space-y-3">
    <h1 class="h2 font-bold font-sans">{$t('how_it_works_guides.organizer.title')}</h1>
    <p class="text-lg text-surface-600-300">{$t('how_it_works_guides.organizer.subtitle')}</p>
</div>

<!-- Account CTA banner -->
<GuideAccountCta variant="organizer" />

<!-- Main spine -->
<GuideStep number={1} title={$t('how_it_works_guides.organizer.step1_title')}>
    <p>{$t('how_it_works_guides.organizer.step1_body')}</p>
    <a href="/request_permissions" class="anchor text-sm">{$t('how_it_works_guides.organizer.step1_link')} →</a>
</GuideStep>

<GuideStep number={2} title={$t('how_it_works_guides.organizer.step2_title')}>
    <p>{$t('how_it_works_guides.organizer.step2_body')}</p>
</GuideStep>

<GuideStep number={3} title={$t('how_it_works_guides.organizer.step3_title')}>
    <p>{$t('how_it_works_guides.organizer.step3_body')}</p>
</GuideStep>

<GuideStep number={4} title={$t('how_it_works_guides.organizer.step4_title')}>
    <p>{$t('how_it_works_guides.organizer.step4_body')}</p>
</GuideStep>

<GuideStep number={5} title={$t('how_it_works_guides.organizer.step5_title')}>
    <p>{$t('how_it_works_guides.organizer.step5_body')}</p>
    <ComponentDemo caption={$t('how_it_works_guides.organizer.demo_entries_caption')}>
        <EntryRegistrationStatusBadge status="CONFIRMED" />
        <EntryRegistrationStatusBadge status="PENDING_CONFIRMATION" />
        <EntryRegistrationStatusBadge status="WAITLISTED" />
    </ComponentDemo>
</GuideStep>

<GuideStep number={6} title={$t('how_it_works_guides.organizer.step6_title')}>
    <p>{$t('how_it_works_guides.organizer.step6_body')}</p>
    <p class="font-medium text-surface-700-200">{$t('how_it_works_guides.organizer.lifecycle')}</p>
    <ComponentDemo caption={$t('how_it_works_guides.organizer.demo_day_caption')}>
        <CategoryStatusChip category_status="NOT_STARTED" />
        <CategoryStatusChip category_status="LIVE" />
        <CategoryStatusChip category_status="STOPPED" />
        <CategoryStatusChip category_status="COMPLETE" />
    </ComponentDemo>
</GuideStep>

<GuideStep number={7} title={$t('how_it_works_guides.organizer.step7_title')}>
    <p>{$t('how_it_works_guides.organizer.step7_body')}</p>
</GuideStep>

<!-- Working with judges -->
<div class="space-y-4">
    <div class="space-y-2 pt-2">
        <h2 class="font-semibold font-sans flex items-center gap-2">
            <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
            {$t('how_it_works_guides.judges.section_title')}
        </h2>
        <p class="text-surface-600-300">{$t('how_it_works_guides.judges.intro')}</p>
    </div>
    <GuideStep number={1} level={3} title={$t('how_it_works_guides.judges.assign_title')}>
        <p>{$t('how_it_works_guides.judges.assign_body')}</p>
    </GuideStep>
    <GuideStep number={2} level={3} title={$t('how_it_works_guides.judges.dayof_title')}>
        <p>{$t('how_it_works_guides.judges.dayof_body')}</p>
    </GuideStep>
</div>

<!-- FAQ -->
<div class="space-y-4">
    <h2 class="font-semibold font-sans flex items-center gap-2">
        <span class="w-1 h-5 rounded-full bg-primary-500 inline-block"></span>
        {$t('how_it_works_guides.faq_title')}
    </h2>
    <FaqAccordion items={faqItems} />
</div>
