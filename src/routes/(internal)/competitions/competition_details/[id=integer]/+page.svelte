<script lang="ts">
    import { getCountryFlag, getCountryNameFromCode } from '$lib/utils/country_utils';
    import { locale } from '$lib/translations';
    import CategoriesOverview from '$lib/components/competition/CategoriesOverview.svelte';
    import { Avatar, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

    import { CldImage } from 'svelte-cloudinary';
    import { t } from '$lib/translations';
    import RegistrationActionButton from '$lib/components/registration/RegistrationActionButton.svelte';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import OverflowMenu from '$lib/components/during-competition/OverflowMenu.svelte';
    import type { OverflowAction } from '$lib/components/during-competition/types';
    import { goto } from '$app/navigation';

    import MapMarkerIcon from '@iconify-svelte/mdi/map-marker';
    import EarthIcon from '@iconify-svelte/mdi/earth';
    import CalendarClockIcon from '@iconify-svelte/mdi/calendar-clock';
    import CreditCardOutlineIcon from '@iconify-svelte/mdi/credit-card-outline';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import TimerPlayIcon from '@iconify-svelte/mdi/timer-play';
    import PencilIcon from '@iconify-svelte/mdi/pencil';
    import ClipboardCheckOutlineIcon from '@iconify-svelte/mdi/clipboard-check-outline';
    import ArrowLeftIcon from '@iconify-svelte/mdi/arrow-left';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import CompetitionStatusChip from '$lib/components/common/status/CompetitionStatusChip.svelte';

    let { data } = $props();

    const currentUser = $derived(data.user);

    let showImageDialog = $state(false);

    function buildManageActions(competitionId: number, access: { canManageCompetition: boolean; isJudge: boolean }, competitionStatus: string): OverflowAction[] {
        const actions: OverflowAction[] = [];
        const canAccessDuringCompetition = access.canManageCompetition || access.isJudge;
        const isOrganizer = access.canManageCompetition;
        const canCancel = isOrganizer && competitionStatus !== 'CANCELLED' && competitionStatus !== 'FINISHED';

        if (canAccessDuringCompetition) {
            actions.push({ kind: 'link', icon: TimerPlayIcon, label: $t('during_competition.title'), href: `/competition/${competitionId}/during_competition`, testId: 'run-competition-link' });
        }
        if (isOrganizer) {
            actions.push({ kind: 'link', icon: PencilIcon, label: $t('competition_details.edit_button'), href: `/competition/edit/${competitionId}`, testId: 'edit-competition-link' });
            actions.push({ kind: 'link', icon: ClipboardCheckOutlineIcon, label: $t('manage_registrations.title'), href: `/competition/${competitionId}/manage_registrations`, testId: 'manage-registrations-button' });
        }
        if (canCancel) {
            actions.push({
                kind: 'confirm',
                icon: CancelIcon,
                label: $t('during_competition.cancel_competition'),
                colorClass: 'preset-filled-error-500',
                confirmTitle: $t('during_competition.cancel_competition_confirm_title'),
                confirmMessage: $t('during_competition.cancel_competition_confirm_message'),
                onConfirm: async () => {
                    const res = await fetch(`/api/competitions/${competitionId}/cancel`, { method: 'POST' });
                    if (res.ok) {
                        goto(`/competitions/competition_details/${competitionId}`, { invalidateAll: true });
                    }
                },
                testId: 'cancel-competition-button'
            });
        }
        return actions;
    }

    // Registration is possible when at least one not-yet-started category still has room
    // (or has no capacity limit). Mirrors the seat math in CategoriesOverview.
    type CategoryCounts = { status: string; maxParties: number | null; reservedSlots?: number; totalEntries?: number };
    function hasRegistrableSpot(categories: CategoryCounts[] | undefined): boolean {
        if (!categories) return false;
        return categories.some((c) => {
            if (c.status !== 'NOT_STARTED') return false;
            if (c.maxParties == null) return true;
            const registered = c.reservedSlots ?? c.totalEntries ?? 0;
            return c.maxParties - registered > 0;
        });
    }
</script>

<div class="container mx-auto">
    {#await data.props.competition_and_categories}
        <!-- Full-page skeleton placeholder -->
        <div class="space-y-3">
            <div class="space-y-4 mb-6 animate-pulse">
                <div class="card h-8 w-3/5 rounded bg-surface-100-700"></div>
                <div class="card h-4 w-4/5 rounded bg-surface-100-700"></div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="card h-4 w-2/3 rounded bg-surface-100-700"></div>
                    <div class="card h-4 w-1/2 rounded bg-surface-100-700"></div>
                    <div class="card h-4 w-3/4 rounded bg-surface-100-700"></div>
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each { length: 3 } as _}
                    <div class="card preset-outlined-surface-200-800 p-4 space-y-3 animate-pulse">
                        <div class="h-5 w-3/5 rounded bg-surface-100-700"></div>
                        <div class="h-3 w-2/5 rounded bg-surface-100-700"></div>
                        <div class="flex gap-2 mt-2">
                            <div class="h-6 w-16 rounded-full bg-surface-100-700"></div>
                            <div class="h-6 w-20 rounded-full bg-surface-100-700"></div>
                        </div>
                    </div>
                {/each}
            </div>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                {#each { length: 3 } as _}
                    <div class="h-10 w-40 rounded-lg bg-surface-100-700 animate-pulse"></div>
                {/each}
            </div>
        </div>
    {:then competition}
        {@const competitionName = competition?.name}
        {@const startDate = new Date(competition?.startDate ?? new Date())}
        {@const endDate = new Date(competition?.endDate ?? new Date())}
        {@const isMultiDay = startDate.toDateString() !== endDate.toDateString()}
        {@const categories = competition?.categories || []}

        {#if competition}
        <!-- Header Section -->
        <div class="space-y-3">
            <div class="space-y-4 mb-6">
                <div class="flex justify-between items-start gap-2">
                    <CompetitionTitle title={competition.name} />
                </div>

                {#if competition.description}
                    <p class="text-sm text-surface-600 dark:text-surface-400 break-words">{competition.description}</p>
                {/if}

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {#if competition.location}
                        <div class="flex items-center gap-2">
                            <MapMarkerIcon width="1.2rem" height="1.2rem" class="text-primary-500" />
                            <span>{competition.location}</span>
                        </div>
                    {/if}
                    {#if competition.country}
                        <div class="flex items-center gap-2">
                            <EarthIcon width="1.2rem" height="1.2rem" class="text-primary-500" />
                            <span>{getCountryNameFromCode(competition.country, $locale)} {getCountryFlag(competition.country)} {competition.postalCode ? ` - ${competition.postalCode}` : ''}</span>
                        </div>
                    {/if}
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <CalendarClockIcon width="1.2rem" height="1.2rem" class="text-primary-500" />
                            <span>
                                {startDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {#if isMultiDay}
                                - {endDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {/if}
                            </span>
                        </div>
                        <CompetitionStatusChip competitionStatus={competition.status} />
                    </div>
                </div>
                <div class="space-x-3 flex items-center justify-between w-full">
                    <!-- Creator Info -->
                    {#if competition?.creator}
                        <div class="flex items-center gap-2">
                            <Avatar class="w-6 h-6">
                                <Avatar.Fallback>{competition?.creator.name?.substring(0,2) ?? 'U'}</Avatar.Fallback>
                            </Avatar>
                            <span class="text-sm text-surface-600-400">
                                <!-- Here we do this to ensure that people can get to the organizers public_profile -->
                                {$t('competition_details.organized_by')} <a href="/public_profile/{competition.creator.id}" class="text-primary-900-100 underline transition-colors">{competition.creator.name}</a>
                            </span>
                        </div>
                    {/if}
                    <!-- Organizer/Judge manage menu -->
                    {#await data.props.access then access}
                        {@const actions = buildManageActions(competition.id, access, competition.status)}
                        {#if actions.length > 0}
                            <OverflowMenu {actions} label={$t('competition_details.manage')} testId="competition-manage-menu" />
                        {/if}
                    {/await}
                </div>
                {#if competition?.paymentMethod}
                    <div class="flex items-start gap-2 text-sm">
                        <CreditCardOutlineIcon width="1.2rem" height="1.2rem" class="text-primary-500 shrink-0 mt-0.5" />
                        <span class="text-surface-600 dark:text-surface-400 whitespace-pre-line">{competition.paymentMethod}</span>
                    </div>
                {/if}
            </div>
            {#if competition?.image_cld_id}
                <button
                    type="button"
                    class="w-full block cursor-zoom-in bg-transparent border-0 p-0 text-left"
                    onclick={() => showImageDialog = true}
                    aria-label={`Open image for ${competitionName}`}
                >
                    <CldImage
                        src={competition.image_cld_id}
                        width="800"
                        height="400"
                        alt={competitionName}
                        crop="fill"
                        gravity="auto"
                        loading="lazy"
                        class="rounded-lg shadow-lg w-full object-cover max-h-96"
                    />
                </button>
            {/if}


            <!-- Categories & Actions Section -->
            {#await Promise.all([data.props.records, data.props.waitlistPositions, data.props.categoriesWithCounts, data.props.access])}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {#each { length: 3 } as _}
                        <div class="card preset-outlined-surface-200-800 p-4 space-y-3 animate-pulse">
                            <div class="h-5 w-3/5 rounded bg-surface-100-700"></div>
                            <div class="h-3 w-2/5 rounded bg-surface-100-700"></div>
                            <div class="flex gap-2 mt-2">
                                <div class="h-6 w-16 rounded-full bg-surface-100-700"></div>
                                <div class="h-6 w-20 rounded-full bg-surface-100-700"></div>
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    {#each { length: 3 } as _}
                        <div class="h-10 w-40 rounded-lg bg-surface-100-700 animate-pulse"></div>
                    {/each}
                </div>
            {:then [userRecords, waitlistPositions, categoriesWithCounts, access]}
                {@const isOrganizer = access.canManageCompetition}

                <div>
                    <CategoriesOverview {categories} isCreator={isOrganizer} {isMultiDay} {categoriesWithCounts} userRecords={userRecords ?? []} {waitlistPositions} />
                </div>

                <!-- Primary CTA: Registration -->
                {@const hasRegistrations = userRecords && userRecords.length > 0}
                {@const registrationPath = `/competitions/competition_details/${competition?.id}/registration`}
                {@const hasOpenSpot = hasRegistrableSpot(categoriesWithCounts)}
                <div class="flex flex-col items-center gap-2">
                    <RegistrationActionButton
                        loggedIn={!!currentUser}
                        registrationOpen={!!competition?.registrationOpen}
                        {isOrganizer}
                        {hasOpenSpot}
                        hasRegistrations={!!hasRegistrations}
                        registrationHref={registrationPath}
                        loginHref={`/login?redirect=${encodeURIComponent(registrationPath)}`}
                    />
                </div>

                <!-- Navigation link -->
                <div class="flex justify-center">
                    <a href="/competitions/explore_competitions/" class="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">
                        <ArrowLeftIcon width="0.9rem" height="0.9rem" />
                        {$t('competition_details.back_to_competitions_button')}
                    </a>
                </div>
            {/await}
        </div>

        {#if competition?.image_cld_id}
            <Dialog open={showImageDialog} onOpenChange={(e) => showImageDialog = e.open}>
                <Portal>
                    <Dialog.Backdrop class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
                    <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2">
                        <Dialog.Content class="relative flex items-center justify-center max-w-[98vw] max-h-[98vh] bg-transparent p-0 border-0 shadow-none outline-none overflow-visible">
                            <Dialog.CloseTrigger
                                class="btn-icon preset-tonal absolute top-2 right-2 z-10 bg-surface-100/90 dark:bg-surface-900/90"
                                aria-label="Close image preview"
                            >
                                <CloseIcon width="1.2rem" height="1.2rem" />
                            </Dialog.CloseTrigger>

                            <CldImage
                                src={competition.image_cld_id}
                                width="auto"
                                height="auto"
                                alt={competitionName}
                                crop="limit"
                                gravity="auto"
                                loading="eager"
                                class="max-w-[98vw] max-h-[95vh] w-auto h-auto object-contain rounded-md"
                            />
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog>
        {/if}
        {:else}
            <p class="text-center text-surface-600 dark:text-surface-400 py-12">{$t('error_pages.not_found')}</p>
        {/if}
    {/await}
</div>
