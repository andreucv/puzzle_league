<script lang="ts">
    import Icon from "@iconify/svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import { t } from '$lib/translations';
    import CompetitionCard from "$lib/components/competition/CompetitionCard.svelte";
    let { data } = $props();

    let upcoming_competitions = $derived(data.props.upcoming_competitions);
    let filter = $state('');
    let filtered_upcoming_competitions = $derived(upcoming_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));

    let upcoming_filtered_count = $derived(filtered_upcoming_competitions.length);
    let upcoming_total_count    = $derived(upcoming_competitions.length);
</script>

<h4>{$t('competitions.upcoming_competitions')}</h4>
<div>
    <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter />
    <div class="pt-2">
        <div class="flex items-center justify-end">
            {#if data.roleAssignments?.some((role: { role: string }) => role.role === 'ORGANIZER')}
                <a class="btn btn-sm preset-filled-primary-500" href="/competition/edit">
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
</div>
