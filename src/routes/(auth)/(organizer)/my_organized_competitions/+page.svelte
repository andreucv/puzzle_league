<script lang="ts">
    let { data } = $props();
</script>

<h4>Your organised competitions</h4>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#if data.props && data.props.organised_competitions.length > 0}
        {#each data.props.organised_competitions as competition (competition.id)}
            <a href="/competitions/competition_details/{competition.id}" class="card card-hover">
                <header class="card-header">
                    <h3 class="h3">{competition.name}</h3>
                </header>
                <section class="p-2">
                    <p class="text-sm">{competition.description}</p>
                </section>
            </a>
        {/each}
    {:else}
        <p>You have not created any competitions yet.</p>
    {/if}
</div>
