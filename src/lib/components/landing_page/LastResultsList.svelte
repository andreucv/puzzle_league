<script lang="ts">
    import LastResultCard, { type UserResult } from './LastResultCard.svelte';

    let { results, currentUserId }: { results: UserResult[]; currentUserId: string } = $props();

    // One card per competition; Map keeps the loader's newest-first order.
    const byCompetition = $derived.by(() => {
        const groups = new Map<number, UserResult[]>();
        for (const r of results) groups.set(r.competition.id, [...(groups.get(r.competition.id) ?? []), r]);
        return [...groups.values()];
    });
</script>

<div class="space-y-2">
    {#each byCompetition as group (group[0].competition.id)}
        <LastResultCard results={group} {currentUserId} />
    {/each}
</div>
