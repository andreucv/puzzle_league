<script>
    import { AppBar, Avatar } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
</script>

<header>
    <AppBar padding="p-4" slotTrail="place-content-end" background="bg-transparent">
        <svelte:fragment slot="lead">
            <button id="states-button" type="button">
                <Icon icon="icon-park:hamburger-button" width="1.5rem" height="1.5rem" />
            </button>
        </svelte:fragment>
        <div class="text-left">
            <h1 class="text-left" style="font-weight: 800; font-stretch: 125%;">Puzzle League</h1>
        </div>
        <svelte:fragment slot="trail">
            <button id="login-button" type="button" class="btn btn-sm variant-filled">
                <a href="/login">Log in</a>
            </button>
        </svelte:fragment>
    </AppBar>
</header>
