<script lang="ts">
    import { Progress } from '@skeletonlabs/skeleton-svelte';
    import { getCategoryTypeName, getCategoryTypeIcon } from '$lib/utils/category_utils';
    import { getRegistrationStatusIcon, getRegistrationStatusIconColor, getRegistrationStatusLabel } from '$lib/utils/registration_utils';
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import { t } from '$lib/translations';
    import AccountGroupOutlineIcon from '@iconify-svelte/mdi/account-group-outline';

    type CategoryShape = {
        type: string;
        subname?: string | null;
        maxParties?: number | null;
        // Reserved slots: confirmed + pending entries in the category
        _count?: { entries: number };
    };

    let {
        category,
        competitionStatus,
        registrationStatus = null
    }: {
        category: CategoryShape;
        competitionStatus: string;
        registrationStatus?: string | null;
    } = $props();

    const TypeIcon = $derived(getCategoryTypeIcon(category.type as CategoryType));
    const label = $derived($t(getCategoryTypeName(category.type as CategoryType)));
    const showSubname = $derived(
        !!category.subname && category.subname !== getCategoryTypeName(category.type as CategoryType).toUpperCase()
    );

    const StatusIcon = $derived(registrationStatus ? getRegistrationStatusIcon(registrationStatus) : null);
    const statusColor = $derived(registrationStatus ? getRegistrationStatusIconColor(registrationStatus) : '');
    const statusLabel = $derived(registrationStatus ? $t(getRegistrationStatusLabel(registrationStatus)) : '');

    const count = $derived(category._count?.entries ?? 0);
    const max = $derived(category.maxParties ?? null);
    const showBar = $derived(competitionStatus === 'NOT_STARTED' && max != null && max > 0);

    // Capacity derivations (no overbooked: label clamps to max, bar value clamps to max)
    const reserved = $derived(max != null ? Math.min(count, max) : count);
    const spotsLeft = $derived(max != null ? Math.max(0, max - count) : 0);
    const rangeClass = $derived(spotsLeft <= 0 ? 'bg-error-500' : spotsLeft <= 3 ? 'bg-warning-500' : 'bg-success-500');
    const labelClass = $derived(
        spotsLeft <= 0
            ? 'text-error-700 dark:text-error-300'
            : spotsLeft <= 3
                ? 'text-warning-700 dark:text-warning-300'
                : 'text-success-700 dark:text-success-300'
    );
</script>

<div class="flex items-center gap-2 w-full">
    <!-- Left: category type + subname (truncates) -->
    <div class="flex items-center gap-1.5 min-w-0 flex-1">
        <TypeIcon width="0.9rem" height="0.9rem" class="text-primary-700 dark:text-primary-300 shrink-0" />
        <span class="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">{label}</span>
        {#if showSubname}
            <!-- Hidden on the tiniest screens (<390px) where it crowds out the type name -->
            <span class="hidden min-[390px]:block text-xs text-surface-500 dark:text-surface-400 truncate">{category.subname}</span>
        {/if}
    </div>

    <!-- Right: capacity (bar or plain count) + registration indicator -->
    <div class="flex items-center gap-1.5 shrink-0">
        {#if StatusIcon}
            <span class="shrink-0" title={statusLabel}>
                <StatusIcon width="1rem" height="1rem" class={statusColor} />
            </span>
        {/if}
        {#if showBar}
            <div class="flex items-center gap-1.5" title={$t('competition_card.capacity_title', { current: reserved, max })}>
                <!-- Bar is decorative; hidden on small screens where N/max already states capacity -->
                <Progress value={reserved} max={max} class="hidden sm:block sm:w-14">
                    <Progress.Track class="h-1.5 bg-surface-200 dark:bg-surface-700">
                        <Progress.Range class={rangeClass} />
                    </Progress.Track>
                </Progress>
                <span class="text-xs font-medium tabular-nums {labelClass}">{reserved}/{max}</span>
            </div>
        {:else}
            <span class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                <AccountGroupOutlineIcon width="0.85rem" height="0.85rem" class="shrink-0" />
                {count}
            </span>
        {/if}
    </div>
</div>
