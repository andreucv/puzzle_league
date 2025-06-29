<script lang="ts">
    import Icon from '@iconify/svelte';

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

    // Helper function to format time
    function formatTime(date: Date) {
        return date.toLocaleTimeString('default', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Helper function to get category type display name
    function getCategoryTypeName(type: string) {
        const typeNames: Record<string, string> = {
            'INDIVIDUAL': 'Individual',
            'PAIRS': 'Pairs',
            'TEAM': 'Team',
            'JUNIOR_INDIVIDUAL': 'Junior Individual',
            'JUNIOR_PAIRS': 'Junior Pairs',
            'PUZZLE_CHESS': 'Puzzle Chess'
        };
        return typeNames[type] || type;
    }
</script>

<svelte:head>
    <title>{competitionName} - Competition Details</title>
</svelte:head>

<div class="container mx-auto">
    <!-- Header Section -->
    <div class="card preset-filled-surface-100-900 p-6 mb-6">
        <div class="flex justify-between items-start">
            <div>
                <h1 class="h1 mb-2">{competitionName}</h1>
                {#if competitionDescription}
                    <p class="text-surface-600-400">{competitionDescription}</p>
                {/if}

                <!-- Status Badge -->
                <span class="badge preset-filled-primary-500 mt-2">
                    {competitionStatus}
                </span>
            </div>
        </div>

        <!-- Date and Location Info -->
        <div class="mt-6 space-y-3">
            <div class="flex items-center gap-2">
                <Icon icon="mdi:calendar-clock" width="1.5rem" height="1.5rem" class="text-primary-500" />
                <span class="text-lg">
                    {monthNumber} {monthAbbreviation} {year}
                    {#if bool_more_than_one_day}
                        - {competition_endDate.getDate()} {competition_endDate.toLocaleString('default', { month: 'short' })} {competition_endDate.getFullYear()}
                    {/if}
                </span>
            </div>

            {#if competition?.league}
                <div class="flex items-center gap-2">
                    <Icon icon="mdi:trophy" width="1.5rem" height="1.5rem" class="text-primary-500" />
                    <span class="text-lg">Part of: {competition.league.name}</span>
                </div>
            {/if}
        </div>
    </div>

    <!-- Categories Section -->
    <div>
        <h2 class="h2 mb-4">Competition Categories</h2>

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
                                class="text-primary-500"
                            />
                        </div>

                        {#if category.name}
                            <p class="text-surface-600-400 mb-2">{category.name}</p>
                        {/if}

                        <div class="space-y-2 text-sm">
                            <div class="flex items-center gap-2">
                                <Icon icon="mdi:clock-start" width="1.2rem" height="1.2rem" />
                                <span>Start: {formatTime(new Date(category.startTime))}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="mdi:clock-end" width="1.2rem" height="1.2rem" />
                                <span>End: {formatTime(new Date(category.endTime))}</span>
                            </div>

                            {#if bool_more_than_one_day && category.startDate}
                                <div class="flex items-center gap-2 text-surface-500-500">
                                    <Icon icon="mdi:calendar" width="1.2rem" height="1.2rem" />
                                    <span>
                                        {new Date(category.startDate).toLocaleDateString()}
                                    </span>
                                </div>
                            {/if}
                        </div>
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
