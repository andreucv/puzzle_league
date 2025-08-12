<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let entry = null;
  export let entries = [];

  let selectedEntryId = '';
  let finishTime = '';
  let tableNumber = '';
  let isSubmitting = false;

  function closeModal() {
    isOpen = false;
    resetForm();
  }

  function resetForm() {
    selectedEntryId = '';
    finishTime = '';
    tableNumber = '';
    isSubmitting = false;
  }

  function formatCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function useCurrentTime() {
    finishTime = formatCurrentTime();
  }

  async function handleSubmit() {
    if (!selectedEntryId) {
      alert('Please select an entry');
      return;
    }

    if (!finishTime) {
      alert('Please enter a finish time');
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(`/api/entries/${selectedEntryId}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finishTime,
          tableNumber: tableNumber ? parseInt(tableNumber) : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        dispatch('resultRecorded', { entry: result.entry });
        closeModal();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to record result:', error);
      alert('Failed to record result. Please try again.');
    }

    isSubmitting = false;
  }

  // Pre-populate form if entry is provided
  $: if (entry && isOpen) {
    selectedEntryId = entry?.id || '';
    tableNumber = entry?.tableNumber?.toString() || '';
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Record Result</h3>
        <button
          class="btn btn-sm btn-circle"
          on:click={closeModal}
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-control mb-4">
          <label class="label" for="entry-select">
            <span class="label-text">Select Entry</span>
          </label>
          <select
            id="entry-select"
            class="select select-bordered w-full"
            bind:value={selectedEntryId}
            required
          >
            <option value="">Choose an entry...</option>
            {#each entries.filter(e => !e.finishTime) as entry}
              <option value={entry.id}>
                {entry.users?.[0]?.name || 'Unknown'}
                {entry.tableNumber ? `(Table ${entry.tableNumber})` : ''}
              </option>
            {/each}
          </select>
        </div>

        <div class="form-control mb-4">
          <label class="label" for="finish-time">
            <span class="label-text">Finish Time</span>
          </label>
          <div class="flex gap-2">
            <input
              id="finish-time"
              type="time"
              step="1"
              class="input input-bordered flex-1"
              bind:value={finishTime}
              required
            />
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              on:click={useCurrentTime}
            >
              Now
            </button>
          </div>
        </div>

        <div class="form-control mb-6">
          <label class="label" for="table-number">
            <span class="label-text">Table Number (Optional)</span>
          </label>
          <input
            id="table-number"
            type="number"
            class="input input-bordered w-full"
            bind:value={tableNumber}
            placeholder="Enter table number"
            min="1"
          />
        </div>

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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record Result'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
