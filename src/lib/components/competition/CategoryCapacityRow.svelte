<script lang="ts">
    import { Progress } from '@skeletonlabs/skeleton-svelte';
    import { getCategoryTypeName, getCategoryTypeIcon, getCategoryStatusVisual } from '$lib/utils/category_utils';
    import { getCapacityLevel, type CapacityLevel } from '$lib/utils/capacity';
    import type { CategoryType } from '$prisma/browser';
    import { t } from '$lib/translations';
    import AccountGroupOutlineIcon from '@iconify-svelte/mdi/account-group-outline';
    import EntryRegistrationStatusBadge from '$lib/components/registration/EntryRegistrationStatusBadge.svelte';
    import {
        formatStatusBreakdown,
        getMostUrgentStatus,
        getPresentStatuses,
        type RegistrationStatusCounts
    } from '$lib/utils/registration_utils';

    type CategoryShape = {
        type: string;
        subname?: string | null;
        status?: string | null;
        maxParties?: number | null;
        // Reserved slots: confirmed + pending entries in the category
        _count?: { entries: number };
    };

    // Maps a status color to an icon text-color class (mirrors the chip's preset colors)
    const STATUS_TEXT_COLOR: Record<string, string> = {
        warning: 'text-warning-600 dark:text-warning-400',
        success: 'text-success-600 dark:text-success-400',
        error: 'text-error-600 dark:text-error-400',
        surface: 'text-surface-500 dark:text-surface-400'
    };

    let {
        category,
        competitionStatus,
        statusCounts = null
    }: {
        category: CategoryShape;
        competitionStatus: string;
        // The current user's entries in this category, counted per RegistrationStatus
        statusCounts?: RegistrationStatusCounts | null;
    } = $props();

    const TypeIcon = $derived(getCategoryTypeIcon(category.type as CategoryType));
    const label = $derived($t(getCategoryTypeName(category.type as CategoryType)));
    const showSubname = $derived(
        !!category.subname && category.subname !== getCategoryTypeName(category.type as CategoryType).toUpperCase()
    );

    // The user's entry statuses: all of them (lifecycle order) from sm up, only the most urgent below sm
    const presentStatuses = $derived(getPresentStatuses(statusCounts));
    const mostUrgentStatus = $derived(getMostUrgentStatus(statusCounts));
    const entriesLabel = $derived(
        statusCounts ? $t('competition_card.your_entries', { breakdown: formatStatusBreakdown(statusCounts, $t) }) : ''
    );

    // Capacity count stays neutral: the status markers carry the user's own registration
    const countColorClass = 'text-primary-700 dark:text-primary-300';

    // Leading category-status icon, shown only once the competition is live (STARTED)
    const showCategoryStatus = $derived(competitionStatus === 'STARTED' && !!category.status);
    const categoryStatusVisual = $derived(category.status ? getCategoryStatusVisual(category.status) : null);

    const count = $derived(category._count?.entries ?? 0);
    const max = $derived(category.maxParties ?? null);
    const showBar = $derived(competitionStatus === 'NOT_STARTED' && max != null && max > 0);

    // Capacity derivations (no overbooked: label clamps to max, bar value clamps to max)
    const reserved = $derived(max != null ? Math.min(count, max) : count);
    const CAPACITY_RANGE_CLASS: Record<CapacityLevel, string> = {
        full: 'bg-error-500',
        low: 'bg-warning-500',
        available: 'bg-success-500'
    };
    const rangeClass = $derived(CAPACITY_RANGE_CLASS[max != null ? getCapacityLevel(count, max) : 'available']);
</script>

<div class="flex items-center gap-2 w-full">
    <!-- Left: category status (live only) + category type + subname (truncates) -->
    <div class="flex items-center gap-1.5 min-w-0 flex-1">
        {#if showCategoryStatus && categoryStatusVisual}
            <span class="shrink-0" title={$t(categoryStatusVisual.labelKey)}>
                <categoryStatusVisual.icon width="0.95rem" height="0.95rem" class={STATUS_TEXT_COLOR[categoryStatusVisual.color]} />
            </span>
        {/if}
        <TypeIcon width="0.9rem" height="0.9rem" class="text-primary-700 dark:text-primary-300 shrink-0" />
        <span class="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">{label}</span>
        {#if showSubname}
            <!-- Hidden on the tiniest screens (<390px) where it crowds out the type name -->
            <span class="hidden min-[390px]:block text-xs text-surface-500 dark:text-surface-400 truncate">{category.subname}</span>
        {/if}
    </div>

    <!-- Right: the user's entry statuses, then capacity (bar or plain count) -->
    <div class="flex items-center gap-1.5 shrink-0">
        {#if statusCounts && mostUrgentStatus}
            <span role="img" class="flex items-center" title={entriesLabel} aria-label={entriesLabel} data-testid="user-entry-status">
                <span class="hidden sm:inline-flex items-center gap-1" data-testid="user-entry-status-full">
                    {#each presentStatuses as status (status)}
                        <EntryRegistrationStatusBadge {status} compact count={statusCounts[status]} />
                    {/each}
                </span>
                <span class="inline-flex sm:hidden" data-testid="user-entry-status-mobile">
                    <EntryRegistrationStatusBadge status={mostUrgentStatus} compact count={statusCounts[mostUrgentStatus]} />
                </span>
            </span>
        {/if}
        {#if showBar}
            <div class="flex items-center gap-1.5" title={$t('competition_card.capacity_title', { current: reserved, max })}>
                <!-- Bar is decorative; hidden on small screens where N/max already states capacity -->
                <Progress value={reserved} max={max ?? undefined} class="hidden sm:block sm:w-14">
                    <Progress.Track class="h-1.5 bg-surface-200 dark:bg-surface-700">
                        <Progress.Range class={rangeClass} />
                    </Progress.Track>
                </Progress>
                <span class="text-xs font-medium tabular-nums {countColorClass}">{reserved}/{max}</span>
            </div>
        {:else}
            <span class="flex items-center gap-1 text-xs {countColorClass}">
                <AccountGroupOutlineIcon width="0.85rem" height="0.85rem" class="shrink-0" />
                {count}
            </span>
        {/if}
    </div>
</div>
