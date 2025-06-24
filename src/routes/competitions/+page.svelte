<script>
    import ListCompetitions from "$lib/components/ListCompetitions.svelte";
    let { data } = $props();
    console.log("competitions +page.svelte: data", data);
</script>

<div>
    <ListCompetitions upcoming_competitions={data.props.upcoming_competitions} past_competitions={data.props.past_competitions} roleAssignments={data.roleAssignments} />
</div>
