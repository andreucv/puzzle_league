<script lang="ts">
    import type { Competition } from "$prisma/browser";
    import { cldUrl } from '$lib/utils/cld_url';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import MapMarkerRadiusIcon from '@iconify-svelte/mdi/map-marker-radius';
    import DoorOpenIcon from '@iconify-svelte/mdi/door-open';
    import DoorClosedLockIcon from '@iconify-svelte/mdi/door-closed-lock';
    import TableChairIcon from '@iconify-svelte/mdi/table-chair';
    import CategoryCapacityRow from '$lib/components/competition/CategoryCapacityRow.svelte';
    import CompetitionStatusChip from '$lib/components/competition/CompetitionStatusChip.svelte';
    import { t, locale } from '$lib/translations';

    interface Props {
        competition: Competition & {
            categories?: Array<{
                id: number;
                type: string;
                subname?: string | null;
                startTime: Date;
                endTime: Date;
                maxParties?: number | null;
                entries?: Array<{
                    status?: string;
                    tableNumber?: number | null;
                    users?: Array<{
                        id: string;
                        name: string;
                        image?: string | null;
                    }>;
                }>;
                // Reserved slots: confirmed + pending entries in the category
                _count?: { entries: number };
            }>;
            location?: string | null;
        };
        currentUserId?: string;
        noShowCategories?: boolean;
        userCountry?: string | null;
        userPostalCode?: string | null;
    }

    let { competition, currentUserId, noShowCategories = false, userCountry, userPostalCode }: Props = $props();

    // Check if competition is "near" (same country AND same postal code prefix)
    const isNearMe = $derived(
        userCountry && userPostalCode && competition.country && competition.postalCode
            ? competition.country === userCountry &&
              competition.postalCode.substring(0, 2) === userPostalCode.substring(0, 2)
            : false
    );

    // Calculate days until competition
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // svelte-ignore state_referenced_locally
    const competitionDate = new Date(competition.startDate);
    competitionDate.setHours(0, 0, 0, 0);
    const timeDiff = competitionDate.getTime() - today.getTime();
    const daysUntil = Math.round(timeDiff / (1000 * 3600 * 24));

    // Date parts for calendar-style display
    const dayNumber = competitionDate.getDate();
    const monthAbbr = competitionDate.toLocaleString(locale.get(), { month: 'short' });
    const year = competitionDate.getFullYear();

    // Check if current user is registered in a category
    function isUserInCategory(category: any): boolean {
        if (!currentUserId || !category.entries) return false;
        return category.entries.some((entry: any) =>
            entry.users?.some((user: any) => user.id === currentUserId)
        );
    }

    // Get the registration status for the current user in a category
    function getUserRegistrationStatus(category: any): string | null {
        if (!currentUserId || !category.entries) return null;
        const entry = category.entries.find((r: any) =>
            r.users?.some((u: any) => u.id === currentUserId)
        );
        return entry?.status ?? null;
    }

    // Check if user is registered in any category of this competition
    const isUserRegistered = $derived(
        competition.categories?.some((c: any) => isUserInCategory(c)) ?? false
    );

    // Table number assigned to the current user's entry (when available)
    const userTableNumber = $derived.by(() => {
        if (!currentUserId || !competition.categories) return null;
        for (const category of competition.categories) {
            const entry = category.entries?.find((e: any) =>
                e.users?.some((u: any) => u.id === currentUserId)
            );
            if (entry?.tableNumber != null) return entry.tableNumber;
        }
        return null;
    });

    // Days until text
    const daysUntilText = $derived.by(() => {
        if (daysUntil < 0) return $t('competition_card.days_ago', { count: Math.abs(daysUntil) });
        if (daysUntil === 0) return $t('competition_card.today');
        if (daysUntil === 1) return $t('competition_card.tomorrow');
        return $t('competition_card.in_until_days', { count: daysUntil });
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

<a href="/competitions/competition_details/{competition.id}" class="block group" data-testid="competition-card-{competition.id}">
    <div class="card card-hover overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        <div class="flex">
            <!-- Competition Image (left) -->
            <div class="w-20 sm:w-32 md:w-36 flex-shrink-0 overflow-hidden">
                {#if competition.image_cld_id}
                    <img
                        src={cldUrl(competition.image_cld_id, { width: 144, height: 180, crop: 'fill', gravity: 'auto' })}
                        width="144"
                        height="180"
                        alt={competition.name}
                        loading="lazy"
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <div class="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                        <PuzzleOutlineIcon class="w-12 h-12 text-surface-400 dark:text-surface-600" />
                    </div>
                {/if}
            </div>

            <!-- Info Section (center) -->
            <div class="flex-1 p-3 min-w-0 flex flex-col justify-between">
                <!-- Name -->
                <h3 class="font-bold text-surface-900 dark:text-surface-50 break-words group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-base sm:text-lg leading-tight mb-2">
                    {competition.name}
                </h3>

                <!-- Competition status -->
                <div class="flex items-center gap-1.5 flex-wrap mb-2">
                    {#if isNearMe}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 rounded-full text-xs font-medium">
                            <MapMarkerRadiusIcon width="1rem" height="1rem" class="text-success-700 dark:text-success-300" />
                            {$t('competition_card.near_you')}
                        </span>
                    {/if}
                    <CompetitionStatusChip competition_status={competition.status} />
                    <!-- We do not show userTableNumber here, because they can have more than one number in different categories, so it is missleading -->
                </div>

                <!-- Registration status (only when user is not registered) -->
                {#if !isUserRegistered && competition.status === 'NOT_STARTED'}
                    <div class="flex items-center gap-1.5 flex-wrap mb-2">
                        {#if competition.registrationOpen}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 rounded-full text-xs font-semibold animate-pulse">
                                <DoorOpenIcon width="1rem" height="1rem" class="text-success-700 dark:text-success-300" />
                                {$t('landing_page.registration_status.registration_open')}
                            </span>
                        {:else}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-300 rounded-full text-xs font-medium">
                                <DoorClosedLockIcon width="1rem" height="1rem"/>
                                {$t('landing_page.registration_status.registration_closed')}
                            </span>
                        {/if}
                    </div>
                {/if}

                <!-- Per-category capacity rows (capped at 2, then "+N more") -->
                {#if competition.categories && competition.categories.length > 0 && !noShowCategories}
                    {@const visibleCategories = competition.categories.slice(0, 2)}
                    {@const extraCategories = competition.categories.length - visibleCategories.length}
                    <div class="flex flex-col gap-1">
                        {#each visibleCategories as category (category.id)}
                            <CategoryCapacityRow
                                {category}
                                competitionStatus={competition.status}
                                registrationStatus={getUserRegistrationStatus(category)}
                            />
                        {/each}
                        {#if extraCategories > 0}
                            <span class="text-xs text-surface-500 dark:text-surface-400 pl-[1.4rem]">
                                {$t('competition_card.more_categories', { count: extraCategories })} ›
                            </span>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Calendar-style Date Display (right) -->
            <div class="w-16 sm:w-20 md:w-24 flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-2 border-l border-surface-200 dark:border-surface-700">
                <span class="text-2xl sm:text-4xl font-bold text-primary-700 dark:text-primary-300 leading-none">{dayNumber}</span>
                <span class="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase">{monthAbbr}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{year}</span>
                <!-- Relative-time chip: hidden on mobile (date above already conveys timing); shown at sm+ -->
                <span class="mt-1.5 hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold {daysUntilChipStyle}">
                    {daysUntilText}
                </span>
            </div>
        </div>
    </div>
</a>

