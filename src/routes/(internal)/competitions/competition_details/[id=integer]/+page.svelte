<script lang="ts">
    import { getCompetitionStatusLabel } from '$lib/utils/competition_utils';
    import { getCountryFlag, getCountryNameFromCode } from '$lib/utils/country_utils';
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

    let { data } = $props();

    const currentUser = $derived(data.user);
    const categoriesWithCounts = $derived(data.props.categoriesWithCounts);
    const userRecords = $derived(data.props.records);
    const isJudge = $derived(data.props.isJudge);
    const isOrganizer = $derived(data.props.isOrganizer);

    let competition = $derived(data.props.competition_and_categories);
    const competitionName = $derived(competition?.name);

	const startDate = $derived(new Date(competition?.startDate ?? new Date()));
	const endDate = $derived(new Date(competition?.endDate ?? new Date()));
	const isMultiDay = $derived(startDate.toDateString() !== endDate.toDateString());

    const categories = $derived(competition?.categories || []);

    // Check if current user is the creator of the competition
    const canAccessDuringCompetition = $derived(isOrganizer || isJudge);
    const canCancel = $derived(
        (isOrganizer) &&
        competition?.status !== 'CANCELLED' &&
        competition?.status !== 'FINISHED'
    );

    // Cancel competition dialog state
    let showCancelDialog = $state(false);
    let isCancelling = $state(false);
    let showImageDialog = $state(false);

    async function handleCancelCompetition() {
        isCancelling = true;
        try {
            const res = await fetch(`/api/competitions/${competition?.id}/cancel`, { method: 'POST' });
            if (res.ok) {
                showCancelDialog = false;
                goto(`/competitions/competition_details/${competition?.id}`, { invalidateAll: true });
            }
        } catch (err) {
            console.error('Failed to cancel competition:', err);
        } finally {
            isCancelling = false;
        }
    }
</script>

<div class="container mx-auto">
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
                        <span>{getCountryNameFromCode(competition.country)} {getCountryFlag(competition.country)} {competition.postalCode ? ` - ${competition.postalCode}` : ''}</span>
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
                            {$t('competition_details.organized_by')} {competition.creator.name}
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


        <!-- Categories Section -->
        <div>
            <CategoriesOverview {categories} {isOrganizer} {isMultiDay} {categoriesWithCounts} userRecords={userRecords ?? []} />
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <EndPageActionButton icon={AccountPlusIcon} href="/competitions/competition_details/{competition?.id}/inscription" colorClass="preset-filled-success-500" disabled={!(currentUser && competition?.registrationOpen)} text={$t('competition_details.manage_inscription')} testId="signup-button" />
            {#if canAccessDuringCompetition}
                <EndPageActionButton icon={TimerPlayIcon} href="/competition/{competition?.id}/during_competition" text={$t('during_competition.title')} />
            {/if}
            {#if isOrganizer}
                <EndPageActionButton icon={PencilIcon} href="/competition/edit/{competition?.id}" text={$t('competition_details.edit_button')} />
                <EndPageActionButton icon={ClipboardCheckOutlineIcon} href="/competition/{competition?.id}/manage_inscriptions" text={$t('manage_inscriptions.title')} testId="manage-inscriptions-button" />
            {/if}
            <EndPageActionButton icon={ArrowLeftIcon} href="/competitions/explore_competitions/" colorClass="preset-tonal" text={$t('competition_details.back_to_competitions_button')} />
        </div>

        <!-- Cancel Competition Button -->
        {#if canCancel}
            <div class="flex justify-center pt-4">
                <button
                    class="btn preset-filled-error-500"
                    onclick={() => showCancelDialog = true}
                >
                    <CancelIcon width="1.2rem" height="1.2rem" />
                    {$t('during_competition.cancel_competition')}
                </button>
            </div>
        {/if}
    </div>
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

<!-- Cancel Competition Confirmation Dialog -->
{#if showCancelDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onclick={() => showCancelDialog = false}
    >
        <div
            class="card preset-outlined-surface-200-800 p-6 m-4 max-w-md w-full space-y-4"
            onclick={(e) => e.stopPropagation()}
        >
            <h3 class="h3 flex items-center gap-2">
                <AlertIcon class="text-error-500" width="1.5rem" height="1.5rem" />
                {$t('during_competition.cancel_competition_confirm_title')}
            </h3>

            <p class="text-sm">
                {$t('during_competition.cancel_competition_confirm_message')}
            </p>

            <div class="flex justify-end gap-2">
                <button
                    class="btn btn-sm preset-tonal"
                    onclick={() => showCancelDialog = false}
                    disabled={isCancelling}
                >
                    {$t('during_competition.cancel')}
                </button>
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
        </div>
    </div>
{/if}
