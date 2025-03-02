<script>
    import ListCompetitions from "$lib/components/ListCompetitions.svelte";
    import Icon from "@iconify/svelte";
    let { data } = $props();
    console.log("competitions +page.svelte: data", data);
</script>

<div>
    {#if data.participant.user.groups.some(group => group.name === "Organizer")}
        <a href="/competitions/create_competition" class="bg-gray-500 text-white px-2 py-2 rounded-full flex justify-center items-center absolute top-4 right-4">
            <Icon icon="ic:baseline-add" class="text-white" />
        </a>
    {/if}
    <ListCompetitions upcoming_competitions={data.props.upcoming_competitions} past_competitions={data.props.past_competitions} />
</div>
