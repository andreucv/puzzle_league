<script lang="ts">
    import { page } from '$app/state';
    import { t } from '$lib/translations';
    import ArrowRightIcon from '@iconify-svelte/mdi/arrow-right';

    let { children } = $props();

    // The two guides are siblings, not tabs: only a single end-of-page cross-link,
    // pointing at whichever guide the reader isn't currently on.
    const onParticipant = $derived(page.url.pathname.includes('/how-it-works/participant'));
    const crossHref = $derived(onParticipant ? '/how-it-works/organizer' : '/how-it-works/participant');
    const crossText = $derived(
        onParticipant ? $t('how_it_works_guides.cross_link.to_organizer_text') : $t('how_it_works_guides.cross_link.to_participant_text')
    );
    const crossLink = $derived(
        onParticipant ? $t('how_it_works_guides.cross_link.to_organizer_link') : $t('how_it_works_guides.cross_link.to_participant_link')
    );

    // Primary action that converts the reader at the end of the guide they just read.
    const endCtaHref = $derived(onParticipant ? '/competitions/explore_competitions' : '/request_permissions');
    const endCtaLabel = $derived(
        onParticipant ? $t('how_it_works_guides.end_cta.participant') : $t('how_it_works_guides.end_cta.organizer')
    );
</script>

<div class="container mx-auto px-4 py-10 max-w-2xl space-y-8 mb-8">
    {@render children()}

    <!-- End-of-guide primary CTA -->
    <a href={endCtaHref} class="btn preset-filled-primary-500 rounded-4xl w-full justify-center gap-2">
        {endCtaLabel}
        <ArrowRightIcon width="1.2rem" height="1.2rem" class="shrink-0" />
    </a>

    <!-- Cross-link to the sibling guide -->
    <a
        href={crossHref}
        class="card preset-tonal flex items-center justify-between gap-3 p-4 hover:preset-tonal-primary transition-colors"
    >
        <span class="text-sm">
            <span class="text-surface-600-300">{crossText}</span>
            <span class="font-medium">{crossLink}</span>
        </span>
        <ArrowRightIcon width="1.2rem" height="1.2rem" class="text-primary-500 shrink-0" />
    </a>
</div>
