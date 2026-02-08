<script lang="ts">
    import Icon from '@iconify/svelte';
    import EntryParticiantAvatarComposite from './EntryParticiantAvatarComposite.svelte';
    import { onMount } from 'svelte';
    import { calculateDuration } from '$lib/utils/category_utils'

    interface RecordWithUsers {
        id: number;
        tableNumber: number | null;
        finishTime: string | null;
        users: Array<{ id: string; name: string; email: string }>;
        [key: string]: any;
    }

    let { category } = $props();
    let records = $state<RecordWithUsers[]>([]);

    async function loadRecords() {
        if (!category?.id) return;
        try {
            const res = await fetch(`/api/categories/${category.id}/records`);
            const data = await res.json();
            records = data.records ?? [];
            console.log('Fetched records:', records);
        } catch (error) {
            console.error('Error fetching records:', error);
            records = [];
        }
    }

    onMount(loadRecords);

    console.log("CategoryRecordFinishForm initialized with category:", category);

    // Watch for table number changes to find and display the entry
    let tableNumber = $state<string | null>(null);
    let selectedRecord = $state<RecordWithUsers | null>(null);
    let isSubmitting = $state(false);

    $effect(() => {
        selectedRecord = tableNumber && records.length > 0
            ? records.find(e => e.tableNumber === parseInt(tableNumber)) || null
            : null;
        console.log('Selected record:', selectedRecord);
    });

    async function recordFinishTime() {
        if (!selectedRecord) return;

        isSubmitting = true;
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const response = await fetch(`/api/records/${selectedRecord.id}/result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    finishTime: new Date().toISOString()
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Recorded finish time:', result);
                // Update the local entries array to reflect the change
                const entryIndex = records.findIndex(e => e.id === selectedRecord?.id);
                if (entryIndex !== -1) {
                    records[entryIndex] = { ...records[entryIndex], finishTime: result.record.finishTime };
                }
                // Reset form
                tableNumber = null;
                selectedRecord = null;

                // Update the category's finished records count
                category.finishedRecords++;
                isSubmitting = false;
            } else {
                console.error('Failed to record finish time');
            }
        } catch (error) {
            console.error('Error recording finish time:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="w-full p-4 rounded-lg border bg-warning-50">
    <div class="space-y-3">
        <div class="form-control">
            <label class="label" for="tableNumber">
                <span class="label-text font-medium">Record finish table</span>
            </label>
            <div class="flex gap-2">
                <input
                    id="tableNumber"
                    type="integer"
                    class="input flex-1 bg-amber-50"
                    bind:value={tableNumber}
                    placeholder="Enter table number"
                    min="0"
                    disabled={isSubmitting}
                />
            </div>
        </div>

        {#if tableNumber && selectedRecord && !selectedRecord.finishTime }
            <div class="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <h4 class="font-medium text-blue-800 mb-2">Participants in Table {tableNumber}:</h4>
                <EntryParticiantAvatarComposite users={selectedRecord.users} />
            </div>

            <button
                type="button"
                class="btn preset-tonal-primary w-full border"
                disabled={isSubmitting}
                onclick={recordFinishTime}
            >
                {#if isSubmitting}
                    <Icon icon="mdi:loading" class="text-sm animate-spin" />
                    Recording...
                {:else}
                    <Icon icon="mdi:flag-checkered" class="text-sm" />
                    Record Finish Time
                {/if}
            </button>
        {:else if selectedRecord && selectedRecord.finishTime}
            <div class="text-sm text-green-600 mt-2">
                <Icon icon="mdi:check" class="inline" />
                Table {tableNumber} finished on {calculateDuration(category.realStartTime, selectedRecord.finishTime)}
            </div>
        {:else if tableNumber && !selectedRecord}
            <div class="text-sm text-red-600 mt-2">
                <Icon icon="mdi:alert" class="inline" />
                Table {tableNumber} not found
            </div>
        {/if}
    </div>
</div>
