<script lang="ts">
    import Icon from '@iconify/svelte';
    import { getCompetitionStatusLabel } from '$lib/utils/competition_utils';
    import { getCountryFlag, getCountryNameFromCode } from '$lib/utils/country_utils';
    import CategoriesOverview from '$lib/components/competition/CategoriesOverview.svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';

    import { CldImage } from 'svelte-cloudinary';
    import { t } from '$lib/translations';
    import EndPageActionButton from '$lib/components/common/buttons/EndPageActionButton.svelte';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';

    import MapMarkerIcon from '@iconify-svelte/mdi/map-marker';
    import EarthIcon from '@iconify-svelte/mdi/earth';
    import CalendarClockIcon from '@iconify-svelte/mdi/calendar-clock';
    import CreditCardOutlineIcon from '@iconify-svelte/mdi/credit-card-outline';

    let { data } = $props();

    const currentUser = $derived(data.user);
    const categoriesWithCounts = $derived(data.props.categoriesWithCounts);
    const userRecords = $derived(data.props.records);

    let competition = $derived(data.props.competition_and_categories);
    const competitionName = $derived(competition?.name);

	const startDate = $derived(new Date(competition?.startDate ?? new Date()));
	const endDate = $derived(new Date(competition?.endDate ?? new Date()));
	const isMultiDay = $derived(startDate.toDateString() !== endDate.toDateString());

    const categories = $derived(competition?.categories || []);

    // Check if current user is the creator of the competition
    const isCreator = $derived(currentUser && competition?.creatorId === currentUser.id);
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
        <div class="w-full">
            <CldImage
                    src={competition.image_cld_id}
                    width="800"
                    height="400"
                    alt={competitionName}
                    crop="fill"
                    gravity="auto"
                    class="rounded-lg shadow-lg w-full object-cover max-h-96"
                />
        </div>
        {/if}


        <!-- Categories Section -->
        <div>
            <CategoriesOverview {categories} {isCreator} {isMultiDay} {categoriesWithCounts} userRecords={userRecords ?? []} />
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <EndPageActionButton icon="mdi:account-plus" href="/competitions/competition_details/{competition?.id}/inscription" colorClass="preset-filled-success-500" disabled={!(currentUser && competition?.registrationOpen)} text={$t('competition_details.manage_inscription')} testId="signup-button" />
            {#if isCreator}
                <EndPageActionButton icon="mdi:pencil" href="/competition/edit/{competition?.id}" text={$t('competition_details.edit_button')} />
                <EndPageActionButton icon="mdi:play-circle-outline" href="/competition/{competition?.id}/during_competition" text={$t('competition_details.start_competition_button')} />
                <EndPageActionButton icon="mdi:clipboard-check-outline" href="/competition/{competition?.id}/manage_inscriptions" text={$t('manage_inscriptions.title')} testId="manage-inscriptions-button" />
            {/if}
            <EndPageActionButton icon="mdi:arrow-left" href="/competitions/explore_competitions/" colorClass="preset-tonal" text={$t('competition_details.back_to_competitions_button')} />
        </div>
    </div>
</div>
