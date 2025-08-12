<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import Avatar from './Avatar.svelte';

  interface User {
    id: string;
    name: string;
    email: string;
  }

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let competitionId: number | null = null;

  let searchQuery = '';
  let searchResults: User[] = [];
  let selectedUsers: User[] = [];
  let isSearching = false;
  let isSubmitting = false;
  let searchTimeout: ReturnType<typeof setTimeout>;

  function closeModal() {
    isOpen = false;
    resetForm();
  }

  function resetForm() {
    searchQuery = '';
    searchResults = [];
    selectedUsers = [];
    isSearching = false;
    isSubmitting = false;
  }

  async function searchUsers() {
    if (searchQuery.length < 2) {
      searchResults = [];
      return;
    }

    isSearching = true;
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        searchResults = data.users;
      } else {
        console.error('Failed to search users');
        searchResults = [];
      }
    } catch (error) {
      console.error('Error searching users:', error);
      searchResults = [];
    }
    isSearching = false;
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchUsers, 300);
  }

  function toggleUserSelection(user: User) {
    const index = selectedUsers.findIndex(u => u.id === user.id);
    if (index >= 0) {
      selectedUsers = selectedUsers.filter(u => u.id !== user.id);
    } else {
      selectedUsers = [...selectedUsers, user];
    }
  }

  function isUserSelected(user: User) {
    return selectedUsers.some(u => u.id === user.id);
  }

  async function handleSubmit() {
    if (selectedUsers.length === 0) {
      alert('Please select at least one judge');
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(`/api/competitions/${competitionId}/judges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: selectedUsers.map(u => u.id)
        })
      });

      if (response.ok) {
        const result = await response.json();
        dispatch('judgesAdded', { judges: result.judges });
        closeModal();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to add judges:', error);
      alert('Failed to add judges. Please try again.');
    }

    isSubmitting = false;
  }

  $: if (searchQuery) {
    handleSearchInput();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Add Judges</h3>
        <button
          class="btn btn-sm btn-circle"
          on:click={closeModal}
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <!-- Search Section -->
        <div class="form-control mb-4">
          <label class="label" for="user-search">
            <span class="label-text">Search Users</span>
          </label>
          <div class="relative">
            <input
              id="user-search"
              type="text"
              class="input input-bordered w-full pr-10"
              bind:value={searchQuery}
              placeholder="Type name or email to search..."
              autocomplete="off"
            />
            <div class="absolute inset-y-0 right-3 flex items-center">
              {#if isSearching}
                <div class="loading loading-spinner loading-sm"></div>
              {:else}
                <Icon icon="mdi:magnify" class="text-gray-400" />
              {/if}
            </div>
          </div>
        </div>

        <!-- Search Results -->
        {#if searchQuery.length >= 2}
          <div class="mb-4">
            <h4 class="font-medium mb-2">Search Results</h4>
            {#if searchResults.length > 0}
              <div class="border rounded-lg max-h-48 overflow-y-auto">
                {#each searchResults as user}
                  <div
                    class="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                    on:click={() => toggleUserSelection(user)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && toggleUserSelection(user)}
                  >
                    <div class="flex items-center gap-3">
                      <Avatar {user} size={8} />
                      <div>
                        <div class="font-medium">{user.name}</div>
                        <div class="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div class="flex items-center">
                      {#if isUserSelected(user)}
                        <Icon icon="mdi:check-circle" class="text-green-500 text-xl" />
                      {:else}
                        <Icon icon="mdi:plus-circle-outline" class="text-gray-400 text-xl" />
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else if !isSearching}
              <div class="text-gray-500 text-center py-4">
                No users found matching "{searchQuery}"
              </div>
            {/if}
          </div>
        {/if}

        <!-- Selected Users -->
        {#if selectedUsers.length > 0}
          <div class="mb-6">
            <h4 class="font-medium mb-2">Selected Judges ({selectedUsers.length})</h4>
            <div class="flex flex-wrap gap-2">
              {#each selectedUsers as user}
                <div class="flex items-center gap-2 bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
                  <Avatar {user} size={5} />
                  <span class="text-sm">{user.name}</span>
                  <button
                    type="button"
                    class="text-primary-600 hover:text-primary-800"
                    on:click={() => toggleUserSelection(user)}
                  >
                    <Icon icon="mdi:close" class="text-sm" />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-secondary flex-1"
            on:click={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary flex-1"
            disabled={isSubmitting || selectedUsers.length === 0}
          >
            {isSubmitting ? 'Adding...' : `Add ${selectedUsers.length} Judge${selectedUsers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
