<script lang="ts">
    import { AppBar, Avatar } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    import { getDrawerStore } from "@skeletonlabs/skeleton";

    import { page } from '$app/stores';
    let user = $derived($page.data.user);
    console.log("Header.svelte: user", user);
    let currentPath = $derived($page.url.pathname);

    const drawerStore = getDrawerStore();

    function openDrawer() {
        drawerStore.open();
    }

</script>

<header>
    <AppBar padding="m-4" background="bg-transparent" slotTrail="place-items-end" regionRowMain="">
        <svelte:fragment slot="lead">
            <button id="states-button" onclick={openDrawer} type="button">
                <Icon icon="icon-park:hamburger-button" width="1.5rem" height="1.5rem" />
            </button>
        </svelte:fragment>
        <div class="text-left">
            <h1 class="text-left h4" style="font-weight: 800; font-stretch: 125%;"><a href='/'>Puzzle League</a></h1>
        </div>
        <svelte:fragment slot="trail">
            {#if user === undefined}
                <button id="login-button" type="button" class="btn btn-sm variant-filled" style:visibility="{currentPath === '/login' ? 'hidden' : 'visible'}">
                    <a href="/login">Log in</a>
                </button>
            {:else}
                <div class="flex items-center items-bottom relative">
                    <a href="/profile">
                        {#if user?.image === undefined}
                            <Icon icon="lets-icons:user-alt-fill" width="1.5rem" height="1.5rem" class="mx-2"/>
                        {:else}
                            <Avatar
                                id="user-avatar"
                                initials={user.name ? user.name.substring(0,2) : 'U'}
                                src={user.image}
                                alt={user.name}
                                width="w-8"
                                referrerPolicy='no-referrer'>
                            </Avatar>
                        {/if}
                    </a>
                </div>
            {/if}
        </svelte:fragment>
    </AppBar>
</header>
