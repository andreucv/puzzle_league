<script lang="ts">
    import Icon from '@iconify/svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import { enhance } from '$app/forms';

    let { data } = $props();
    console.log("competition_details +page.svelte: data", data);

    const competition = data.props.competition_and_categories;
    const competitionName = competition?.name;
    const competitionDescription = competition?.description;
    const competitionStatus = competition?.status;
    const competition_startDate = new Date(competition?.startDate || new Date());
    const competition_endDate = new Date(competition?.endDate || new Date());

    const bool_more_than_one_day = competition_startDate.toDateString() !== competition_endDate.toDateString();

    const categories = competition?.categories || [];

    const monthNumber = competition_startDate.getDate();
    const monthAbbreviation = competition_startDate.toLocaleString('default', { month: 'short' });
    const year = competition_startDate.getFullYear();

    // Helper function to get user registration for a specific category
    function getUserRegistrationForCategory(categoryId: number) {
        if (!data.props.registers) return null;
        return data.props.registers.find(register => register.categoryId === categoryId);
    }

    // Helper function to check if category is individual
    function isIndividualCategory(categoryType: string) {
        return categoryType.includes('INDIVIDUAL');
    }
</script>

<svelte:head>
    <title>{competitionName} - Competition Details</title>
</svelte:head>

<div class="container mx-auto">
    <!-- Header Section -->
    <div class="space-y-4">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-2xl mb-2">{competitionName}</p>
                {#if competitionDescription}
                    <p>{competitionDescription}</p>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-2">
            <Icon icon="mdi:location" width="1.5rem" height="1.5rem" class="text-primary-500" />
            <span class="text-lg">
                {competition?.location}
            </span>
        </div>
        <!-- Date and Location Info -->
        <div class="space-y-3">
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <Icon icon="mdi:calendar-clock" width="1.5rem" height="1.5rem" class="text-primary-500" />
                    <span class="text-lg">
                        {monthNumber} {monthAbbreviation} {year}
                        {#if bool_more_than_one_day}
                            - {competition_endDate.getDate()} {competition_endDate.toLocaleString('default', { month: 'short' })} {competition_endDate.getFullYear()}
                        {/if}
                    </span>
                </div>
                <div class="flex justify-end">
                    <span class="badge preset-filled-primary-500">
                        {competitionStatus}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Categories Section -->
    <div class="mt-4">
        {#if categories.length > 0}
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each categories as category}
                    <div class="card preset-outlined-surface-200-800 p-4 hover:preset-tonal-primary transition-all">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="h4 font-semibold">
                                {getCategoryTypeName(category.type)}
                            </h3>
                            <Icon
                                icon={category.type.includes('TEAM') ? 'mdi:account-group' :
                                     category.type.includes('PAIRS') ? 'mdi:account-multiple' :
                                     category.type.includes('CHESS') ? 'mdi:chess-pawn' :
                                     'mdi:account'}
                                width="1.5rem"
                                height="1.5rem"
                                class="text-primary-800"
                            />
                        </div>

                        {#if category.name !== getCategoryTypeName(category.type).toUpperCase()}
                            <p class="text-surface-600-400 mb-2">{category.name}</p>
                        {/if}

                        <!-- TODO: if competition is more than one day, we should show day for each category -->
                        <div class="space-y-2 text-sm grid grid-cols-2 gap-2">
                            <div class="flex items-center gap-2">
                                <Icon icon="mdi:clock-start" width="1.2rem" height="1.2rem" />
                                <span>Start: {formatTime(new Date(category.startTime))}</span>
                            </div>
                            <div class="justify-end flex items-center gap-2">
                                <Icon icon="mdi:clock-end" width="1.2rem" height="1.2rem" />
                                <span>End: {formatTime(new Date(category.endTime))}</span>
                            </div>
                        </div>

                        <!-- Registration Status Display -->
                        {#if competitionStatus === 'UPCOMING' && data.props.registers !== undefined}
                            {@const userRegistration = getUserRegistrationForCategory(category.id)}
                            {#if userRegistration}
                                <div class="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <Icon icon="mdi:check-circle" width="1.2rem" height="1.2rem" class="text-success-600" />
                                            <span class="text-sm font-medium text-success-800">Registered</span>
                                        </div>
                                        <!-- Remove Registration Button -->
                                        <form method="post" action="?/remove_party" use:enhance>
                                            <input type="hidden" name="category_id" value={category.id} />
                                            <input type="hidden" name="user_id" value={data.user?.id} />
                                            <button
                                                type="submit"
                                                class="btn btn-sm preset-filled-error-500 hover:preset-filled-error-600 transition-colors"
                                                title="Remove registration"
                                            >
                                                <Icon icon="mdi:close" width="1rem" height="1rem" />
                                                Remove
                                            </button>
                                        </form>
                                    </div>

                                    <!-- Display team members -->
                                    <div class="space-y-2">
                                        {#if isIndividualCategory(category.type)}
                                            <div class="badge preset-filled-primary-500">
                                                You are registered
                                            </div>
                                        {:else}
                                            <div class="text-xs text-success-700 mb-1">Team Members:</div>
                                            <div class="flex flex-wrap gap-1">
                                                {#each userRegistration.users as user}
                                                    <div class="badge preset-filled-primary-500 text-xs flex items-center gap-1">
                                                        {#if user.image}
                                                            <img src={user.image} alt={user.name} class="w-4 h-4 rounded-full" />
                                                        {:else}
                                                            <Icon icon="mdi:account-circle" width="1rem" height="1rem" />
                                                        {/if}
                                                        {user.name}
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <div class="card preset-filled-surface-100-900 p-8 text-center">
                <Icon icon="mdi:alert-circle-outline" width="3rem" height="3rem" class="mx-auto mb-2 text-surface-500" />
                <p class="text-surface-600-400">No categories have been added to this competition yet.</p>
            </div>
        {/if}
    </div>

    <!-- Action Buttons -->
    <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/competitions" class="btn preset-tonal">
            <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
            Back to Competitions
        </a>
        <a href="/sign_up_competition/{competition?.id}" class="btn preset-filled-primary-500">
            <Icon icon="mdi:account-plus" width="1.2rem" height="1.2rem" />
            Sign Up for Competition
        </a>
    </div>
</div>
