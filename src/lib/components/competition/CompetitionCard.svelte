<script lang="ts">
    import type { Competition } from "@prisma/client";
    import { CldImage } from 'svelte-cloudinary';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import MapMarkerRadiusIcon from '@iconify-svelte/mdi/map-marker-radius';
    import CalendarClockIcon from '@iconify-svelte/mdi/calendar-clock';
    import PlayCircleIcon from '@iconify-svelte/mdi/play-circle';
    import CheckAllIcon from '@iconify-svelte/mdi/check-all';
    import DoorOpenIcon from '@iconify-svelte/mdi/door-open';
    import DoorClosedLockIcon from '@iconify-svelte/mdi/door-closed-lock';
    import CategoryRegistrationChip from '$lib/components/category/CategoryRegistrationChip.svelte';

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

    // Get the inscription status for the current user in a category
    function getUserRegistrationStatus(category: any): string | null {
        if (!currentUserId || !category.records) return null;
        const record = category.records.find((r: any) =>
            r.users?.some((u: any) => u.id === currentUserId)
        );
        return record?.status ?? null;
    }

    // Check if user is registered in any category of this competition
    const isUserRegistered = $derived(
        competition.categories?.some((c: any) => isUserInCategory(c)) ?? false
    );

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
                            Near you
                        </span>
                    {/if}
                    {#if competition.status === 'NOT_STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-full text-xs font-medium">
                            <CalendarClockIcon width="1rem" height="1rem" class="text-primary-700 dark:text-primary-300" />
                            Upcoming
                        </span>
                    {:else if competition.status === 'STARTED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 rounded-full text-xs font-medium">
                            <PlayCircleIcon width="1rem" height="1rem" class="text-warning-700 dark:text-warning-300" />
                            Live
                        </span>
                    {:else if competition.status === 'FINISHED'}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400 rounded-full text-xs font-medium">
                            <CheckAllIcon width="1rem" height="1rem" class="text-surface-500 dark:text-surface-400" />
                            Finished
                        </span>
                    {/if}
                </div>

                <!-- Registration status (only when user is not registered) -->
                {#if !isUserRegistered && competition.status === 'NOT_STARTED'}
                    <div class="flex items-center gap-1.5 flex-wrap mb-2">
                        {#if competition.registrationOpen}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 rounded-full text-xs font-semibold animate-pulse">
                                <DoorOpenIcon width="1rem" height="1rem" class="text-success-700 dark:text-success-300" />
                                Registration Open
                            </span>
                        {:else}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-300 rounded-full text-xs font-medium">
                                <DoorClosedLockIcon width="1rem" height="1rem"/>
                                Registration Closed
                            </span>
                        {/if}
                    </div>
                {/if}

                <!-- Category chips showing user registration -->
                {#if competition.categories && competition.categories.length > 0 && !noShowCategories}
                    <div class="flex items-center gap-1.5 flex-wrap">
                        {#each competition.categories as category (category.id)}
                            {@const registered = isUserInCategory(category)}
                            {@const status = getUserRegistrationStatus(category)}
                            <CategoryRegistrationChip categoryType={category.type} registrationStatus={registered ? status : null} />
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

