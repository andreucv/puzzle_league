<script lang="ts">
    import { t } from '$lib/translations';
    import { formatElapsedTime } from '$lib/utils/category_utils';
    import Card from '$lib/components/common/card/Card.svelte';
    import Icon from '@iconify/svelte';

    interface ResultUser {
        id: string;
        name: string;
        image: string | null;
    }

    interface ResultUserIntent {
        id: string;
        name: string;
    }

    interface ResultPuzzle {
        pieces: number;
        brand: string;
        name: string | null;
    }

    interface UserResult {
        id: string;
        finishTime: Date | string | null;
        nPiecesCompleted: number | null;
        position: number | null;
        totalFinished: number;
        totalRecords: number;
        users: ResultUser[];
        userIntents: ResultUserIntent[];
        category: {
            id: number;
            description: string;
            type: string;
            realStartTime: Date | string | null;
            puzzles: ResultPuzzle[];
        };
        competition: {
            id: number;
            name: string;
            startDate: Date | string;
            image_cld_id: string | null;
        };
    }

    interface Props {
        results: UserResult[];
        currentUserId: string;
    }

    let { results, currentUserId }: Props = $props();

    function getPositionIcon(position: number | null): { icon: string; color: string } {
        if (position === null) return { icon: 'mdi:close-circle-outline', color: 'text-surface-400' };
        if (position === 1) return { icon: 'mdi:trophy', color: 'text-yellow-500' };
        if (position === 2) return { icon: 'mdi:medal', color: 'text-gray-400' };
        if (position === 3) return { icon: 'mdi:medal', color: 'text-amber-700' };
        return { icon: 'mdi:numeric-' + Math.min(position, 9) + '-circle-outline', color: 'text-surface-500' };
    }

    function getElapsedTime(result: UserResult): string {
        if (!result.finishTime || !result.category.realStartTime) return $t('results.dnf');
        return formatElapsedTime(new Date(result.category.realStartTime), new Date(result.finishTime));
    }

    function getTeammates(result: UserResult): string[] {
        const names: string[] = [];
        for (const user of result.users) {
            if (user.id !== currentUserId) {
                names.push(user.name);
            }
        }
        for (const intent of result.userIntents) {
            names.push(intent.name + ' *');
        }
        return names;
    }

    function getPuzzleInfo(result: UserResult): string {
        if (result.category.puzzles.length === 0) return '';
        const puzzle = result.category.puzzles[0];
        const parts = [puzzle.pieces + 'pc', puzzle.brand];
        if (puzzle.name) parts.push(puzzle.name);
        return parts.join(' · ');
    }

    function formatDate(dateStr: Date | string): string {
        return new Date(dateStr).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
</script>

<div class="space-y-3">
    {#each results as result (result.id)}
        {@const posInfo = getPositionIcon(result.position)}
        {@const teammates = getTeammates(result)}
        {@const puzzleInfo = getPuzzleInfo(result)}

        <a href="/competitions/competition_details/{result.competition.id}/results" class="block">
            <Card>
                <div class="flex items-start gap-3">
                    <!-- Position badge -->
                    <div class="shrink-0 flex flex-col items-center justify-center w-12">
                        <Icon icon={posInfo.icon} class="w-7 h-7 {posInfo.color}" />
                        {#if result.position}
                            <span class="text-xs font-bold {posInfo.color}">
                                {result.position}/{result.totalFinished}
                            </span>
                        {:else}
                            <span class="text-xs font-bold text-surface-400">{$t('results.dnf')}</span>
                        {/if}
                    </div>

                    <!-- Result details -->
                    <div class="flex-1 min-w-0 space-y-1">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-semibold text-lg tabular-nums">
                                {getElapsedTime(result)}
                            </span>
                            <span class="text-xs text-surface-500 whitespace-nowrap">
                                {formatDate(result.competition.startDate)}
                            </span>
                        </div>

                        <p class="text-sm font-medium truncate">{result.competition.name}</p>

                        <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-surface-500">
                            <span>{result.category.description}</span>
                            {#if puzzleInfo}
                                <span class="opacity-60">·</span>
                                <span>{puzzleInfo}</span>
                            {/if}
                        </div>

                        {#if teammates.length > 0}
                            <div class="flex flex-wrap items-center gap-1 pt-0.5">
                                <Icon icon="mdi:account-group-outline" class="w-4 h-4 text-surface-400" />
                                {#each teammates as name (name)}
                                    <span class="badge preset-filled-surface-200-800 text-xs px-1.5 py-0.5">{name}</span>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </Card>
        </a>
    {/each}
</div>
