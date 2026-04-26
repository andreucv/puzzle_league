<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import { t } from '$lib/translations';
    import type { Category, Puzzle } from '$lib/.prisma/generated/prisma/browser';
    import Card from '$lib/components/common/card/Card.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import CategoryStatusChip from '$lib/components/category/CategoryStatusChip.svelte';

    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import CurrencyEurIcon from '@iconify-svelte/mdi/currency-eur';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import AccountPlusOutlineIcon from '@iconify-svelte/mdi/account-plus-outline';
    import AccountBoxPlusOutlineIcon from '@iconify-svelte/mdi/account-box-plus-outline';
    import FormatListBulletedIcon from '@iconify-svelte/mdi/format-list-bulleted';
    import { getInscriptionStatusTonalClass, getInscriptionStatusIcon, getInscriptionStatusLabel } from '$lib/utils/inscription_utils';

    type CategoryWithPuzzles = Category & { puzzles?: Puzzle[] };
    type PartyUser = { id: string; name: string; email: string; image: string | null };
    type UserIntentInfo = { id: string; name: string; claimedById: string | null };
    type UserRecord = { id?: string; status?: string; users?: PartyUser[]; userIntents?: UserIntentInfo[] };

    let {
        category,
        isCreator = false,
        isMultiDay = false,
        showRegistration = false,
        records = [],
        inscriptionStatus = undefined,
        party = null,
        userIntents = null,
        seatsAvailable = undefined
    }: {
        category: CategoryWithPuzzles;
        isCreator?: boolean;
        isMultiDay?: boolean;
        showRegistration?: boolean;
        records?: UserRecord[];
        inscriptionStatus?: string;
        party?: PartyUser[] | null;
        userIntents?: UserIntentInfo[] | null;
        seatsAvailable?: number;
    } = $props();

    const normalizedRecords = $derived(
        records.length > 0
            ? records
            : [{ status: inscriptionStatus, users: party ?? [], userIntents: userIntents ?? [] }]
    );
</script>

<Card>
    <!-- Header: Icon + Category type + Status badge -->
    <div class="flex items-center justify-between gap-2">
        <CategoryCardTitle type={category.type} subname={category.subname ?? ''} />
        <CategoryStatusChip category_status={category.status}/>
    </div>

    {#if category.description !== getCategoryTypeName(category.type).toUpperCase()}
        <p class="text-surface-600-400 text-sm">{category.description}</p>
    {/if}

    <!-- Time block -->
    <div class="flex items-center gap-2">
        <ClockOutlineIcon width="1rem" height="1rem" class="text-primary-500 shrink-0" />
        <span class="text-sm font-semibold">
            {#if isMultiDay}
                {new Date(category.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},
            {/if}
            {formatTime(new Date(category.startTime))} –
            {#if isMultiDay}
                {new Date(category.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},
            {/if}
            {formatTime(new Date(category.endTime))}
        </span>
    </div>

    <!-- Price -->
    <div class="flex items-center gap-2">
        <CurrencyEurIcon width="1rem" height="1rem" class="text-primary-500 shrink-0" />
        <span class="text-sm font-semibold">{category.price} €</span>
    </div>

    <!-- Puzzles: public info for everyone, private details for creator -->
    {#if category.puzzles && category.puzzles.length > 0}
        <div class="flex flex-wrap gap-2">
            {#each category.puzzles as puzzle}
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <PuzzleOutlineIcon width="1rem" height="1rem" class="text-primary-500 shrink-0" />
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
        {#if category.status === 'COMPLETE'}
            <a
                href="/competitions/competition_details/{category.competitionId}/results#category-{category.id}"
                class="btn btn-sm preset-tonal-primary gap-1.5 w-full"
            >
                <FormatListBulletedIcon width="1rem" height="1rem" />
                {$t('during_competition.view_results')}
            </a>
        {:else if category.status === 'LIVE' || category.status === 'STOPPED'}
            <!-- Inscription summary (non-clickable) + results link for running categories -->
            {#if normalizedRecords.some((record) => (record.users?.length ?? 0) > 0 || (record.userIntents?.length ?? 0) > 0)}
                <div class="flex flex-col gap-2 overflow-hidden">
                    {#each normalizedRecords as record, index (record.id ?? `${category.id}-${index}`)}
                        {@const recordUsers = record.users ?? []}
                        {@const recordIntents = record.userIntents ?? []}
                        {@const StatusIcon = getInscriptionStatusIcon(record.status)}
                        {#if recordUsers.length > 0 || recordIntents.length > 0}
                            <div class="flex items-center gap-2 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-800/60 px-2 py-1 overflow-hidden">
                                <div class="flex items-center gap-2 min-w-0 flex-1">
                                    <div class="flex -space-x-1.5 shrink-0">
                                        {#each recordUsers as user}
                                            <Avatar class="w-7 h-7 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-sm">
                                                <Avatar.Image src={user?.image ?? undefined} alt={user.name ?? 'User'} />
                                                <Avatar.Fallback>{user.name?.substring(0,2) ?? 'U'}</Avatar.Fallback>
                                            </Avatar>
                                        {/each}
                                        {#each recordIntents as intent}
                                            <Avatar class="w-7 h-7 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-sm bg-primary-100 dark:bg-primary-900/40">
                                                <Avatar.Fallback>{intent.name.substring(0,2)}</Avatar.Fallback>
                                            </Avatar>
                                        {/each}
                                    </div>
                                    <span class="text-xs text-surface-600 dark:text-surface-400 truncate">
                                        {[...recordUsers.map(u => u.name), ...recordIntents.map(i => i.name)].join(', ')}
                                    </span>
                                </div>
                                <span class={`badge text-xs flex items-center gap-1 shrink-0 ${getInscriptionStatusTonalClass(record.status)}`} data-testid="category-status-badge">
                                    <StatusIcon width="0.8rem" height="0.8rem" />
                                    {getInscriptionStatusLabel(record.status, $t) || 'Open'}
                                </span>
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
            <a
                href="/competitions/competition_details/{category.competitionId}/results#category-{category.id}"
                class="btn btn-sm preset-tonal-primary gap-1.5 w-full"
            >
                {#if category.status === 'LIVE'}
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                {/if}
                <FormatListBulletedIcon width="1rem" height="1rem" />
                {$t('competition_details.view_live_results')}
            </a>
        {:else}
        <a href="/competitions/competition_details/{category.competitionId}/inscription" class="block mt-auto -mb-0.5 hover:opacity-80 transition-opacity overflow-hidden">
            {#if normalizedRecords.some((record) => (record.users?.length ?? 0) > 0 || (record.userIntents?.length ?? 0) > 0)}
                <div class="flex flex-col gap-2 overflow-hidden">
                    {#each normalizedRecords as record, index (record.id ?? `${category.id}-${index}`)}
                        {@const recordUsers = record.users ?? []}
                        {@const recordIntents = record.userIntents ?? []}
                        {@const StatusIcon = getInscriptionStatusIcon(record.status)}
                        {#if recordUsers.length > 0 || recordIntents.length > 0}
                            <div class="flex items-center gap-2 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-800/60 px-2 py-1 overflow-hidden">
                                <div class="flex items-center gap-2 min-w-0 flex-1">
                                    <div class="flex -space-x-1.5 shrink-0">
                                        {#each recordUsers as user}
                                            <Avatar class="w-7 h-7 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-sm">
                                                <Avatar.Image src={user?.image ?? undefined} alt={user.name ?? 'User'} />
                                                <Avatar.Fallback>{user.name?.substring(0,2) ?? 'U'}</Avatar.Fallback>
                                            </Avatar>
                                        {/each}
                                        {#each recordIntents as intent}
                                            <Avatar class="w-7 h-7 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-sm bg-primary-100 dark:bg-primary-900/40">
                                                <Avatar.Fallback>{intent.name.substring(0,2)}</Avatar.Fallback>
                                            </Avatar>
                                        {/each}
                                    </div>
                                    <span class="text-xs text-surface-600 dark:text-surface-400 truncate">
                                        {[...recordUsers.map(u => u.name), ...recordIntents.map(i => i.name)].join(', ')}
                                    </span>
                                </div>
                                <span class={`badge text-xs flex items-center gap-1 shrink-0 ${getInscriptionStatusTonalClass(record.status)}`} data-testid="category-status-badge">
                                    <StatusIcon width="0.8rem" height="0.8rem" />
                                    {getInscriptionStatusLabel(record.status, $t) || 'Open'}
                                </span>
                            </div>
                        {/if}
                    {/each}
                </div>
            {:else}
                <div class="flex items-center justify-between gap-2 overflow-hidden">
                    {#if seatsAvailable !== undefined}
                        {#if seatsAvailable <= 0}
                            <span class="badge preset-tonal-error text-xs flex items-center gap-1">
                                <AccountBoxPlusOutlineIcon width="0.8rem" height="0.8rem" />
                                {$t('competition_details.full')}
                            </span>
                        {:else if seatsAvailable <= 3}
                            <span class="badge preset-tonal-warning text-xs flex items-center gap-1">
                                <AccountBoxPlusOutlineIcon width="0.8rem" height="0.8rem" />
                                {seatsAvailable} {$t('competition_details.spots_left')}
                            </span>
                        {:else}
                            <span class="badge preset-tonal-success text-xs flex items-center gap-1">
                                <AccountBoxPlusOutlineIcon width="0.8rem" height="0.8rem" />
                                {seatsAvailable} {$t('competition_details.spots_left')}
                            </span>
                        {/if}
                    {:else}
                        <div></div>
                    {/if}
                    <span class="badge preset-tonal-surface text-xs flex items-center gap-1 shrink-0">
                        <AccountPlusOutlineIcon width="0.8rem" height="0.8rem" />
                        Open
                    </span>
                </div>
            {/if}
        </a>
        {/if}
    {/if}
</Card>
