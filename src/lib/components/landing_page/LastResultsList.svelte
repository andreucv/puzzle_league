<script lang="ts">
    import { t } from '$lib/translations';
    import { formatElapsedTime } from '$lib/utils/category_utils';
    import Card from '$lib/components/common/card/Card.svelte';
    import CloseCircleOutlineIcon from '@iconify-svelte/mdi/close-circle-outline';
    import TrophyIcon from '@iconify-svelte/mdi/trophy';
    import MedalIcon from '@iconify-svelte/mdi/medal';
    import Numeric4CircleOutlineIcon from '@iconify-svelte/mdi/numeric-4-circle-outline';
    import Numeric5CircleOutlineIcon from '@iconify-svelte/mdi/numeric-5-circle-outline';
    import Numeric6CircleOutlineIcon from '@iconify-svelte/mdi/numeric-6-circle-outline';
    import Numeric7CircleOutlineIcon from '@iconify-svelte/mdi/numeric-7-circle-outline';
    import Numeric8CircleOutlineIcon from '@iconify-svelte/mdi/numeric-8-circle-outline';
    import Numeric9CircleOutlineIcon from '@iconify-svelte/mdi/numeric-9-circle-outline';
    import AccountGroupOutlineIcon from '@iconify-svelte/mdi/account-group-outline';

    interface ResultUser {
        id: string;
        name: string;
        image: string | null;
    }

    interface ResultExternalParticipant {
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
        totalEntries: number;
        users: ResultUser[];
        externalParticipants: ResultExternalParticipant[];
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

    const numericIcons: Record<number, any> = {
        4: Numeric4CircleOutlineIcon,
        5: Numeric5CircleOutlineIcon,
        6: Numeric6CircleOutlineIcon,
        7: Numeric7CircleOutlineIcon,
        8: Numeric8CircleOutlineIcon,
        9: Numeric9CircleOutlineIcon,
    };

    function getPositionIcon(position: number | null): { icon: any; color: string } {
        if (position === null) return { icon: CloseCircleOutlineIcon, color: 'text-surface-400' };
        if (position === 1) return { icon: TrophyIcon, color: 'text-yellow-500' };
        if (position === 2) return { icon: MedalIcon, color: 'text-gray-400' };
        if (position === 3) return { icon: MedalIcon, color: 'text-amber-700' };
        return { icon: numericIcons[Math.min(position, 9)] ?? Numeric9CircleOutlineIcon, color: 'text-surface-500' };
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
        for (const ep of result.externalParticipants) {
            names.push(ep.name + ' *');
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
        {@const PosIcon = posInfo.icon}
        {@const teammates = getTeammates(result)}
        {@const puzzleInfo = getPuzzleInfo(result)}

        <a href="/competitions/competition_details/{result.competition.id}/results" class="block">
            <Card>
                <div class="flex items-start gap-3">
                    <!-- Position badge -->
                    <div class="shrink-0 flex flex-col items-center justify-center w-12">
                        <PosIcon class="w-7 h-7 {posInfo.color}" />
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
                                <AccountGroupOutlineIcon class="w-4 h-4 text-surface-400" />
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
