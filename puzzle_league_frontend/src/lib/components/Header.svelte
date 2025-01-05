<script >
    import { AppBar, Avatar } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { goto, invalidateAll } from '$app/navigation';
    const drawerStore = getDrawerStore();

    let { user, currentPath } = $props();

    function openDrawer() {
        drawerStore.open();
    }

    export async function signOut() {
        try {
            await fetch("/login", {
                method: "DELETE",
            });
            await invalidateAll();
            await goto("/login");
        } catch (err) {
            console.error(err);
        }
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
                <div class="flex items-center items-bottom">
                    {#if user?.picture === undefined}
                        <Icon icon="lets-icons:user-alt-fill" width="1.5rem" height="1.5rem" class="mx-2"/>
                    {:else}
                        <a href="/profile">
                            <Avatar
                                id="user-avatar"
                                initials="ac"
                                src="{user.picture}"
                                alt="{user.name}"
                                width="w-8"
                                referrerPolicy={'no-referrer'}>
                            </Avatar>
                        </a>
                    {/if}
                    <button id="sign-out" type="button" class="btn btn-sm variant-filled" onclick={() => signOut()}>
                        Sign out
                    </button>
                </div>
            {/if}
        </svelte:fragment>
    </AppBar>
</header>