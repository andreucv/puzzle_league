<script lang="ts">
    import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import { page } from '$app/state';
    let user = $derived(page.data.user);
    let currentPath = $derived(page.url.pathname);

    import { drawerState } from '../../shareds/drawer.svelte';
</script>

<header>
    <AppBar class="p-4 bg-transparent">
        <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
        <AppBar.Lead>
            <button id="states-button" onclick={() => drawerState.open = true} type="button">
                <Icon icon="icon-park:hamburger-button" width="1.5rem" height="1.5rem" />
            </button>
        </AppBar.Lead>
        <AppBar.Headline>
            <div class="text-left">
                <h1 class="text-left h4 font-sans" style="font-weight: 800; font-stretch: 125%;"><a href='/'>PuzzLigas</a></h1>
            </div>
        </AppBar.Headline>
        <AppBar.Trail>
            {#if user === null}
                <button id="login-button" type="button" class="btn btn-sm preset-filled" style:visibility="{currentPath === '/login' ? 'hidden' : 'visible'}">
                    <a href="/login">Log in</a>
                </button>
            {:else}
                <div class="flex items-center items-bottom relative">
                    <a href="/profile">
                        {#if user?.image === undefined}
                            <Icon icon="lets-icons:user-alt-fill" width="1.5rem" height="1.5rem" class="mx-2"/>
                        {:else}
                            <Avatar class="w-8 h-8">
                                <Avatar.Image src={user.image} alt={user.name ?? 'User'} />
                                <Avatar.Fallback>{user.name ? user.name.substring(0,2) : 'U'}</Avatar.Fallback>
                            </Avatar>
                        {/if}
                    </a>
                </div>
            {/if}
        </AppBar.Trail>
        </AppBar.Toolbar>
    </AppBar>
</header>
