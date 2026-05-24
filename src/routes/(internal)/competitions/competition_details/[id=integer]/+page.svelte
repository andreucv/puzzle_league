<script lang="ts">
    import { getCompetitionStatusLabel } from '$lib/utils/competition_utils';
    import { getCountryFlag, getCountryNameFromCode } from '$lib/utils/country_utils';
    import { locale } from '$lib/translations';
    import CategoriesOverview from '$lib/components/competition/CategoriesOverview.svelte';
    import { Avatar, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

    import { CldImage } from 'svelte-cloudinary';
    import { t } from '$lib/translations';
    import EndPageActionButton from '$lib/components/common/buttons/EndPageActionButton.svelte';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import { goto } from '$app/navigation';

    import MapMarkerIcon from '@iconify-svelte/mdi/map-marker';
    import EarthIcon from '@iconify-svelte/mdi/earth';
    import CalendarClockIcon from '@iconify-svelte/mdi/calendar-clock';
    import CreditCardOutlineIcon from '@iconify-svelte/mdi/credit-card-outline';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import AlertIcon from '@iconify-svelte/mdi/alert';
    import LoadingIcon from '@iconify-svelte/mdi/loading';
    import AccountPlusIcon from '@iconify-svelte/mdi/account-plus';
    import TimerPlayIcon from '@iconify-svelte/mdi/timer-play';
    import PencilIcon from '@iconify-svelte/mdi/pencil';
    import ClipboardCheckOutlineIcon from '@iconify-svelte/mdi/clipboard-check-outline';
    import ArrowLeftIcon from '@iconify-svelte/mdi/arrow-left';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import LockOutlineIcon from '@iconify-svelte/mdi/lock-outline';
    import LoginIcon from '@iconify-svelte/mdi/login';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import FormatListBulletedIcon from '@iconify-svelte/mdi/format-list-bulleted';

    let { data } = $props();

    const currentUser = $derived(data.user);

    // Cancel competition dialog state
    let showCancelDialog = $state(false);
    let isCancelling = $state(false);
    let showImageDialog = $state(false);
    let cancelCompetitionId: number | undefined = $state(undefined);

    async function handleCancelCompetition() {
        isCancelling = true;
        try {
            const res = await fetch(`/api/competitions/${cancelCompetitionId}/cancel`, { method: 'POST' });
            if (res.ok) {
                showCancelDialog = false;
                goto(`/competitions/competition_details/${cancelCompetitionId}`, { invalidateAll: true });
            }
        } catch (err) {
            console.error('Failed to cancel competition:', err);
        } finally {
            isCancelling = false;
        }
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
                        <span class="badge preset-filled-primary-500 shrink-0">
                            {getCompetitionStatusLabel(competition.status) || competition.status}
                        </span>
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
            {#await Promise.all([data.props.records, data.props.categoriesWithCounts, data.props.access])}
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
            {:then [userRecords, categoriesWithCounts, access]}
                {@const isOrganizer = access.isOrganizer}
                {@const isJudge = access.isJudge}
                {@const canAccessDuringCompetition = isOrganizer || isJudge}
                {@const canCancel = isOrganizer && competition?.status !== 'CANCELLED' && competition?.status !== 'FINISHED'}

                <div>
                    <CategoriesOverview {categories} isCreator={isOrganizer} {isMultiDay} {categoriesWithCounts} userRecords={userRecords ?? []} />
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <EndPageActionButton icon={AccountPlusIcon} href="/competitions/competition_details/{competition?.id}/registration" colorClass="preset-filled-success-500" disabled={!(currentUser && (competition?.registrationOpen || isOrganizer))} text={$t('competition_details.manage_registration')} testId="signup-button" />
                    {#if categories.some(c => c.status === 'LIVE' || c.status === 'STOPPED')}
                        <EndPageActionButton icon={FormatListBulletedIcon} href="/competitions/competition_details/{competition?.id}/results" text={$t('competition_details.view_live_results')} />
                    {/if}
                    {#if canAccessDuringCompetition}
                        <EndPageActionButton icon={TimerPlayIcon} href="/competition/{competition?.id}/during_competition" text={$t('during_competition.title')} />
                    {/if}
                    {#if isOrganizer}
                        <EndPageActionButton icon={PencilIcon} href="/competition/edit/{competition?.id}" text={$t('competition_details.edit_button')} />
                        <EndPageActionButton icon={ClipboardCheckOutlineIcon} href="/competition/{competition?.id}/manage_registrations" text={$t('manage_registrations.title')} testId="manage-registrations-button" />
                    {/if}
                    <EndPageActionButton icon={ArrowLeftIcon} href="/competitions/explore_competitions/" colorClass="preset-tonal" text={$t('competition_details.back_to_competitions_button')} />
                </div>

                <!-- Alert Banner: explain why registration is not available -->
                {#if !competition?.registrationOpen}
                    <div class="flex items-center gap-2 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-300 dark:border-warning-700 text-sm">
                        <LockOutlineIcon width="1.2rem" height="1.2rem" class="text-warning-500 shrink-0" />
                        <span>{$t('competition_details.registration_closed_banner')}</span>
                    </div>
                {:else if !currentUser}
                    <a href="/login?redirect={encodeURIComponent(`/competitions/competition_details/${competition?.id}/registration`)}" class="flex items-center gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700 text-sm hover:opacity-80 transition-opacity">
                        <LoginIcon width="1.2rem" height="1.2rem" class="text-primary-500 shrink-0" />
                        <span>{$t('competition_details.login_to_register')}</span>
                    </a>
                {/if}

                <!-- Cancel Competition Button -->
                {#if canCancel}
                    <div class="flex justify-center pt-4">
                        <button
                            class="btn preset-filled-error-500"
                            onclick={() => { cancelCompetitionId = competition?.id; showCancelDialog = true; }}
                        >
                            <CancelIcon width="1.2rem" height="1.2rem" />
                            {$t('during_competition.cancel_competition')}
                        </button>
                    </div>
                {/if}
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
    {/await}
</div>

<!-- Cancel Competition Confirmation Dialog -->
<Dialog open={showCancelDialog} onOpenChange={(e) => showCancelDialog = e.open}>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Content class="card preset-outlined-surface-200-800 p-6 max-w-md w-full space-y-4">
                <h3 class="h3 flex items-center gap-2">
                    <AlertIcon class="text-error-500" width="1.5rem" height="1.5rem" />
                    {$t('during_competition.cancel_competition_confirm_title')}
                </h3>

                <p class="text-sm">
                    {$t('during_competition.cancel_competition_confirm_message')}
                </p>

                <div class="flex justify-end gap-2">
                    <Dialog.CloseTrigger
                        class="btn btn-sm preset-tonal"
                        disabled={isCancelling}
                    >
                        {$t('during_competition.cancel')}
                    </Dialog.CloseTrigger>
                    <button
                        class="btn btn-sm preset-filled-error-500"
                        onclick={handleCancelCompetition}
                        disabled={isCancelling}
                    >
                        {#if isCancelling}
                            <LoadingIcon class="animate-spin" width="1rem" height="1rem" />
                        {/if}
                        {$t('during_competition.cancel_competition_confirm')}
                    </button>
                </div>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
