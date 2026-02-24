<script lang="ts">
    import CategoryDuringCompetition from "$lib/components/CategoryDuringCompetition.svelte";
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import Icon from "@iconify/svelte";

    let { data } = $props();
    console.log("during_competition/+page.svelte data", data.props);

    // State variables
    let competition = $state(data.props.competition);
    let categories  = $state(data.props.categories);

    // Get active categories count - using $derived for reactive computations
    let nActiveCategories = $derived(categories?.filter(c => c.status === 'in_progress').length || 0);
    let nCompletedCategories = $derived(categories?.filter(c => c.status === 'completed').length || 0);
    let nTotalCategories = $derived(categories?.length || 0);

    let inProgressCategories = $derived(categories?.filter(c => c.status === 'in_progress'));
    let notStartedCategories = $derived(categories?.filter(c => c.status === 'not_started'));
    let completedCategories = $derived(categories?.filter(c => c.status === 'completed'));

    console.log("during_competition/+page.svelte inProgressCategories", inProgressCategories);
    console.log("during_competition/+page.svelte notStartedCategories", notStartedCategories);
    console.log("during_competition/+page.svelte completedCategories", completedCategories);
    console.log("during_competition/+page.svelte first inProgressCategories", inProgressCategories[0]);
</script>

<!-- Improved Header with Competition Overview -->
<div class="flex justify-between items-start">
    <div>
        <GenericTitle text={competition?.name || "Competition"} />
        <div class="flex gap-4 text-sm">
            <div class="flex items-center gap-2">
                <Icon icon="mdi:format-list-checks" class="text-base-content/60" />
                <span class="text-base-content/60">Categories:</span>
                <span class="font-semibold">{nTotalCategories}</span>
            </div>
            <div class="flex items-center gap-2">
                <Icon icon="mdi:play-circle" class="text-warning" />
                <span class="text-base-content/60">Active:</span>
                <span class="font-semibold text-warning">{nActiveCategories}</span>
            </div>
            <div class="flex items-center gap-2">
                <Icon icon="mdi:check-circle" class="text-success" />
                <span class="text-base-content/60">Completed:</span>
                <span class="font-semibold text-success">{nCompletedCategories}</span>
            </div>
        </div>
    </div>
</div>

<!-- Categories Grid -->
<div class="space-y-4">
    <!-- Active Categories Section -->
    <div>
        <h3 class="pt-4 text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Currently Running
        </h3>
        <div class="space-y-3">
            {#each inProgressCategories as cat }
                <CategoryDuringCompetition
                    bind:category={categories[categories.findIndex(c => c.id === cat.id)]}
                />
            {/each}
        </div>
    </div>

    <!-- Upcoming Categories Section -->
    <div>
        <h3 class="pt-4 text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Upcoming Categories
        </h3>
        <div class="space-y-3">
            {#each notStartedCategories as cat }
                <CategoryDuringCompetition
                    bind:category={categories[categories.findIndex(c => c.id === cat.id)]}
                />
            {/each}
        </div>
    </div>

    <!-- Completed Categories Section -->
    <div>
        <h3 class="pt-4 text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Completed Categories
        </h3>
        <div class="space-y-3">
            {#each completedCategories as cat }
                <CategoryDuringCompetition
                    bind:category={categories[categories.findIndex(c => c.id === cat.id)]}
                />
            {/each}
        </div>
    </div>
</div>
