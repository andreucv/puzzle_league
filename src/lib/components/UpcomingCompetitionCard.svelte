<script>
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import { defaultLocale } from '$lib/translations';

    let { competition } = $props();

    // Calculate days until competition
    const today = new Date();
    const competitionDate = new Date(competition.startDate);
    const timeDiff = competitionDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
</script>

<div class="card">
    <a href="/competitions/competition_details/{competition.id}">
    <header class="card-header">
        <div class="flex items-start justify-between">
            <h3 class="h4 flex-1 mt-2 px-4">{competition.name}</h3>
            <div class="text-right">
                <p class="text-xs opacity-75 font-medium p-4">
                    {competitionDate.toLocaleDateString(defaultLocale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </p>
                <p class="text-xs opacity-75 font-medium px-4 pb-4">
                    {#if daysUntil > 0}
                        In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                    {:else if daysUntil === 0}
                        Today
                    {:else}
                        Started {Math.abs(daysUntil)} {Math.abs(daysUntil) === 1 ? 'day' : 'days'} ago
                    {/if}
                </p>
            </div>
        </div>
    </header>

    <section class="px-4 pb-2">
        {#if competition.categories && competition.categories.length > 0}
            <div class="flex gap-4 overflow-x-auto">
                {#each competition.categories as category}
                    {#if category.entries && category.entries.length > 0}
                        {#each category.entries as entry}
                            {#if entry.users && entry.users.length > 0}
                                <div class="flex-shrink-0 text-center min-w-fit">
                                    <!-- Category Name -->
                                    <p class="text-sm font-semibold mb-2">
                                        {getCategoryTypeName(category.type)}
                                    </p>

                                    <!-- Team Members -->
                                    <div class="flex -space-x-2 justify-center">
                                        {#each entry.users as user}
                                            <Avatar
                                                name={user.name}
                                                src={user?.image ?? undefined}
                                                classes="w-8 h-8 ring-2 ring-surface-50-950 hover:scale-110 transition-transform duration-200"
                                            />
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {/if}
                {/each}
            </div>
        {:else}
            <p class="text-sm opacity-60 text-center py-4">No categories available</p>
        {/if}
    </section>
</a>
</div>
