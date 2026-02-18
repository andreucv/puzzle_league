<script lang="ts">
    import Icon from '@iconify/svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import { t } from '$lib/translations';
    import type { Category, Puzzle } from '@prisma/client';
    import Card from '$lib/components/common/card/Card.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';

    type CategoryWithPuzzles = Category & { puzzles?: Puzzle[] };
    type PartyUser = { id: string; name: string; email: string; image: string | null };

    let {
        category,
        isCreator = false,
        showRegistration = false,
        isRegistered = false,
        party = null,
        seatsAvailable = undefined
    }: {
        category: CategoryWithPuzzles;
        isCreator?: boolean;
        showRegistration?: boolean;
        isRegistered?: boolean;
        party?: PartyUser[] | null;
        seatsAvailable?: number;
    } = $props();
</script>

<Card>
    <!-- Header: Icon + Category type -->
    <CategoryCardTitle type={category.type} subname={category.subname ?? ''} />

    {#if category.description !== getCategoryTypeName(category.type).toUpperCase()}
        <p class="text-surface-600-400 text-sm">{category.description}</p>
    {/if}

    <!-- Time block -->
    <div class="flex items-center gap-2">
        <Icon icon="mdi:clock-outline" width="1rem" height="1rem" class="text-primary-500 shrink-0" />
        <span class="text-sm font-semibold">
            {formatTime(new Date(category.startTime))} – {formatTime(new Date(category.endTime))}
        </span>
    </div>

    <!-- Puzzles: public info for everyone, private details for creator -->
    {#if category.puzzles && category.puzzles.length > 0}
        <div class="flex flex-wrap gap-2">
            {#each category.puzzles as puzzle}
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:puzzle-outline" width="1rem" height="1rem" class="text-primary-500 shrink-0" />
                        <span class="text-sm font-semibold">{puzzle.pieces} pcs – {puzzle.brand}</span>
                    </div>
                    {#if isCreator}
                        <div class="text-xs text-surface-500 dark:text-surface-400 pl-6">
                            {#if puzzle.name}
                                <span class="mr-2">Name: {puzzle.name}</span>
                            {/if}
                            <span>Barcode: {puzzle.barcode}</span>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    <!-- Footer: Registration status (optional) -->
    {#if showRegistration}
        <hr class="border-t border-surface-300 dark:border-surface-600" />
        <div class="flex items-center justify-between mt-auto -mb-0.5">
            {#if isRegistered && party}
                <div class="flex items-center gap-2">
                    <div class="flex -space-x-1.5">
                        {#each party as user}
                            <Avatar
                                name={user.name}
                                src={user?.image ?? undefined}
                                classes="w-7 h-7 ring-2 ring-white dark:ring-surface-900 shadow-sm"
                            />
                        {/each}
                    </div>
                    <span class="text-xs text-surface-600 dark:text-surface-400">
                        {party.map(u => u.name).join(', ')}
                    </span>
                </div>
                <span class="badge preset-tonal-success text-xs flex items-center gap-1 shrink-0">
                    <Icon icon="mdi:check-circle" width="0.8rem" height="0.8rem" />
                    {$t('inscription.registered')}
                </span>
            {:else}
                {#if seatsAvailable !== undefined}
                    <div class="flex items-center gap-1 text-sm text-surface-500">
                        <Icon icon="mdi:account-box-plus-outline" width="1rem" height="1rem" />
                        <span>{seatsAvailable} {$t('competition_details.seats_available')}</span>
                    </div>
                {:else}
                    <div></div>
                {/if}
                <span class="badge preset-tonal-surface text-xs flex items-center gap-1">
                    <Icon icon="mdi:account-plus-outline" width="0.8rem" height="0.8rem" />
                    Open
                </span>
            {/if}
        </div>
    {/if}
</Card>
