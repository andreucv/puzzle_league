<script lang="ts">
    import type { Competition, Category } from "@prisma/client";
    import { CldImage } from 'svelte-cloudinary';
    import Icon from '@iconify/svelte';

    interface Props {
        competition: Competition & {
            categories?: Category[];
        };
        userCountry?: string | null;
        userPostalCode?: string | null;
    }

    let { competition, userCountry, userPostalCode }: Props = $props();

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

    // Get unique category types for display
    const categoryTypes = $derived(
        competition.categories
            ? [...new Set(competition.categories.map(c => c.type))].slice(0, 3)
            : []
    );

    // Category type display labels
    const categoryLabels: Record<string, { label: string; icon: string }> = {
        INDIVIDUAL: { label: 'Individual', icon: 'mdi:account' },
        PAIRS: { label: 'Pairs', icon: 'mdi:account-multiple' },
        TEAM: { label: 'Team', icon: 'mdi:account-group' },
        JUNIOR_INDIVIDUAL: { label: 'Jr', icon: 'mdi:account-child' },
        JUNIOR_PAIRS: { label: 'Jr. Pairs', icon: 'mdi:account-child-circle' },
        PUZZLE_CHESS: { label: 'Chess', icon: 'mdi:chess-knight' },
        OTHER: { label: 'Other', icon: 'mdi:puzzle' },
    };

    // Days until text
    const daysUntilText = $derived.by(() => {
        if (daysUntil < 0) return `${Math.abs(daysUntil)}d ago`;
        if (daysUntil === 0) return 'Today!';
        if (daysUntil === 1) return 'Tomorrow';
        return `In ${daysUntil} days`;
    });

    // Days until styling
    const daysUntilStyle = $derived.by(() => {
        if (daysUntil < 0) return 'text-surface-500';
        if (daysUntil === 0) return 'text-warning-600 dark:text-warning-400 font-bold';
        if (daysUntil <= 7) return 'text-success-600 dark:text-success-400';
        return 'text-surface-600 dark:text-surface-400';
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
                <h3 class="font-semibold text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm sm:text-base mb-1">
                    {competition.name}
                </h3>

                <!-- Location row -->
                {#if competition.location}
                    <div class="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400 mb-2">
                        <Icon icon="mdi:map-marker" class="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />
                        <span class="truncate">{competition.location}</span>
                        {#if isNearMe}
                            <span class="px-1.5 py-0.5 bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 rounded text-xs font-medium">
                                Near you
                            </span>
                        {/if}
                    </div>
                {/if}

                <!-- Category chips row -->
                {#if categoryTypes.length > 0}
                    <div class="flex items-center gap-1 flex-wrap mb-1.5">
                        {#each categoryTypes as catType (catType)}
                            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-xs text-surface-600 dark:text-surface-400">
                                <Icon icon={categoryLabels[catType]?.icon ?? 'mdi:puzzle'} class="w-3 h-3" />
                                {categoryLabels[catType]?.label ?? catType}
                            </span>
                        {/each}
                        {#if competition.categories && competition.categories.length > 3}
                            <span class="text-xs text-surface-500">+{competition.categories.length - 3}</span>
                        {/if}
                    </div>
                {/if}

                <!-- Registration indicator -->
                {#if competition.registrationOpen && competition.status === 'NOT_STARTED'}
                    <div class="flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
                        <Icon icon="mdi:check-circle" class="w-3.5 h-3.5" />
                        <span>Open</span>
                    </div>
                {:else if competition.status === 'STARTED'}
                    <div class="flex items-center gap-1 text-xs text-warning-600 dark:text-warning-400">
                        <Icon icon="mdi:play-circle" class="w-3.5 h-3.5" />
                        <span>Started</span>
                    </div>
                {:else if competition.status === 'FINISHED'}
                    <div class="flex items-center gap-1 text-xs text-surface-500">
                        <Icon icon="mdi:check-all" class="w-3.5 h-3.5" />
                        <span>Finished</span>
                    </div>
                {/if}
            </div>

            <!-- Calendar-style Date Display (right) -->
            <div class="w-20 flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-2 border-l border-surface-200 dark:border-surface-700">
                <span class="text-3xl font-bold text-primary-700 dark:text-primary-300 leading-none">{dayNumber}</span>
                <span class="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase">{monthAbbr}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{year}</span>
                <!-- Days countdown -->
                <div class="mt-1 text-xs {daysUntilStyle}">
                    {daysUntilText}
                </div>
            </div>
        </div>
    </div>
</a>
