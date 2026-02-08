<script lang="ts">
    import { getCategoryTypeName, calculateDuration } from "$lib/utils/category_utils";
    import Icon from "@iconify/svelte";
    import EntryParticiantAvatarComposite from "./EntryParticiantAvatarComposite.svelte";
    import CategoryRecordFinishForm from "./CategoryRecordFinishForm.svelte";

    let {
        category = $bindable(),
    } = $props();

    console.log("CategoryDuringCompetition - category prop:", category);

    // Debug logging to see when props change
    $effect(() => {
        console.log("CategoryDuringCompetition - category prop updated:", category.id, category.status);
        console.log("CategoryDuringCompetition - category object:", JSON.stringify(category, null, 2));
    });

    // State for live time updates
    let currentTime = $state(new Date());

    // Update current time every second when category is in progress
    $effect(() => {
        if (category.status === 'in_progress') {
            const interval = setInterval(() => {
                currentTime = new Date();
            }, 1000);

            return () => clearInterval(interval);
        }
    });

    function formatTime(dateStr: string | null | undefined) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleTimeString(undefined, { hour12: false });
    }

    async function onStartCategory(id: number) {
        const response = await fetch(
            `/api/categories/${id}/start`,
            {
                method: "POST",
            },
        );

        if (response.ok) {
            const updatedCategory = await response.json();
            console.log("Category started successfully:", updatedCategory);

            // Update the competition.categories directly
            category = updatedCategory.category;
            console.log("Category started successfully:", category);
        } else {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            alert(`Error: ${errorData.error}`);
        }
    }

    async function onStopCategory() {
        const response = await fetch(
            `/api/categories/${category.id}/stop`,
            {
                method: "POST",
            },
        );

        if (response.ok) {
            const updatedCategory = await response.json();
            console.log("Category stopped successfully:", updatedCategory);

            // Update the competition.categories directly
            category = updatedCategory.category;
        } else {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            alert(`Error: ${errorData.error}`);
        }
    }

</script>

<div class="card variant-glass-surface shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
    <!-- Status Indicator Bar -->
    <div class="h-1 {category.status === 'not_started'
        ? 'bg-gradient-to-r from-gray-400 to-gray-500'
        : category.status === 'in_progress'
        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse'
        : 'bg-gradient-to-r from-green-400 to-emerald-500'}">
    </div>

    <div class="p-4">
        <!-- Header Section -->
        <div class="flex justify-between items-center gap-4 mb-4">
            <div class="flex-1 space-y-2">
                <!-- Title and Action Row -->
                <div class="flex items-center justify-between gap-3">
                    <div class="flex flex-col">
                        <h4 class="h4 font-semibold">{getCategoryTypeName(category.type)}</h4>
                        {#if category.name}
                            <p class="text-sm text-base-content/70">{category.name}</p>
                        {/if}
                    </div>
                    <!-- Action Button -->
                    <div class="flex-shrink-0 ml-auto">
                        {#if category.status === "not_started"}
                            <button
                                class="btn bg-success-300-700 btn-sm gap-2"
                                onclick={() => onStartCategory(category.id)}
                            >
                                <Icon icon="mdi:play" />
                                Start
                            </button>
                        {:else if category.status === "in_progress"}
                            <button
                                class="btn bg-error-300-700 btn-sm gap-2"
                                onclick={() => onStopCategory()}
                            >
                                <Icon icon="mdi:stop" />
                                End
                            </button>
                        {:else}
                            <div class="badge variant-filled-success gap-1">
                                <Icon icon="mdi:check" />
                                Completed
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Timing Info -->
                <div class="flex flex-row justify-between items-center gap-3 text-sm text-base-content/80">
                    {#if category.status === "not_started"}
                        <span class="flex items-center gap-1 whitespace-nowrap">
                            <Icon icon="mdi:clock-start" class="text-base flex-shrink-0" />
                            Starts at {formatTime(category.startTime)}
                        </span>
                    {:else if category.status === "in_progress"}
                        <span class="flex items-center gap-1 whitespace-nowrap">
                            <Icon icon="mdi:clock-check" class="text-base text-yellow-500 flex-shrink-0" />
                            Started {formatTime(category.realStartTime)}
                        </span>
                        <span class="flex items-center gap-1 whitespace-nowrap">
                            <Icon icon="mdi:timer-sand" class="text-base text-yellow-500 flex-shrink-0" />
                            Elapsed {calculateDuration(category.realStartTime, currentTime)}
                        </span>
                    {:else}
                        <span class="flex items-center gap-1 whitespace-nowrap">
                            <Icon icon="mdi:clock-check" class="text-base text-green-500 flex-shrink-0" />
                            Started {formatTime(category.realStartTime)}
                        </span>
                        <span class="flex items-center gap-1 whitespace-nowrap">
                            <Icon icon="mdi:timer-check" class="text-base text-green-500 flex-shrink-0" />
                            Duration: {calculateDuration(category.realStartTime, category.realEndTime)}
                        </span>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Entries Section -->
        {#if category.status === "in_progress"}
            {#if category.totalRecords > 0 && category.finishedRecords < category.totalRecords }
                <CategoryRecordFinishForm
                    category={category}
                />
                <div class="mt-4 flex justify-between items-center">
                    <span class="text-sm">
                        Finished: {category.finishedRecords}
                    </span>
                    <span class="text-sm">
                        Total participants: {category.totalRecords}
                    </span>
                </div>
                <div class="w-full mt-4 px-1 flex space-x-4">
                    <span class="text-sm text-base-content/70">Table</span>
                    <span class="flex-1 text-sm text-base-content/70">Participants</span>
                </div>
            {:else if category.totalRecords > 0 && category.finishedRecords === category.totalRecords}
                <div class="flex items-center justify-center">
                    <Icon icon="mdi:check-bold" class="text-3xl mb-2" />
                    <p>All participants finished</p>
                </div>
            {:else}
                <div class="flex items-center justify-center">
                    <Icon icon="mdi:close" class="text-3xl mb-2" />
                    <p>No participants in this category</p>
                </div>
            {/if}
        {:else if category.status === "completed"}
            <div class="flex justify-center">
                <a href="/competitions/competition_details/{category.competitionId}/results/{category.id}">
                    <button class="btn bg-primary-500 btn-sm gap-2">
                        <Icon icon="mdi:format-list-bulleted" />
                        Go to Results
                    </button>
                </a>
            </div>
        {/if}
    </div>
</div>
