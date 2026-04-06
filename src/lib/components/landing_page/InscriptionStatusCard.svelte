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
    import { getInscriptionStatusChipClass, getInscriptionStatusIcon } from '$lib/utils/inscription_utils';

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
                        {@const StatusIcon = category.recordStatus ? getInscriptionStatusIcon(category.recordStatus) : null}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs {getInscriptionStatusChipClass(category.recordStatus)}">
                            <CategoryIcon width="0.8rem" height="0.8rem" />
                            {getCategoryTypeName(category.type as CategoryType)}
                            {#if StatusIcon}
                                <StatusIcon width="0.8rem" height="0.8rem" />
                            {/if}
                        </span>
                    {/each}
                </div>
            </div>
        </a>
    {/each}
</div>
