<script>
    import ListCompetitions from "$lib/components/ListCompetitions.svelte";
    let { data } = $props();

    import { t } from '$lib/translations';
</script>

<h4>{$t('competitions.list_all_competitions')}</h4>
<div>
    <ListCompetitions upcoming_competitions={data.props.upcoming_competitions} past_competitions={data.props.past_competitions} roleAssignments={data.roleAssignments} />
</div>
