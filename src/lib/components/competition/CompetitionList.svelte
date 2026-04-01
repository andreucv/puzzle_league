<script lang="ts">
    import { t } from '$lib/translations';
    import CompetitionCard from "./CompetitionCard.svelte";
    import type { Competition } from "$lib/.prisma/generated/prisma/browser";

    interface Props {
        competitions: Competition[];
        n_show: number;
        currentUsedId: string;
    }

    let { competitions, n_show, currentUsedId}: Props = $props();
    let shownCompetitions = $derived(competitions.slice(0, n_show));

</script>

<div class="space-y-2">
    {#if shownCompetitions.length === 0}
        <div class="card p-4 text-center">
            <p class="text-surface-500">{$t('competitions.no_upcoming_competitions')}</p>
        </div>
    {/if}
    {#each shownCompetitions as competition}
        <CompetitionCard competition={competition} currentUserId={currentUsedId} />
    {/each}
</div>
