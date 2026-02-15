<script lang="ts">
    import Icon from '@iconify/svelte';
    import { getCompetitionStatusLabel } from '$lib/utils/competition_utils';
    import { getCountryFlag } from '$lib/country_utils.js';
    import CategoriesOverview from '$lib/components/CategoriesOverview.svelte';
    import ManageRegistrationStatus from '$lib/components/ManageRegistrationStatus.svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';

    import { CldImage } from 'svelte-cloudinary';

    let { data } = $props();

    const currentUser = data.user;
    const categoriesWithCounts = data.props.categoriesWithCounts;

    let competition = $state(data.props.competition_and_categories);
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
                <h5 class="text-lg font-semibold break-words min-w-0">{competition.name}</h5>
            </div>

            {#if competition.description}
                <p class="text-sm text-surface-600 dark:text-surface-400 break-words">{competition.description}</p>
            {/if}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {#if competition.location}
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:map-marker" width="1.2rem" height="1.2rem" class="text-primary-500" />
                        <span>{competition.location}</span>
                    </div>
                {/if}
                {#if competition.country}
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:earth" width="1.2rem" height="1.2rem" class="text-primary-500" />
                        <span>{competition.country} {getCountryFlag(competition.country)}{competition.postalCode ? ` - ${competition.postalCode}` : ''}</span>
                    </div>
                {/if}
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:calendar-clock" width="1.2rem" height="1.2rem" class="text-primary-500" />
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
                        <Avatar name={competition?.creator.name} classes="w-6 h-6" />
                        <span class="text-sm text-surface-600-400">
                            Organized by {competition.creator.name}
                        </span>
                    </div>
                {/if}
            </div>
        </div>
        {#if competition?.image_cld_id}
        <div class="w-full">
            <CldImage
                    src={competition.image_cld_id}
                    width="800"
                    height="400"
                    alt="{competitionName} - Competition Image"
                    crop="fill"
                    gravity="auto"
                    class="rounded-lg shadow-lg w-full object-cover max-h-96"
                />
        </div>
        {/if}


        <!-- Categories Section -->
        <div>
            <CategoriesOverview {categories} {isCreator} />
        </div>

        <!-- Manage Registration (creator only) -->
        {#if isCreator && categoriesWithCounts && competition}
            <div>
                <ManageRegistrationStatus bind:competition={competition} categories={categoriesWithCounts} />
            </div>
        {/if}


        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            {#if currentUser}
                <a href="/competitions/competition_details/{competition?.id}/inscription" class="btn preset-filled-success-500">
                    <Icon icon="mdi:account-plus" width="1.2rem" height="1.2rem" />
                    Sign Up
                </a>
            {/if}
            {#if isCreator}
                <a href="/competition/edit/{competition?.id}" class="btn preset-filled-primary-500">
                    <Icon icon="mdi:pencil" width="1.2rem" height="1.2rem" />
                    Edit Competition
                </a>

                <a href="/competition/during_competition/{competition?.id}" class="btn preset-filled-primary-500">
                    <Icon icon="mdi:play-circle-outline" width="1.2rem" height="1.2rem" />
                    Competition Day
                </a>
            {/if}
            <a href="/competitions/explore_competitions/" class="btn preset-tonal">
                <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
                Back to Competitions
            </a>
        </div>
    </div>
</div>
