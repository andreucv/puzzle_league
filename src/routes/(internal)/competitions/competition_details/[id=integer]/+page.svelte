<script lang="ts">
    import Icon from '@iconify/svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import type { Category, User, Prisma } from '@prisma/client';
    import SignUpToCategory from '$lib/components/SignUpToCategory.svelte';
    import ShowRegisteredToCategory from '$lib/components/ShowRegisteredToCategory.svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';

    import { CldImage } from 'svelte-cloudinary';

    let { data } = $props();
    let categoryUsersDataToCreate = $state<Record<number, User[]>>({});
    if ((data.props?.competition_and_categories?.categories?.length ?? 0) > 0) {
        const newCategoryUsersData : Record<number, User[]> = {};
        const categories = data.props!.competition_and_categories!.categories;
        categories.forEach(category => {
            newCategoryUsersData[category.id] = [];
        });
        categoryUsersDataToCreate = newCategoryUsersData;
    }

    $effect(() => {
        console.log("competition_details +page.svelte: data changed", $state.snapshot(categoryUsersDataToCreate));
    });

    const currentUser = data.user;
    const records = data.props.records;

    const competition = data.props.competition_and_categories;
    const competitionName = competition?.name;
    const competitionDescription = competition?.description;
    const competitionStatus = competition?.status;
    const competitionStatusLabel: Record<string, string> = {
        NOT_STARTED: 'Not Started',
        STARTED: 'Started',
        FINISHED: 'Finished',
        CANCELLED: 'Cancelled',
    };
    const competition_startDate = new Date(competition?.startDate || new Date());
    const competition_endDate = new Date(competition?.endDate || new Date());

    const bool_more_than_one_day = competition_startDate.toDateString() !== competition_endDate.toDateString();

    const categories = competition?.categories || [];

    // Check if current user is the creator of the competition
    const isCreator = currentUser && competition?.creatorId === currentUser.id;

    const monthNumber = competition_startDate.getDate();
    const monthAbbreviation = competition_startDate.toLocaleString('default', { month: 'short' });
    const year = competition_startDate.getFullYear();

    function notRegistered(category : Category) {
        if (data.props.records === undefined) return true;
        return !data.props.records.some(records => records.categoryId === category.id);
    }

    function anyCategoryFilled() {
        return Object.values(categoryUsersDataToCreate).some(users => users.length > 0);
    }

    function allCategoriesCompleteOrEmpty() {
        const bool = Object.entries(categoryUsersDataToCreate).every(([categoryId, users]) => {
            const category = categories.find(cat => cat.id === parseInt(categoryId));
            return category && (users.length === category.maxPartySize || users.length === 0);
        });
        console.log("competition_details +page.svelte: allCategoriesCompleteOrEmpty", bool);
        return bool;
    }

    function handleSubmitInscriptions() {
        console.log("competition_details +page.svelte: handleSubmitInscriptions", categoryUsersDataToCreate);
        let records : Prisma.RecordCreateInput[] = [];
        Object.entries(categoryUsersDataToCreate).forEach(([categoryId, users]) => {
            if (users.length > 0) {
                records.push({
                    creator: { connect: { id: currentUser.id } },
                    category: {
                        connect: { id: parseInt(categoryId) }
                    },
                    users: {
                        connect: users.map(user => ({ id: user.id }))
                    },
                });
            }
        });

        // Submit the form with the entries data
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `?/save_entries`;

        const entriesInput = document.createElement('input');
        entriesInput.type = 'hidden';
        entriesInput.name = 'records';
        entriesInput.value = JSON.stringify(records);
        form.appendChild(entriesInput);

        document.body.appendChild(form);
        form.submit();
    }
</script>

<div class="container mx-auto">
    <!-- Header Section -->
    <div class="space-y-3">
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
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 justify-start">
                <Icon icon="mdi:calendar-clock" width="1.5rem" height="1.5rem" class="text-primary-500" />
                <span class="text-lg">
                    {monthNumber} {monthAbbreviation} {year}
                    {#if bool_more_than_one_day}
                        - {competition_endDate.getDate()} {competition_endDate.toLocaleString('default', { month: 'short' })} {competition_endDate.getFullYear()}
                    {/if}
                </span>
            </div>
            <div class="justify-end">
                <span class="badge preset-filled-primary-500">
                    {competitionStatusLabel[competitionStatus ?? ''] || competitionStatus}
                </span>
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
        <div class="space-x-3 flex items-center justify-between w-full">
            <!-- Creator Info -->
            {#if competition?.creator}
                <div class="flex items-center gap-2 mt-3">
                    <Avatar name={competition?.creator.name} classes="w-8 h-8" />
                    <span class="text-sm text-surface-600-400">
                        Organized by {competition.creator.name}
                    </span>
                </div>
            {/if}
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

                        <!-- Sign Up Button -->
                        {#if notRegistered(category) }
                            <SignUpToCategory {category} {currentUser} bind:choosed_participants={categoryUsersDataToCreate[category.id]} registrationOpen={competition?.registrationOpen ?? false}/>
                        {:else}
                            <ShowRegisteredToCategory {category} entry={records?.find(record => record.categoryId === category.id)} {currentUser} />
                        {/if}
                    </div>
                {/each}
            </div>
            {#if anyCategoryFilled()}
                <div class="mt-4 flex justify-center">
                    <button class="btn preset-filled-success-500 preset-outlined-success-500" disabled={!allCategoriesCompleteOrEmpty()} on:click={handleSubmitInscriptions}>
                        Submit Inscriptions
                    </button>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Action Buttons -->
    <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        {#if isCreator}
            <a href="/competition/edit/{competition?.id}" class="btn preset-filled-primary-500">
                <Icon icon="mdi:pencil" width="1.2rem" height="1.2rem" />
                Edit Competition
            </a>
            <a href="/competition/during_competition/{competition?.id}" class="btn preset-filled-primary-500">
                <Icon icon="mdi:chess-queen" width="1.2rem" height="1.2rem" />
                During Competition
            </a>
        {/if}
        <a href="/competitions/upcoming_competitions" class="btn preset-tonal">
            <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
            Back to Competitions
        </a>
    </div>
</div>
