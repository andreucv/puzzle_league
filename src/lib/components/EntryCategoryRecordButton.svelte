<script lang="ts">
    import EntryParticiantAvatarComposite from "./EntryParticiantAvatarComposite.svelte";
    import Icon from "@iconify/svelte";

    let { record, category, index = 0 } = $props();
</script>

{#if category.status === "in_progress"}
    <button
        class="w-full p-2 rounded-lg
                bg-warning-50"
    >
        <!-- Left section: Table and Participant -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Table Number -->
            <div class="flex-shrink-0">
                {#if record.tableNumber}
                    <span class="badge variant-filled-surface">
                        {record.tableNumber}
                    </span>
                {:else}
                    <span class="text-surface-400">-</span>
                {/if}
            </div>

            <!-- Participant Avatar -->
            <div class="flex-1 min-w-0 text-left">
                <EntryParticiantAvatarComposite users={record.users} />
            </div>

            <div class="inline-flex">
                <Icon icon="mdi:timer-outline" class="text-lg text-surface-400" />
                <Icon icon="mdi:chevron-right" class="text-lg text-surface-400" />
            </div>
        </div>
    </button>
{:else}
    <button
        class="w-full p-2 rounded-lg
            bg-success-200"
        disabled={record.finishTime || category.status !== "in_progress"}
    >
        <div class="flex items-center gap-4">
            <!-- Left section: Table and Participant -->
            <div class="flex items-center flex-1 min-w-0">
                <!-- Table Number -->
                <div class="flex-shrink-0">
                    {#if record.tableNumber}
                        <span class="badge variant-filled-surface">
                            {record.tableNumber}
                        </span>
                    {:else}
                        <span class="text-surface-400">-</span>
                    {/if}
                </div>

                <!-- Participant Avatar -->
                <div class="flex-1 min-w-0 text-left">
                    <EntryParticiantAvatarComposite users={record.users} />
                </div>
            </div>

            <!-- Right section: Time and Status -->
            <div class="flex items-center gap-3 flex-shrink-0">
                <!-- Action/Status -->
                <div class="flex-shrink-0">
                    {#if category.status === "in_progress"}
                        {#if !record.finishTime}
                            <div class="flex items-center gap-1.5 text-primary-500">
                                <Icon icon="mdi:timer-outline" class="text-lg" />
                                <span class="font-medium text-sm">Record</span>
                            </div>
                        {:else}
                            <span class="badge variant-filled-success">
                                <Icon icon="mdi:check" class="text-xs" />
                                Done
                            </span>
                        {/if}
                    {:else if record.finishTime}
                        <span class="badge variant-filled-warning font-bold">
                            #{index + 1}
                        </span>
                    {:else}
                        <span class="text-surface-400 text-xs uppercase">DNF</span>
                    {/if}
                </div>
            </div>
        </div>
    </button>
{/if}
