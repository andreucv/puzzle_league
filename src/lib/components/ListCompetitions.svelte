<script lang="ts">
    import CompetitionDetailCard from '$lib/components/CompetitionDetailCard.svelte';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    import type { Competition, RoleAssignment } from '@prisma/client/wasm';
    import SearchInput from '$lib/components/SearchInput.svelte';

    let {upcoming_competitions, past_competitions, roleAssignments} = $props();

    let filter = $state('');
    let filtered_upcoming_competitions = $derived(upcoming_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));
    let filtered_past_competitions     = $derived(past_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));

    let upcoming_filtered_count = $derived(filtered_upcoming_competitions.length);
    let upcoming_total_count    = $derived(upcoming_competitions.length);
    let past_filtered_count = $derived(filtered_past_competitions.length);
    let past_total_count    = $derived(past_competitions.length);

</script>

<div>
    <div>
        <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter />
    </div>
    <div class="pt-2">
        <div class="flex items-center justify-between">
            <h1 class="text-lg">{$t('competitions.upcoming_competitions')}</h1>
            {#if roleAssignments?.some(role => role.role === 'ORGANIZER')}
                <a class="btn btn-sm preset-filled-primary-500" href="create_competition">
                    <Icon icon="mdi:plus" class="mr-1" />
                    {$t('competitions.create_competition')}
                </a>
            {/if}
            {#if filter !== ''}
                <span class="ml-2 text-sm">{upcoming_filtered_count} / {upcoming_total_count}</span>
            {/if}
        </div>
        <div class="pt-2">
            {#each filtered_upcoming_competitions as competition}
            <div class="mb-4">
                <CompetitionDetailCard {competition}/>
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

<style>
    .input-full-width {
        width: 100%;
        border: none;
        background-color: transparent;
    }
</style>
