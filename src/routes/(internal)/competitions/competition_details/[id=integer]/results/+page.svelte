<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import { CldImage } from 'svelte-cloudinary';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    import { formatElapsedTime, formatTimeDelta } from '$lib/utils/category_utils';
    import { onMount } from 'svelte';

    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

    let { data } = $props();

    const competition = $derived(data.competition);

    interface PuzzleData {
        id: string;
        name: string | null;
        pieces: number;
        brand: string;
        image_cld_id: string | null;
    }

    interface RecordUser {
        id: string;
        name: string;
        image: string | null;
    }

    interface UserIntentData {
        id: string;
        name: string;
    }

    interface RecordData {
        id: string;
        finishTime: Date | null;
        tableNumber: number | null;
        nPiecesCompleted: number | null;
        users: RecordUser[];
        userIntents: UserIntentData[];
    }

    interface CategoryData {
        id: number;
        description: string;
        subname: string | null;
        type: CategoryType;
        realStartTime: Date | null;
        realEndTime: Date | null;
        puzzles: PuzzleData[];
        records: RecordData[];
    }

    function isDNF(record: RecordData, category: CategoryData): boolean {
        if (!record.finishTime || !category.realEndTime) return false;
        const puzzle = category.puzzles[0];
        if (!puzzle) return false;
        const finishMs = new Date(record.finishTime).getTime();
        const endMs = new Date(category.realEndTime).getTime();
        // Consider DNF if finish time equals end time (within 2s tolerance) and pieces incomplete
        return Math.abs(finishMs - endMs) < 2000
            && record.nPiecesCompleted != null
            && record.nPiecesCompleted < puzzle.pieces;
    }

    function getFinishedRecords(category: CategoryData): RecordData[] {
        return category.records.filter((r: RecordData) => r.finishTime != null);
    }

    function getPositionStyle(position: number): { icon: string; color: string; bg: string } {
        switch (position) {
            case 1: return { icon: 'mdi:trophy', color: 'text-yellow-500', bg: 'bg-yellow-500/8 border-l-4 border-yellow-500' };
            case 2: return { icon: 'mdi:medal', color: 'text-gray-400', bg: 'bg-gray-400/8 border-l-4 border-gray-400' };
            case 3: return { icon: 'mdi:medal-outline', color: 'text-amber-700', bg: 'bg-amber-700/8 border-l-4 border-amber-700' };
            default: return { icon: '', color: 'text-surface-500', bg: '' };
        }
    }

    function getParticipantNames(record: RecordData): string[] {
        const names: string[] = record.users.map(u => u.name);
        record.userIntents.forEach(ui => names.push(ui.name));
        return names;
    }

    function formatStartTime(date: Date | null): string {
        if (!date) return '-';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Scroll to anchor on mount
    onMount(() => {
        if (window.location.hash) {
            const el = document.querySelector(window.location.hash);
            if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        }
    });
</script>

<svelte:head>
    <title>{competition.name} — {$t('results.title')}</title>
</svelte:head>

<div class="container mx-auto space-y-8 max-w-4xl">
    <!-- Header -->
    <TitleBackButton
        href="/competitions/competition_details/{competition.id}"
        text="{competition.name} — {$t('results.title')}"
    />

    {#if competition.categories.length === 0}
        <!-- Empty state -->
        <div class="text-center py-16">
            <Icon icon="mdi:trophy-outline" width="3rem" class="mx-auto mb-3 text-surface-400" />
            <p class="text-surface-500 text-lg">{$t('results.no_completed_categories')}</p>
        </div>
    {:else}
        <!-- Category navigation pills -->
        <nav class="flex flex-wrap gap-2">
            {#each competition.categories as cat (cat.id)}
                <a
                    href="#category-{cat.id}"
                    class="btn btn-sm preset-tonal-surface gap-1.5 transition-all hover:preset-tonal-primary"
                >
                    <Icon icon="mdi:puzzle" width="0.9rem" />
                    <span class="text-xs font-medium">{cat.subname ?? cat.description}</span>
                </a>
            {/each}
        </nav>

        <!-- Category results sections -->
        {#each competition.categories as category (category.id)}
            {@const finishedRecords = getFinishedRecords(category)}
            {@const firstFinish = finishedRecords.length > 0 && finishedRecords[0].finishTime ? new Date(finishedRecords[0].finishTime) : null}
            {@const puzzle = category.puzzles[0]}

            <section id="category-{category.id}" class="scroll-mt-6">
                <Card>
                    <!-- Category header -->
                    <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                        <!-- Puzzle miniature -->
                        {#if puzzle}
                            <div class="shrink-0">
                                {#if puzzle.image_cld_id}
                                    <div class="w-16 h-16 rounded-xl overflow-hidden shadow-md ring-1 ring-surface-300/50">
                                        <CldImage
                                            src={puzzle.image_cld_id}
                                            width="64"
                                            height="64"
                                            alt={puzzle.name || puzzle.brand}
                                            crop="fill"
                                            gravity="auto"
                                            class="w-full h-full object-cover"
                                        />
                                    </div>
                                {:else}
                                    <div class="w-16 h-16 rounded-xl bg-surface-200-800 flex items-center justify-center shadow-md">
                                        <Icon icon="mdi:puzzle" width="1.8rem" class="text-surface-400" />
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <!-- Category info -->
                        <div class="flex-1 min-w-0 space-y-1">
                            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                                {#if category.realStartTime}
                                    <span class="flex items-center gap-1">
                                        <Icon icon="mdi:clock-start" width="0.9rem" />
                                        {$t('results.started_at')} {formatStartTime(category.realStartTime)}
                                    </span>
                                {/if}
                                {#if category.realStartTime && category.realEndTime}
                                    <span class="flex items-center gap-1">
                                        <Icon icon="mdi:timer-check" width="0.9rem" />
                                        {formatElapsedTime(new Date(category.realStartTime), new Date(category.realEndTime))}
                                    </span>
                                {/if}
                                {#if puzzle}
                                    <span class="flex items-center gap-1">
                                        <Icon icon="mdi:puzzle-outline" width="0.9rem" />
                                        {puzzle.brand}{puzzle.name ? ` — ${puzzle.name}` : ''} · {puzzle.pieces} {$t('results.pieces')}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <!-- Finished count badge -->
                        <div class="badge preset-filled-success-500 gap-1 text-xs shrink-0 self-start">
                            <Icon icon="mdi:flag-checkered" width="0.8rem" />
                            {finishedRecords.length}
                        </div>
                    </div>

                    <!-- Leaderboard -->
                    {#if finishedRecords.length > 0}
                        <div class="mt-4 -mx-4 -mb-2">
                            <!-- Desktop table -->
                            <div class="hidden sm:block">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr class="border-b border-surface-300/50 text-xs text-surface-500 uppercase tracking-wider">
                                            <th class="px-4 py-2 text-left w-12">{$t('results.position')}</th>
                                            <th class="px-4 py-2 text-left">{$t('results.participants')}</th>
                                            <th class="px-4 py-2 text-right">{$t('results.time')}</th>
                                            <th class="px-4 py-2 text-right w-32">{$t('results.delta')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each finishedRecords as record, i (record.id)}
                                            {@const pos = i + 1}
                                            {@const style = getPositionStyle(pos)}
                                            {@const dnf = isDNF(record, category)}
                                            {@const participants = getParticipantNames(record)}
                                            <tr class="border-b border-surface-200/30 last:border-0 transition-colors {style.bg} {dnf ? 'opacity-60' : ''}">
                                                <!-- Position -->
                                                <td class="px-4 py-3">
                                                    <div class="flex items-center gap-1">
                                                        {#if pos <= 3}
                                                            <Icon icon={style.icon} width="1.2rem" class={style.color} />
                                                        {:else}
                                                            <span class="text-surface-500 font-mono text-sm pl-0.5">{pos}</span>
                                                        {/if}
                                                    </div>
                                                </td>
                                                <!-- Participants -->
                                                <td class="px-4 py-3">
                                                    <div class="flex flex-wrap items-center gap-1.5">
                                                        {#each record.users as user}
                                                            <div class="flex items-center gap-1.5">
                                                                {#if user.image}
                                                                    <img
                                                                        src={user.image}
                                                                        alt={user.name}
                                                                        class="w-6 h-6 rounded-full object-cover ring-1 ring-surface-300/50"
                                                                    />
                                                                {:else}
                                                                    <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                                        <span class="text-[10px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                                    </div>
                                                                {/if}
                                                                <span class="font-medium text-sm {pos === 1 && !dnf ? 'text-yellow-700 dark:text-yellow-400' : ''}">{user.name}</span>
                                                            </div>
                                                        {/each}
                                                        {#each record.userIntents as ui}
                                                            <div class="flex items-center gap-1.5">
                                                                <div class="w-6 h-6 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                    <Icon icon="mdi:account-question" width="0.8rem" class="text-surface-500" />
                                                                </div>
                                                                <span class="text-sm italic text-surface-500">{ui.name}</span>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </td>
                                                <!-- Time -->
                                                <td class="px-4 py-3 text-right">
                                                    {#if record.finishTime && category.realStartTime}
                                                        <span class="font-mono text-sm {pos === 1 && !dnf ? 'font-bold' : ''}">
                                                            {formatElapsedTime(new Date(category.realStartTime), new Date(record.finishTime))}
                                                        </span>
                                                    {/if}
                                                </td>
                                                <!-- Delta -->
                                                <td class="px-4 py-3 text-right">
                                                    {#if dnf && puzzle}
                                                        <span class="badge preset-tonal-error text-xs gap-1">
                                                            <Icon icon="mdi:puzzle-remove" width="0.8rem" />
                                                            {record.nPiecesCompleted}/{puzzle.pieces}
                                                        </span>
                                                    {:else if pos === 1}
                                                        <span class="badge preset-filled-warning-500 text-xs gap-1">
                                                            <Icon icon="mdi:trophy" width="0.7rem" />
                                                            {$t('results.winner')}
                                                        </span>
                                                    {:else if record.finishTime && firstFinish}
                                                        <span class="font-mono text-xs text-surface-500">
                                                            {formatTimeDelta(firstFinish, new Date(record.finishTime))}
                                                        </span>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Mobile stacked layout -->
                            <div class="sm:hidden space-y-0">
                                {#each finishedRecords as record, i (record.id)}
                                    {@const pos = i + 1}
                                    {@const style = getPositionStyle(pos)}
                                    {@const dnf = isDNF(record, category)}
                                    {@const participants = getParticipantNames(record)}
                                    <div class="px-4 py-3 border-b border-surface-200/30 last:border-0 {style.bg} {dnf ? 'opacity-60' : ''}">
                                        <div class="flex items-start justify-between gap-3">
                                            <!-- Left: Position + Participants -->
                                            <div class="flex items-start gap-2.5 min-w-0">
                                                <div class="shrink-0 mt-0.5">
                                                    {#if pos <= 3}
                                                        <Icon icon={style.icon} width="1.3rem" class={style.color} />
                                                    {:else}
                                                        <span class="text-surface-500 font-mono text-sm font-bold">{pos}</span>
                                                    {/if}
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="flex flex-wrap items-center gap-1">
                                                        {#each record.users as user}
                                                            <div class="flex items-center gap-1">
                                                                {#if user.image}
                                                                    <img
                                                                        src={user.image}
                                                                        alt={user.name}
                                                                        class="w-5 h-5 rounded-full object-cover"
                                                                    />
                                                                {/if}
                                                                <span class="text-sm font-medium {pos === 1 && !dnf ? 'text-yellow-700 dark:text-yellow-400' : ''}">{user.name}</span>
                                                            </div>
                                                        {/each}
                                                        {#each record.userIntents as ui}
                                                            <span class="text-sm italic text-surface-500">{ui.name}</span>
                                                        {/each}
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Right: Time + Delta -->
                                            <div class="shrink-0 text-right space-y-0.5">
                                                {#if record.finishTime && category.realStartTime}
                                                    <div class="font-mono text-sm {pos === 1 && !dnf ? 'font-bold' : ''}">
                                                        {formatElapsedTime(new Date(category.realStartTime), new Date(record.finishTime))}
                                                    </div>
                                                {/if}
                                                {#if dnf && puzzle}
                                                    <span class="badge preset-tonal-error text-[10px] gap-0.5">
                                                        <Icon icon="mdi:puzzle-remove" width="0.7rem" />
                                                        {record.nPiecesCompleted}/{puzzle.pieces}
                                                    </span>
                                                {:else if pos === 1}
                                                    <span class="badge preset-filled-warning-500 text-[10px] gap-0.5">
                                                        <Icon icon="mdi:trophy" width="0.6rem" />
                                                    </span>
                                                {:else if record.finishTime && firstFinish}
                                                    <span class="font-mono text-[11px] text-surface-500">
                                                        {formatTimeDelta(firstFinish, new Date(record.finishTime))}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else}
                        <div class="text-center py-6 text-surface-400 text-sm">
                            <Icon icon="mdi:timer-sand-empty" width="1.5rem" class="mx-auto mb-1" />
                            <p>{$t('during_competition.no_finished_records')}</p>
                        </div>
                    {/if}
                </Card>
            </section>
        {/each}
    {/if}
</div>
