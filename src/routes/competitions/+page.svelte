<script>
    import Icon from "@iconify/svelte";
    import CompetitionDetailCard from "$lib/components/CompetitionDetailCard.svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import { t } from '$lib/translations';
    import CompetitionCard from "$lib/components/competition/CompetitionCard.svelte";
    let { data } = $props();

    let upcoming_competitions = $derived(data.props.upcoming_competitions);
    let past_competitions     = $derived(data.props.past_competitions);
    let filter = $state('');
    let filtered_upcoming_competitions = $derived(upcoming_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));
    let filtered_past_competitions     = $derived(past_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));

    let upcoming_filtered_count = $derived(filtered_upcoming_competitions.length);
    let upcoming_total_count    = $derived(upcoming_competitions.length);
    let past_filtered_count = $derived(filtered_past_competitions.length);
    let past_total_count    = $derived(past_competitions.length);
</script>

<h4>{$t('competitions.list_all_competitions')}</h4>
<div>
    <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter />
    <div class="pt-2">
        <div class="flex items-center justify-between">
            <h1 class="text-lg">{$t('competitions.upcoming_competitions')}</h1>
            {#if data.roleAssignments?.some(role => role.role === 'ORGANIZER')}
                <a class="btn btn-sm preset-filled-primary-500" href="create_competition">
                    <Icon icon="mdi:plus" class="mr-1" />
                    {$t('competitions.create_competition')}
                </a>
            {/if}
            {#if filter !== ''}
                <span class="ml-2 text-sm">{upcoming_filtered_count} / {upcoming_total_count}</span>
            {/if}
        </div>
        <div class="pt-2 space-y-3">
            {#each filtered_upcoming_competitions as competition}
            <div class="">
                <CompetitionCard {competition}/>
            </div>
            {/each}
        </div>
    </div>
    <div class="p-1">
        <div class="p-1 flex items-center justify-between">
            <h1 class="text-lg">{$t('competitions.past_competitions')}</h1>
            {#if filter !== ''}
                <span class="ml-2 text-sm">{past_filtered_count} / {past_total_count}</span>
            {/if}
        </div>
        <div class="space-y-2">
            {#each filtered_past_competitions as competition}
                <CompetitionDetailCard {competition}/>
            {/each}
        </div>
    </div>
</div>
