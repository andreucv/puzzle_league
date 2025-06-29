<script lang="ts">
    import CompetitionDetailCard from '$lib/components/CompetitionDetailCard.svelte';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    import type { Competition, RoleAssignment } from '@prisma/client/wasm';
    import { cp } from 'fs';

    export let upcoming_competitions: Competition[];
    export let past_competitions: Competition[];
    export let roleAssignments: RoleAssignment[];

    let filter = '';
    $:filtered_upcoming_competitions = upcoming_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase()));
    $:filtered_past_competitions     = past_competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase()));

    $: upcoming_filtered_count = filtered_upcoming_competitions.length;
    $: upcoming_total_count    = upcoming_competitions.length;
    $: past_filtered_count = filtered_past_competitions.length;
    $: past_total_count    = past_competitions.length;

</script>

<div>
    <div>
        <div class="card">
            <div class="p-1 flex vertical-center">
                <div class="p-2">
                    <Icon icon="simple-line-icons:magnifier" />
                </div>
                <input class="input-full-width" bind:value={filter}/>
            </div>
        </div>
    </div>
    <div class="pt-2">
        <div class="flex items-center justify-between">
            <h1 class="text-lg">{$t('competitions.upcoming_competitions')}</h1>
            {#if roleAssignments?.some(role => role.role === 'ORGANIZER')}
                <a class="btn btn-sm variant-filled-primary" href="create_competition">
                    <Icon icon="mdi:plus" class="mr-1" />
                    {$t('competitions.create_competition')}
                </a>
            {/if}
            {#if filter !== ''}
                <span class="ml-2 text-sm">{upcoming_filtered_count} / {upcoming_total_count}</span>
            {/if}
        </div>
        {#each filtered_upcoming_competitions as competition}
            <div>
                <CompetitionDetailCard {competition}/>
            </div>
        {/each}
    </div>
    <div class="p-1">
        <div class="p-1 flex items-center justify-between">
            <h1 class="text-lg">{$t('competitions.past_competitions')}</h1>
            {#if filter !== ''}
                <span class="ml-2 text-sm">{past_filtered_count} / {past_total_count}</span>
            {/if}
        </div>
        {#each filtered_past_competitions as competition}
            <div>
                <CompetitionDetailCard {competition}/>
            </div>
        {/each}
    </div>
</div>

<style>
    .input-full-width {
        width: 100%;
        border: none;
        background-color: transparent;
    }
</style>
