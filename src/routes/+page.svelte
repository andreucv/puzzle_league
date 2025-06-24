<script>
    let { data } = $props();

    // Check if user has organizer role
    const hasOrganizerRole = $derived(
        data.roleAssignments?.some(role => role.role === 'ORGANIZER') ?? false
    );

    const hasAdminRole = $derived(
        data.roleAssignments?.some(role => role.role === 'ADMIN') ?? false
    );

    console.log("+page.svelte: data", data);
</script>

<svelte:head>
    <title>Puzzle League</title>
</svelte:head>

{#if data.user}
    <div class="container mx-auto">
        <section class="space-y-4 mb-8">
            <h2 class="h2">Competitions</h2>

            {#if data?.props?.upcomingRegisteredCompetitions != null && data?.props?.upcomingRegisteredCompetitions?.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each data?.props?.upcomingRegisteredCompetitions as competition}
                        <div class="card preset-tonal-surface">
                            <header class="card-header">
                                <h3 class="h3">{competition.name}</h3>
                            </header>
                            <section class="p-4">
                                <p class="text-sm mb-2">{competition.format}</p>
                                <p class="text-xs opacity-75">Starts in 2 days</p>
                                <div class="mt-3">
                                    <span class="badge variant-filled-primary">Rank: {competition.rank}</span>
                                </div>
                            </section>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="card preset-tonal-surface">
                    <section class="p-4 text-center">
                        <p class="text-sm">You are not registered to any competition soon</p>
                        <p class="text-sm">Choose a competition to register to</p>
                        <a href="/competitions" class="btn btn-sm variant-filled-primary">Browse Competitions</a>
                    </section>
                </div>
            {/if}

            {#if data?.props?.participatedCompetitions != null && data?.props?.participatedCompetitions?.length > 0}
                <h3 class="h3 text-center mb-4">Participated Competitions</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each data?.props?.participatedCompetitions as competition}
                        <div class="card preset-tonal-surface">
                            <header class="card-header">
                                <h3 class="h3">{competition.name}</h3>
                            </header>
                            <section class="p-4">
                                <p class="text-sm mb-2">{competition.format}</p>
                                <p class="text-xs opacity-75">Completed</p>
                                <div class="mt-3">
                                    <span class="badge variant-filled-primary">Rank: {competition.rank}</span>
                                </div>
                            </section>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="card preset-tonal-surface">
                    <section class="p-4 text-center">
                        <p class="text-sm">No completed competitions yet</p>
                    </section>
                </div>
            {/if}
        </section>

        {#if hasOrganizerRole}
            <section class="space-y-4">
                <h2 class="h2 text-center">Organizer Actions</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/my-organized-competitions" class="card card-hover preset-tonal-success">
                        <header class="card-header">
                            <h3 class="h3">My Organized Competitions</h3>
                        </header>
                        <section class="p-2">
                            <p class="text-sm">Manage competitions you've created and monitor participants</p>
                        </section>
                    </a>

                    <a href="/competitions/create" class="card card-hover preset-tonal-warning">
                        <header class="card-header">
                            <h3 class="h3">Create New Competition</h3>
                        </header>
                        <section class="p-2">
                            <p class="text-sm">Set up a new puzzle competition with custom rules and formats</p>
                        </section>
                    </a>
                </div>
            </section>
        {/if}

        {#if hasAdminRole}
            <section class="space-y-4">
                <h2 class="h2 text-center">Admin Actions</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/admin/requests" class="card card-hover preset-tonal-primary">
                        <header class="card-header">
                            <h3 class="h3">Review Permissions Requests</h3>
                        </header>
                        <section class="p-2">
                            <p class="text-sm">Review and approve pending permissions requests</p>
                        </section>
                    </a>
                </div>
            </section>
        {/if}
    </div>
{:else}
    <div class="landing-page-container">
        <div class="landing-page-container-image">
            <enhanced:img src="../../static/landing_page.jpg" alt="Speed Puzzling Image" class="cover-image"/>
            <div class="landing-page-container-text-overlay" style="bottom: 10%;">
                <h1 class="h1-title card p-2">Join the Puzzle League</h1>
                <div class="arrows">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                        <path d="M10 15 L20 25 L30 15" stroke="currentColor" stroke-width="3" fill="none"/>
                        <path d="M10 25 L20 35 L30 25" stroke="currentColor" stroke-width="3" fill="none"/>
                    </svg>
                </div>
            </div>
        </div>
        <div class="center-text-inside mt-10">
            <h2 class="my-2 h2-title">Who We Are?</h2>
            <p>Welcome to a community dedicated to puzzle enthusiasts!</p>
            <p>If you're passionate about solving puzzles and want to test your skills in competitive environments, you've found your place.</p>
        </div>
        <div class="center-text-inside mt-10">
            <h2 class="my-2 h2-title">For Participants</h2>
            <ul>
                <li>Participate in thrilling speed puzzles, self-register for any competition, and check real-time results once they end</li>
                <li>Challenge yourself with diverse puzzle types, from logic challenges to pattern recognition</li>
                <li>Track your progress, earn achievements, and climb the global leaderboards</li>
                <li>Connect with fellow puzzle enthusiasts, share strategies, and join our vibrant community</li>
                <li>Practice with unlimited training modes to sharpen your skills before competitions</li>
            </ul>
        </div>
        <div class="center-text-inside mt-10">
            <h2 class="my-2 h2-title">For Organizers</h2>
            <ul>
                <li>Publish new competitions, manage participants, and monitor performance in real time</li>
                <li>Create custom puzzle sets with our intuitive puzzle builder interface</li>
                <li>Set flexible tournament formats, from quick sprints to marathon challenges</li>
                <li>Access detailed analytics and participant statistics to optimize your events</li>
                <li>Automate scoring and ranking systems while maintaining full control over competition parameters</li>
                <li>Generate comprehensive reports and share results across multiple platforms</li>
            </ul>
        </div>
    </div>
{/if}

<style>
    .arrows {
        animation: bounce 2s infinite;
    }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(10px); }
    }

    .landing-page-container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .landing-page-container-image {
        display: flex;
        height: 32vh;
        overflow: hidden;
        flex-direction: column;
        position: relative;
    }

    .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .landing-page-container-text-overlay {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
    }

    .center-text-inside {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding-inline: 3rem;
        text-align: center;
    }

    .h1-title {
        font-size: 2rem;
        font-weight: 800;
    }

    .h2-title {
        font-size: 1.5rem;
        font-weight: 800;
    }

    /* Remove the custom dashboard styles since we're using Skeleton UI classes */
</style>
