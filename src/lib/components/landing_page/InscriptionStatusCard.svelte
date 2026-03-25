<script lang="ts">
    import { t } from '$lib/translations';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import LockOpenIcon from '@iconify-svelte/mdi/lock-open-variant-outline';
    import LockIcon from '@iconify-svelte/mdi/lock-outline';
    import PlayCircleIcon from '@iconify-svelte/mdi/play-circle-outline';
    import AccountIcon from '@iconify-svelte/mdi/account';
    import AccountMultipleIcon from '@iconify-svelte/mdi/account-multiple';
    import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
    import AccountChildIcon from '@iconify-svelte/mdi/account-child';
    import ChessKnightIcon from '@iconify-svelte/mdi/chess-knight';
    import ShapeIcon from '@iconify-svelte/mdi/shape';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import ClockAlertOutlineIcon from '@iconify-svelte/mdi/clock-alert-outline';

    const categoryTypeIcons: Record<string, typeof ShapeIcon> = {
        INDIVIDUAL: AccountIcon,
        PAIRS: AccountMultipleIcon,
        TEAM: AccountGroupIcon,
        JUNIOR_INDIVIDUAL: AccountChildIcon,
        JUNIOR_PAIRS: AccountChildIcon,
        PUZZLE_CHESS: ChessKnightIcon,
        OTHER: ShapeIcon,
    };

    interface CategoryEntry {
        type: string;
        recordStatus: string | null;
    }

    interface CompetitionEntry {
        id: number;
        name: string;
        startDate: Date;
        registrationOpen: boolean;
        status: string;
        categories: CategoryEntry[];
    }

    let { inscriptions }: { inscriptions: CompetitionEntry[] } = $props();

    function chipClass(status: string | null): string {
        if (status === 'ACCEPTED') return 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 font-semibold';
        if (status === 'PENDING') return 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 font-semibold';
        if (status === 'WAITLISTED') return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/50 dark:text-secondary-300 font-semibold';
        return 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400';
    }

    function formatDate(date: Date): string {
        return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
</script>

<div class="space-y-2">
    {#each inscriptions as competition (competition.id)}
        <a href="/competitions/competition_details/{competition.id}" class="block hover:opacity-90 transition-opacity">
            <div class="card p-3 min-w-0">
                <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-medium truncate">{competition.name}</p>
                    <div class="flex items-center gap-2 shrink-0">
                        {#if competition.status === 'STARTED'}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 rounded-full text-xs font-medium">
                                <PlayCircleIcon width="0.85rem" height="0.85rem" />
                                Live
                            </span>
                        {:else}
                            <span class="text-xs opacity-50">{formatDate(competition.startDate)}</span>
                        {/if}
                        {#if competition.registrationOpen}
                            <span class="text-success-500" title={$t('landing_page.inscription_status.registration_open')}>
                                <LockOpenIcon width="1rem" height="1rem" />
                            </span>
                        {:else}
                            <span class="text-error-500" title={$t('landing_page.inscription_status.registration_closed')}>
                                <LockIcon width="1rem" height="1rem" />
                            </span>
                        {/if}
                    </div>
                </div>
                <div class="flex flex-wrap gap-1 mt-1.5">
                    {#each competition.categories as category}
                        {@const CategoryIcon = categoryTypeIcons[category.type] ?? ShapeIcon}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs {chipClass(category.recordStatus)}">
                            <CategoryIcon width="0.8rem" height="0.8rem" />
                            {getCategoryTypeName(category.type as CategoryType)}
                            {#if category.recordStatus === 'ACCEPTED'}
                                <CheckCircleIcon width="0.8rem" height="0.8rem" class="text-success-600 dark:text-success-400" />
                            {:else if category.recordStatus === 'PENDING'}
                                <ClockOutlineIcon width="0.8rem" height="0.8rem" class="text-warning-600 dark:text-warning-400" />
                            {:else if category.recordStatus === 'WAITLISTED'}
                                <ClockAlertOutlineIcon width="0.8rem" height="0.8rem" class="text-secondary-600 dark:text-secondary-400" />
                            {/if}
                        </span>
                    {/each}
                </div>
            </div>
        </a>
    {/each}
</div>
