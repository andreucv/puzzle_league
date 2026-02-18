<script lang="ts">
    import type { Competition, Category } from "@prisma/client";
    import { CldImage } from 'svelte-cloudinary';
    import Icon from '@iconify/svelte';
    import { getCategoryTypeIcon } from '$lib/utils/category_utils';

    interface Props {
        competition: Competition & {
            categories?: Category[];
        };
        userCountry?: string | null;
        userPostalCode?: string | null;
        registeredCategoryIds?: number[];
    }

    let { competition, userCountry, userPostalCode, registeredCategoryIds = [] }: Props = $props();

    // Calculate days until competition
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const competitionDate = new Date(competition.startDate);
    competitionDate.setHours(0, 0, 0, 0);
    const timeDiff = competitionDate.getTime() - today.getTime();
    const daysUntil = Math.round(timeDiff / (1000 * 3600 * 24));

    // Date parts for calendar-style display
    const dayNumber = competitionDate.getDate();
    const monthAbbr = competitionDate.toLocaleString('default', { month: 'short' });
    const year = competitionDate.getFullYear();

    // Check if competition is "near" (same country AND same postal code prefix)
    const isNearMe = $derived(
        userCountry && userPostalCode && competition.country && competition.postalCode
            ? competition.country === userCountry &&
              competition.postalCode.substring(0, 2) === userPostalCode.substring(0, 2)
            : false
    );

    // Set of registered category IDs for fast lookup
    const registeredSet = $derived(new Set(registeredCategoryIds));

    // Get unique category types with registration status
    const categoryChips = $derived(
        competition.categories
            ? [...new Map(competition.categories.map(c => [c.type, {
                type: c.type,
                registered: competition.categories!.some(
                    cat => cat.type === c.type && registeredSet.has(cat.id)
                )
            }])).values()].slice(0, 3)
            : []
    );

    // Category type display labels (abbreviated for chips)
    const categoryLabels: Record<string, string> = {
        INDIVIDUAL: 'Individual',
        PAIRS: 'Pairs',
        TEAM: 'Team',
        JUNIOR_INDIVIDUAL: 'Jr',
        JUNIOR_PAIRS: 'Jr. Pairs',
        PUZZLE_CHESS: 'Chess',
        OTHER: 'Other',
    };

    // Days until text
    const daysUntilText = $derived.by(() => {
        if (daysUntil < 0) return `${Math.abs(daysUntil)}d ago`;
        if (daysUntil === 0) return 'Today!';
        if (daysUntil === 1) return 'Tomorrow';
        return `${daysUntil}d`;
    });

    // Days until chip style
    const daysUntilChipStyle = $derived.by(() => {
        if (daysUntil < 0) return 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400';
        if (daysUntil === 0) return 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 font-bold';
        if (daysUntil <= 7) return 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300';
        if (daysUntil <= 30) return 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300';
        return 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400';
    });
</script>

<a
    href="/competitions/competition_details/{competition.id}"
    class="block group"
>
    <div class="card card-hover overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex">
            <!-- Competition Image (left) -->
            <div class="w-24 sm:w-32 flex-shrink-0 overflow-hidden">
                {#if competition.image_cld_id}
                    <CldImage
                        src={competition.image_cld_id}
                        width="128"
                        height="128"
                        alt={competition.name}
                        crop="fill"
                        gravity="auto"
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <div class="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                        <Icon icon="mdi:puzzle" class="w-10 h-10 text-surface-400 dark:text-surface-600" />
                    </div>
                {/if}
            </div>

            <!-- Info Section (center) -->
            <div class="flex-1 p-3 min-w-0">
                <!-- Name -->
                <h3 class="font-semibold text-surface-900 dark:text-surface-50 break-words group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm sm:text-base mb-1.5">
                    {competition.name}
                </h3>

                <!-- Badges row: Near You + Registration + Days countdown -->
                <div class="flex items-center gap-1.5 flex-wrap mb-2">
                    {#if isNearMe}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 rounded-full text-xs font-medium">
                            <Icon icon="mdi:map-marker-radius" class="w-3.5 h-3.5" />
                            Near you
                        </span>
                    {/if}
                    {#if competition.registrationOpen && competition.status === 'NOT_STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-full text-xs font-semibold animate-pulse">
                            <Icon icon="mdi:door-open" class="w-3.5 h-3.5" />
                            Registration Open
                        </span>
                    {:else if !competition.registrationOpen && competition.status === 'NOT_STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-300 rounded-full text-xs font-medium">
                            <Icon icon="mdi:door-closed-lock" class="w-3.5 h-3.5" />
                            Registration Closed
                        </span>
                    {:else if competition.status === 'STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 rounded-full text-xs font-medium">
                            <Icon icon="mdi:play-circle" class="w-3.5 h-3.5" />
                            Live
                        </span>
                    {:else if competition.status === 'FINISHED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400 rounded-full text-xs font-medium">
                            <Icon icon="mdi:check-all" class="w-3.5 h-3.5" />
                            Finished
                        </span>
                    {/if}
                </div>

                <!-- Category chips row -->
                {#if categoryChips.length > 0}
                    <div class="flex items-center gap-1 flex-wrap">
                        {#each categoryChips as chip (chip.type)}
                            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs {chip.registered ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 font-medium' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'}">
                                <Icon icon={getCategoryTypeIcon(chip.type)} class="w-3 h-3" />
                                {categoryLabels[chip.type] ?? chip.type}
                                {#if chip.registered}
                                    <Icon icon="mdi:check-circle" class="w-3 h-3 ml-0.5" />
                                {/if}
                            </span>
                        {/each}
                        {#if competition.categories && competition.categories.length > 3}
                            <span class="text-xs text-surface-500">+{competition.categories.length - 3}</span>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Calendar-style Date Display (right) -->
            <div class="w-20 flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-2 border-l border-surface-200 dark:border-surface-700">
                <span class="text-3xl font-bold text-primary-700 dark:text-primary-300 leading-none">{dayNumber}</span>
                <span class="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase">{monthAbbr}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{year}</span>
                <span class="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium {daysUntilChipStyle}">
                    {daysUntilText}
                </span>
            </div>
        </div>
    </div>
</a>
