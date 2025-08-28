<script lang="ts">
    import type { Competition } from "@prisma/client";
    import { defaultLocale } from '$lib/translations';
    import Icon from '@iconify/svelte';
    import CompetitionCategoryLabel from "./CompetitionCategoryLabel.svelte";

    interface Props {
        competition: Competition & {
            categories?: Array<{
                id: string;
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
            location?: string;
        };
        currentUserId?: string;
    }

    let { competition, currentUserId, noShowCategories = false}: Props = $props();

    console.log("components/competition/CompetitionsCard.svelte prop competition", competition);

    // Calculate days until competition
    const today = new Date();
    const competitionDate = new Date(competition.startDate);
    const timeDiff = competitionDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
</script>

<div class="group card card-hover overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
    <!-- Subtle background gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-secondary-50/15 dark:from-primary-950/15 dark:via-transparent dark:to-secondary-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    <a href="/competitions/competition_details/{competition.id}" class="block relative z-10">
        <!-- Enhanced Header -->
        <header class="card-header relative overflow-hidden">
            <!-- Animated background pattern -->
            <div class="absolute inset-0 bg-gradient-to-r from-primary-500/3 via-secondary-500/2 to-tertiary-500/3 opacity-60"></div>
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_var(--color-primary-500)_0%,_transparent_25%)] opacity-3"></div>

            <div class="relative flex items-start justify-between p-2">
                <div class="flex-1 space-y-2 p-2">
                    <h3 class="text-lg font-bold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 leading-tight">
                        {competition.name}
                    </h3>

                    {#if competition.location}
                        <div class="flex items-center gap-2">
                            <div class="flex items-center justify-center w-5 h-5 bg-surface-200/50 dark:bg-surface-700/50 rounded-full backdrop-blur-sm">
                                <Icon icon="mdi:map-marker" class="w-3 h-3 text-primary-600 dark:text-primary-400" />
                            </div>
                            <p class="text-ls text-surface-700 dark:text-surface-300 font-medium">{competition.location}</p>
                        </div>
                    {/if}
                </div>

                <!-- Enhanced date display -->
                <div class="text-right">
                    <div class="relative p-2 bg-white/60 dark:bg-black/25 rounded-lg backdrop-blur-md border border-surface-200/40 dark:border-surface-700/40 shadow-sm">
                        <!-- Date -->
                        <p class="text-xs font-bold text-surface-900 dark:text-surface-50 mb-1 leading-tight">
                            {competitionDate.toLocaleDateString(defaultLocale, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>

                        <!-- Days countdown with enhanced styling -->
                        <div class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                            {daysUntil > 0
                                ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 dark:from-success-900/50 dark:to-success-800/50 dark:text-success-200'
                                : daysUntil === 0
                                    ? 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800 dark:from-warning-900/50 dark:to-warning-800/50 dark:text-warning-200'
                                    : 'bg-gradient-to-r from-surface-100 to-surface-200 text-surface-700 dark:from-surface-800/50 dark:to-surface-700/50 dark:text-surface-300'
                            }">
                            {#if daysUntil > 0}
                                <Icon icon="mdi:clock-outline" class="w-2.5 h-2.5 mr-1" />
                                In {daysUntil}d
                            {:else if daysUntil === 0}
                                <Icon icon="mdi:calendar-today" class="w-2.5 h-2.5 mr-1" />
                                Today!
                            {:else}
                                <Icon icon="mdi:calendar-check" class="w-2.5 h-2.5 mr-1" />
                                {Math.abs(daysUntil)}d ago
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Enhanced Content Section -->
        <section class="px-2 pb-2 space-y-3 relative">
            {#if competition.categories && competition.categories.length > 0 && !noShowCategories}

                <!-- Enhanced categories grid without scroll -->
                <div class="space-y-2">
                    {#each competition.categories as category}
                        <CompetitionCategoryLabel {category} {currentUserId} />
                    {/each}
                </div>
            {:else if !competition.categories && competition.status === 'COMPLETED' || competition.status === 'CANCELLED' || noShowCategories }
                <span></span>
            {:else}
                <!-- Enhanced empty state -->
                <div class="flex justify-center items-center text-center">
                    <div class="space-y-1 my-2">
                        <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">No Categories</p>
                        <p class="text-xs text-surface-500">Categories not set up yet</p>
                    </div>
                </div>
            {/if}
        </section>

        <!-- Enhanced bottom accent with animation -->
        <div class="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500/20 via-secondary-500/30 to-tertiary-500/20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-x-0 group-hover:scale-x-100"></div>
    </a>
</div>

