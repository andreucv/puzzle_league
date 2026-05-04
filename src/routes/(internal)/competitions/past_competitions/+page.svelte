<script>
    import Icon from "@iconify/svelte";
    import SearchInput from "$lib/components/common/SearchInput.svelte";
    import { t } from '$lib/translations';
    import CompetitionCard from "$lib/components/competition/CompetitionCard.svelte";
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    let { data } = $props();

    let past_competitions     = $derived(data.props.past_competitions);
    let filter = $state('');
    let filtered_past_competitions     = $derived(past_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));

    let past_filtered_count = $derived(filtered_past_competitions.length);
    let past_total_count    = $derived(past_competitions.length);
</script>

<GenericTitle text={$t('competitions.past_competitions')} />
<div>
    <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter />
    <div class="pt-2">
        <div class="flex items-center justify-end">
        {#if filter !== ''}
            <span class="ml-2 text-sm">{past_filtered_count} / {past_total_count}</span>
        {/if}
        </div>
        <div class="pt-2 space-y-2">
            {#each filtered_past_competitions as competition}
                <CompetitionCard {competition}/>
            {/each}
        </div>
    </div>
</div>
