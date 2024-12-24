<script>
    import { AppBar, Avatar } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    import { page } from '$app/stores';
    import { authStore } from '../../stores/authStore';
    import { auth_helpers } from '$lib/firebase/auth_helpers';
    $: currentPath = $page.url.pathname;
    $: currentUser = $authStore.user;
</script>

<header>
    <AppBar padding="m-4" slotTrail="place-content-end" background="bg-transparent">
        <svelte:fragment slot="lead">
            <button id="states-button" type="button">
                <Icon icon="icon-park:hamburger-button" width="1.5rem" height="1.5rem" />
            </button>
        </svelte:fragment>
        <div class="text-left">
            <h1 class="text-left h4" style="font-weight: 800; font-stretch: 125%;">Puzzle League</h1>
        </div>
        <svelte:fragment slot="trail">
            {#if currentUser}
                <div class="user-info">
                    <span>{currentUser.displayName}</span>
                    <button id="logout-button" type="button" class="btn btn-sm variant-filled" on:click="{() => auth_helpers.logout()}">
                        Log out
                    </button>
                </div>
            {/if}
            <button id="login-button" type="button" class="btn btn-sm variant-filled" style:visibility="{currentPath === '/login' ? 'hidden' : 'visible'}">
                <a href="/login">Log in</a>
            </button>
        </svelte:fragment>
    </AppBar>
</header>