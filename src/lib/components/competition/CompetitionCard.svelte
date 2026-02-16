<script lang="ts">
    import type { Competition } from "@prisma/client";
    import { CldImage } from 'svelte-cloudinary';
    import Icon from '@iconify/svelte';
    import { getCategoryTypeName } from "$lib/utils/category_utils";

    interface Props {
        competition: Competition & {
            categories?: Array<{
                id: number;
                type: string;
                startTime: Date;
                endTime: Date;
                records?: Array<{
                    users?: Array<{
                        id: string;
                        name: string;
                        image?: string | null;
                    }>;
                }>;
            }>;
            location?: string | null;
        };
        currentUserId?: string;
        noShowCategories?: boolean;
    }

    let { competition, currentUserId, noShowCategories = false }: Props = $props();

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

    // Check if current user is registered in a category
    function isUserInCategory(category: any): boolean {
        if (!currentUserId || !category.records) return false;
        return category.records.some((record: any) =>
            record.users?.some((user: any) => user.id === currentUserId)
        );
    }

    // Category type icons
    const categoryIcons: Record<string, string> = {
        INDIVIDUAL: 'mdi:account',
        PAIRS: 'mdi:account-multiple',
        TEAM: 'mdi:account-group',
        JUNIOR_INDIVIDUAL: 'mdi:account-child',
        JUNIOR_PAIRS: 'mdi:account-child-circle',
        PUZZLE_CHESS: 'mdi:chess-knight',
        OTHER: 'mdi:puzzle',
    };

    // Days until text
    const daysUntilText = $derived.by(() => {
        if (daysUntil < 0) return `${Math.abs(daysUntil)}d ago`;
        if (daysUntil === 0) return 'Today!';
        if (daysUntil === 1) return 'Tomorrow';
        return `In ${daysUntil}d`;
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

<a href="/competitions/competition_details/{competition.id}" class="block group">
    <div class="card card-hover overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        <div class="flex">
            <!-- Competition Image (left) -->
            <div class="w-28 sm:w-36 flex-shrink-0 overflow-hidden">
                {#if competition.image_cld_id}
                    <CldImage
                        src={competition.image_cld_id}
                        width="144"
                        height="180"
                        alt={competition.name}
                        crop="fill"
                        gravity="auto"
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <div class="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                        <Icon icon="mdi:puzzle" class="w-12 h-12 text-surface-400 dark:text-surface-600" />
                    </div>
                {/if}
            </div>

            <!-- Info Section (center) -->
            <div class="flex-1 p-3 min-w-0 flex flex-col justify-between">
                <!-- Name -->
                <h3 class="font-bold text-surface-900 dark:text-surface-50 break-words group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-base sm:text-lg leading-tight mb-2">
                    {competition.name}
                </h3>

                <!-- Status badge -->
                <div class="flex items-center gap-1.5 flex-wrap mb-2">
                    {#if competition.registrationOpen && competition.status === 'NOT_STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-full text-xs font-semibold animate-pulse">
                            <Icon icon="mdi:door-open" class="w-3.5 h-3.5" />
                            Registration Open
                        </span>
                    {:else if !competition.registrationOpen && competition.status === 'NOT_STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-300 rounded-full text-xs font-medium">
                            <Icon icon="mdi:door-closed-lock" class="w-3.5 h-3.5" />
                            Closed
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

                <!-- Category chips showing user registration -->
                {#if competition.categories && competition.categories.length > 0 && !noShowCategories}
                    <div class="flex items-center gap-1.5 flex-wrap">
                        {#each competition.categories as category (category.id)}
                            {@const registered = isUserInCategory(category)}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                                {registered
                                    ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 font-semibold'
                                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'}">
                                <Icon icon={categoryIcons[category.type] ?? 'mdi:puzzle'} class="w-3.5 h-3.5" />
                                {getCategoryTypeName(category.type as any)}
                                {#if registered}
                                    <Icon icon="mdi:check-circle" class="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
                                {/if}
                            </span>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Calendar-style Date Display (right) -->
            <div class="w-22 sm:w-24 flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-2 border-l border-surface-200 dark:border-surface-700">
                <span class="text-3xl sm:text-4xl font-bold text-primary-700 dark:text-primary-300 leading-none">{dayNumber}</span>
                <span class="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase">{monthAbbr}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{year}</span>
                <span class="mt-1.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold {daysUntilChipStyle}">
                    {daysUntilText}
                </span>
            </div>
        </div>
    </div>
</a>

