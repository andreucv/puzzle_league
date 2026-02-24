<script lang="ts">
    import CompetitionCard from '$lib/components/competition/CompetitionCard.svelte';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { t } from '$lib/translations';
    let { data } = $props();

    let competitions     = $derived(data.props?.organised_competitions ?? []);
    let filter = $state('');
    let filtered_competitions     = $derived(competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));

    let filtered_count = $derived(filtered_competitions.length);
    let total_count    = $derived(competitions.length);
</script>

<GenericTitle text={$t('competitions.my_organized_competitions')} />
<div>
    <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter />
    <div class="pt-2">
        <div class="flex items-center justify-end">
            {#if filter !== ''}
                <span class="ml-2 text-sm">{filtered_count} / {total_count}</span>
            {/if}
        </div>
        <div class="pt-2 space-y-2">
            {#each filtered_competitions as competition}
                <CompetitionCard {competition} noShowCategories={true} />
            {/each}
        </div>
    </div>
</div>
