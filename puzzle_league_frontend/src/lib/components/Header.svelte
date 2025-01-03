<script >
    import { AppBar, Avatar } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    import { signOut } from '$lib/firebase/client';
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    const drawerStore = getDrawerStore();

    let { user, currentPath } = $props();

    function openDrawer() {
        drawerStore.open();
    }
</script>

<header>
    <AppBar padding="m-4" background="bg-transparent" slotTrail="place-items-end" regionRowMain="">
        <svelte:fragment slot="lead">
            <button id="states-button" on:click={openDrawer} type="button">
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
                <div class="flex items-center items-bottom">
                    {#if user?.picture === undefined}
                        <Icon icon="lets-icons:user-alt-fill" width="1.5rem" height="1.5rem" class="mx-2"/>
                    {:else}
                        <Avatar
                            id="user-avatar"
                            initials="ac"
                            src="{user.picture}"
                            alt="{user.name}"
                            width="w-8"
                            referrerPolicy={'no-referrer'}
                            on:click={() => signOut()}
                        ></Avatar>
                    {/if}
                    <button id="sign-out" type="button" class="btn btn-sm variant-filled" on:click={() => signOut()}>
                        Sign out
                    </button>
                </div>
            {/if}
        </svelte:fragment>
    </AppBar>
</header>