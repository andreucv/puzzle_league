<script>
</script>

<svelte:head>
    <title>Puzzle League</title>
</svelte:head>

<div class="landing-page">
    <h1 style="line-height: 1.5">Puzzle League</h1>
    <p>
        Puzzles League for everyone
    </p>
    <button class="btn bg-success-100"><a href='/competitions'>Explore Competitions</a></button>
</div>

<style>
    .landing-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;
    }

    .landing-page h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .landing-page p {
        font-size: 1.25rem;
        margin-bottom: 2rem;
        max-width: 600px;
    }
</style>