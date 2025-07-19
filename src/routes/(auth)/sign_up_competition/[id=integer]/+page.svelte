<!-- This is the page form where a user can sign up for a competition
It will ask for the data to fill properly the different Category parties
that are available in a competition -->

<script lang="ts">
    import type { User } from '@prisma/client';
    import Icon from '@iconify/svelte';

    let { data, form} = $props();
    console.log("sign_up_competition +page.svelte: data", data);
    const competition = data.props.competitionDetails;
    const currentUser = data.user; // Assuming user data is available

    let selectedCategoryIds = $state<number[]>([]);
    let selectedTeammatesByCategory = $state<Record<number, User[]>>({});

    // Category-specific search states
    let searchQueryByCategory = $state<Record<number, string>>({});
    let searchResultsByCategory = $state<Record<number, User[]>>({});
    let isSearchingByCategory = $state<Record<number, boolean>>({});
    let showSearchResultsByCategory = $state<Record<number, boolean>>({});

    // Get selected categories details using derived state
    let selectedCategories = $derived(competition?.categories.filter(c => selectedCategoryIds.includes(c.id)));

    // Search for users
    async function searchUsers(categoryId: number) {
        const query = searchQueryByCategory[categoryId] || '';

        if (query.length < 2) {
            searchResultsByCategory = { ...searchResultsByCategory, [categoryId]: [] };
            showSearchResultsByCategory = { ...showSearchResultsByCategory, [categoryId]: false };
            return;
        }

        isSearchingByCategory = { ...isSearchingByCategory, [categoryId]: true };
        showSearchResultsByCategory = { ...showSearchResultsByCategory, [categoryId]: true };

        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            // Filter out current user and already selected teammates for this category
            const existingTeammates = selectedTeammatesByCategory[categoryId] || [];
            const filteredResults = result.users?.filter((user: User) =>
                user.id !== currentUser?.id &&
                !existingTeammates.find((teammate) => teammate.id === user.id)
            ) || [];

            searchResultsByCategory = { ...searchResultsByCategory, [categoryId]: filteredResults };
            console.log('Filtered search results for category', categoryId, ':', filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
            searchResultsByCategory = { ...searchResultsByCategory, [categoryId]: [] };
        } finally {
            isSearchingByCategory = { ...isSearchingByCategory, [categoryId]: false };
        }
    }

    function addTeammate(user: User, categoryId: number) {
        const category = competition?.categories.find(c => c.id === categoryId);
        const maxPartySize = category?.maxPartySize || 2;
        const currentTeammates = selectedTeammatesByCategory[categoryId] || [];

        if (currentTeammates.length < (maxPartySize - 1)) {
            selectedTeammatesByCategory = {
                ...selectedTeammatesByCategory,
                [categoryId]: [...currentTeammates, user]
            };
            searchQueryByCategory = { ...searchQueryByCategory, [categoryId]: '' };
            searchResultsByCategory = { ...searchResultsByCategory, [categoryId]: [] };
            showSearchResultsByCategory = { ...showSearchResultsByCategory, [categoryId]: false };
        }
    }

    function removeTeammate(userId: string, categoryId: number) {
        const currentTeammates = selectedTeammatesByCategory[categoryId] || [];
        selectedTeammatesByCategory = {
            ...selectedTeammatesByCategory,
            [categoryId]: currentTeammates.filter(t => t.id !== userId)
        };
    }

    function toggleCategory(categoryId: number) {
        if (selectedCategoryIds.includes(categoryId)) {
            selectedCategoryIds = selectedCategoryIds.filter(id => id !== categoryId);
        } else {
            selectedCategoryIds = [...selectedCategoryIds, categoryId];
        }
    }

    function handleSearchInput(categoryId: number, event: Event) {
        const target = event.target as HTMLInputElement;
        searchQueryByCategory = { ...searchQueryByCategory, [categoryId]: target.value };
        searchUsers(categoryId);
    }

    function handleSearchFocus(categoryId: number) {
        if ((searchQueryByCategory[categoryId] || '').length >= 2 && searchResultsByCategory[categoryId]?.length > 0) {
            showSearchResultsByCategory = { ...showSearchResultsByCategory, [categoryId]: true };
        }
    }

    // Add this function to prepare the submission data
    function prepareSubmissionData() {
        const categoriesData = selectedCategoryIds.map(categoryId => {
            const teammates = selectedTeammatesByCategory[categoryId] || [];
            const teammateIds = teammates.map(teammate => ({ user_id: teammate.id }));
            return {
                [categoryId]: teammateIds
            };
        });
        return JSON.stringify(categoriesData);
    }
</script>

<svelte:head>
    <title>Sign Up Competition</title>
</svelte:head>

<!-- The form will work this way:
 1. Show the competition details (startDate, endDate, location and description)
 2. Show the different categories that the competition has with its information (startTime, endTime,
    type, name if not null)
    2.1. If the category is individual, show the category card with the logged user information.
    2.2. Make the whole card selectable, so the user can select the category he wants to participate in
    2.3. If the category is not individual, inside the card must be a selector of users to add to the party
    2.4. The user can add as many users as the category allows at every category
    2.5. There must be a button to remove a user from the party
    2.6. Searching users to add to the party must be reactive and show the results in real time
    2.7. The data sent in this form must be:
        - competition_id
        - categories_selected [
            {category_id, (for each category selected)
                teammate_0: user.id (for each teammate in the party)
            },
            {category_id, (for each category selected)
                teammate_0: user.id (for each teammate in the party)
                teammate_1: user.id (for each teammate in the party)
                teammate_2: user.id (for each teammate in the party)
            },
        ]
    -->
<h4>{competition?.name}</h4>
<div class="container mx-auto max-w-4xl">

    <div class="bg-gray-100 p-2 rounded-lg mb-6">
        <p><strong>Description:</strong> {competition?.description}</p>
        <p><strong>Date:</strong> {competition?.startDate.toLocaleDateString()}</p>
        <p><strong>Location:</strong> {competition?.location}</p>
    </div>
    {#if form?.message}
        <div class="bg-green-100 p-2 rounded-lg mb-6">
            <p class="text-green-700 font-semibold">Success:</p>
            <p>{form.message}</p>
        </div>
    {/if}
    {#if form?.error}
        <div class="bg-red-100 p-2 rounded-lg mb-6">
            <p class="text-red-700 font-semibold">Error:</p>
            <p>{form.error}</p>
        </div>
    {/if}
    <form method="post" action="?/signup" class="space-y-6">

        <section>
            <h4 class="text-lg font-semibold">Sign Up for Categories</h4>
            <p class="text-gray-600">Select the categories you want to participate in</p>
        </section>
        <!-- Category Selection Cards -->
        <div class="space-y-4">

            {#each competition.categories as category}
            <!-- for category in categories
            1. Show a card containing Category details with a checkbox to know if
            user is signing up to this category
            2. If user is signing up, show user and party selector if maxPartySize > 1
        -->
                <div class="border-2 rounded-lg p-4 transition-all duration-200 {selectedCategoryIds.includes(category.id)?
                          'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }">
                                        <div class="flex items-center justify-between w-full">
                        <!-- Checkbox and Category Name on the left -->
                        <div class="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="category_{category.id}"
                                name="category_ids"
                                value={category.id}
                                checked={selectedCategoryIds.includes(category.id)}
                                onchange={() => toggleCategory(category.id)}
                                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                            />
                            <label for="category_{category.id}" class="text-lg font-semibold leading-5">
                                {category.name || category.type}
                            </label>
                        </div>

                        <!-- Time and Team Info on the right -->
                        <div class="flex items-center gap-4 text-sm text-surface-600-400">
                            {#if category.startTime && category.endTime}
                                <Icon icon="mdi:clock-time-four-outline" class="w-6 h-6" />
                                <div class="flex flex-col items-center">
                                    <span class="text-xs opacity-75">{(new Date(category.startTime)).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span class="text-xs opacity-75">{new Date(category.endTime).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            {/if}
                            <div class="flex flex-col items-center gap-1">
                                <Icon
                                icon={category.type.includes('TEAM') ? 'mdi:account-group' :
                                     category.type.includes('PAIRS') ? 'mdi:account-multiple' :
                                     category.type.includes('CHESS') ? 'mdi:chess-pawn' :
                                     'mdi:account'}
                                width="1.5rem"
                                height="1.5rem"
                                class="text-primary-800"
                                />
                                <span class="font-medium">{category.type === 'INDIVIDUAL' ? 'Individual' : `Team of ${category.maxPartySize || 2}`}</span>
                            </div>
                        </div>
                    </div>

                {#if selectedCategoryIds.includes(category.id)}
                <!-- Individual Category - Show current user info -->
                {#if category.type === 'INDIVIDUAL'}
                <div class="bg-white p-4 rounded border border-gray-100 mt-4">
                    <h4 class="font-medium mb-2 text-gray-700">Participant:</h4>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-blue-700 font-semibold">
                                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">
                                {currentUser?.name || 'Current User'}
                            </div>
                            {#if currentUser?.email}
                            <div class="text-sm text-gray-500">{currentUser.email}</div>
                            {/if}
                        </div>
                    </div>
                </div>
                {:else}
                <!-- Team Category - Show team builder -->
                <div class="bg-white p-4 rounded border border-gray-100 mt-4">
                    <h4 class="font-medium mb-3 text-gray-700">
                        Build Your Team ({(selectedTeammatesByCategory[category.id]?.length || 0) + 1}/{category.maxPartySize || 2})
                    </h4>

                    <!-- Current user as team leader -->
                    <div class="mb-4">
                        <div class="flex items-center gap-3 p-2 bg-blue-50 rounded">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span class="text-blue-700 font-semibold text-sm">
                                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div class="flex-1">
                                <span class="text-gray-700 font-medium">
                                    {currentUser?.name || 'You'} (Team Leader)
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Selected Teammates -->
                    {#if selectedTeammatesByCategory[category.id]?.length > 0}
                    <div class="mb-4">
                        <div class="space-y-2">
                            {#each selectedTeammatesByCategory[category.id] as teammate}
                            <div class="flex items-center gap-3 p-2 bg-green-50 rounded">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span class="text-green-700 font-semibold text-sm">
                                        {teammate.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div class="flex-1">
                                    <span class="text-gray-700">{teammate.name}</span>
                                    {#if teammate.email}
                                    <div class="text-xs text-gray-500">{teammate.email}</div>
                                    {/if}
                                </div>
                                <button
                                type="button"
                                onclick={() => removeTeammate(teammate.id, category.id)}
                                class="text-red-500 hover:text-red-700 p-1"
                                >
                                ×
                            </button>
                        </div>
                        {/each}
                    </div>
                </div>
                {/if}

                <!-- Add teammates if needed -->
                {#if (selectedTeammatesByCategory[category.id]?.length || 0) < ((category.maxPartySize || 2) - 1)}
                <div class="relative" data-search-container={category.id}>
                    <div class="relative">
                        <input
                        type="text"
                        value={searchQueryByCategory[category.id] || ''}
                        oninput={(e) => handleSearchInput(category.id, e)}
                        onfocus={() => handleSearchFocus(category.id)}
                        placeholder="Search for teammates by name or email..."
                        class="w-full p-2 border border-gray-300 rounded-md pr-10 text-sm"
                        />
                        {#if isSearchingByCategory[category.id]}
                        <div class="absolute right-2 top-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                        {/if}
                    </div>

                    <!-- Search Results -->
                    {#if showSearchResultsByCategory[category.id] && searchResultsByCategory[category.id]?.length > 0}
                    <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {#each searchResultsByCategory[category.id] as user}
                            <button
                            type="button"
                            onclick={() => addTeammate(user, category.id)}
                            class="w-full p-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                            >
                                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-blue-700 font-semibold text-xs">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div class="text-sm">
                                    <div class="font-medium text-gray-900">{user.name}</div>
                                    {#if user.email}
                                    <div class="text-xs text-gray-500">{user.email}</div>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}

                {#if showSearchResultsByCategory[category.id] && (searchQueryByCategory[category.id] || '').length >= 2 && searchResultsByCategory[category.id]?.length === 0 && !isSearchingByCategory[category.id]}
                <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2">
                    <p class="text-gray-500 text-center text-sm">No users found matching "{searchQueryByCategory[category.id]}"</p>
                </div>
                {/if}
            </div>
            {/if}

            <!-- Remove the old hidden inputs for teammates -->
        </div>
        {/if}
        <input type="hidden" name="competition_id" value={competition?.id} />
        <!-- Single hidden input for all selected categories data -->
        <input type="hidden" name="selected_categories" value={prepareSubmissionData()} />
        {/if}
    </div>
    {/each}
        </div>

        <button
            type="submit"
            disabled={selectedCategories && (selectedCategoryIds.length === 0 || selectedCategories.some(cat =>
                cat.type !== 'INDIVIDUAL' &&
                (selectedTeammatesByCategory[cat.id]?.length || 0) < ((cat.maxPartySize || 2) - 1)
            ))}
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
            {#if selectedCategoryIds.length === 0}
                Please select at least one category
            {:else}
                {#each selectedCategories || [] as cat}
                    {#if cat.type !== 'INDIVIDUAL' && (selectedTeammatesByCategory[cat.id]?.length || 0) < ((cat.maxPartySize || 2) - 1)}
                        Complete team for {cat.name} ({((cat.maxPartySize || 2) - 1) - (selectedTeammatesByCategory[cat.id]?.length || 0)} more needed)
                    {:else}
                        Sign Up for {selectedCategoryIds.length} Categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'}
                    {/if}
                {/each}
            {/if}
        </button>
    </form>
</div>

