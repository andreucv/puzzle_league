<script lang="ts">
    import Icon from "@iconify/svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import { t } from '$lib/translations';
    import CompetitionCard from "$lib/components/competition/CompetitionCard.svelte";
    let { data } = $props();

    let competitions = $derived(data.props.competitions);
    let filter = $state('');
    let filtered_competitions = $derived(competitions.filter(competition => competition.name.toLowerCase().includes(filter.toLowerCase())));

    let filtered_count = $derived(filtered_competitions.length);
    let total_count    = $derived(competitions.length);
</script>
