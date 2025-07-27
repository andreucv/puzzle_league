<script lang="ts">
    import type { User , Category} from '@prisma/client';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    let { category, currentUser, choosed_participants = $bindable([]), registrationOpen}: { category: Category, currentUser: User, choosed_participants: User[], registrationOpen: boolean} = $props();
    console.log('SignUpToCategory.svelte: category:', category);
    console.log('SignUpToCategory.svelte: currentUser:', currentUser);
    console.log('SignUpToCategory.svelte: choosed_participants:', choosed_participants);
    // data will include:
    // - category_id, category_type, max_party_size
    // - binded map to return as: mao {category_id: [user_id, user_id, ...]}
    // - number of users in map will depend on max_party_size of category

    /**
     * @param {Object} category
     * @param {string} user_id
     *
     * @returns {map<number, Array<User>>} map
     *
     * This component will be used by the users to choose their party members
     * when signing up for a category in a competition.
     *
    */
    let opened_signup_form = $state(false);
    let participant_query = $state('');
    let user_query_results = $state<Array<User>>([]);

    // These will be outputs to the parent component
    // to be used when submitting the form
    let complete_signup = $derived(choosed_participants.length === category.maxPartySize);
    $effect(() => {
        console.log("SignUpToCategory.svelte: Choosed participants:", $state.snapshot(choosed_participants));
    });

    async function searchUsers(query: string) {
        if (query.length < 2) {
            user_query_results = [];
            return;
        }

        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            // Filter out current user and already selected teammates for this category
            const existingTeammates = choosed_participants || [];
            const filteredResults = result.users?.filter((user: User) =>
                user.id !== currentUser?.id &&
                !existingTeammates.find((teammate) => teammate.id === user.id)
            ).slice(0, 5) || [];

            user_query_results = filteredResults.slice(0, 5);
            console.log('Filtered search results for category:', filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
            user_query_results = [];
        }
    }

    function handleSearchInput(e: Event) {
        participant_query = (e.target as HTMLInputElement).value;
        searchUsers(participant_query);
    }

    function addTeammate(user: User) {
        choosed_participants = [...choosed_participants, user];
        user_query_results = [];
        participant_query = '';
    }

    function restoreChoosedParticipants() {
        choosed_participants = [];
    }
</script>

<div class="container">
    {#if !opened_signup_form}
        <button type="button" class="btn btn-sm preset-filled-success-500 hover:preset-filled-primary-600 transition-colors"
            title="Register"
            onclick={() => {opened_signup_form = true; addTeammate(currentUser);}}
            disabled={!registrationOpen}
        >
            <Icon icon="mdi:account-plus" width="1rem" height="1rem" />
            Edit Inscription
        </button>
    {:else}
        <div class="mt-2 relative p-3 bg-warning-50 border-warning-500 rounded-lg">
            <button
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
                onclick={() => {opened_signup_form = false; restoreChoosedParticipants()}}
            >
                ✕
            </button>
            <!-- Let's use here the input to add participants -->
            <div class="space-y-2">
                {#each choosed_participants as participant, index}
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                    <Avatar
                        name={participant.name ? participant.name.substring(0,2) : 'U'}
                        src={participant.image}
                        classes="w-8 h-8">
                        </Avatar>
                    <span>{participant.name}</span>
                    </div>
                    {#if participant.id != currentUser.id}
                        <button class="btn btn-sm preset-filled-primary-500 hover:preset-filled-primary-600 transition-colors" onclick={() => choosed_participants = choosed_participants.filter((_, i) => i !== index)}>Remove</button>
                    {/if}
                </div>
                {/each}
            </div>
            {#if choosed_participants.length != category.maxPartySize}
            <!-- Show input to add more users -->
                <input
                    type="text"
                    value={participant_query}
                    oninput={(e) => handleSearchInput(e)}
                    placeholder="Search for teammates by name or email..."
                    class="w-full mt-2 p-2 border border-gray-300 rounded-md pr-10 text-sm"
                />
            {/if}
            {#if user_query_results && user_query_results.length > 0}
                <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {#each user_query_results as user}
                        <button
                        type="button"
                        onclick={() => addTeammate(user)}
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
        </div>
    {/if}
</div>
