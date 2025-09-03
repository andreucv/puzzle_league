<script lang="ts">
    import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import { page } from '$app/stores';
    let user = $derived($page.data.user);
    let currentPath = $derived($page.url.pathname);

    import { drawerState } from '../../shareds/drawer.svelte';
</script>

<header>
    <AppBar padding="p-4" background="bg-transparent" base="" >
        {#snippet lead()}
            <button id="states-button" onclick={() => drawerState.open = true} type="button">
                <Icon icon="icon-park:hamburger-button" width="1.5rem" height="1.5rem" />
            </button>
        {/snippet}
        <div class="text-left">
            <h1 class="text-left h4 font-sans" style="font-weight: 800; font-stretch: 125%;"><a href='/'>Puzzligas</a></h1>
        </div>
        {#snippet trail()}
            {#if user === undefined}
                <button id="login-button" type="button" class="btn btn-sm preset-filled" style:visibility="{currentPath === '/login' ? 'hidden' : 'visible'}">
                    <a href="/login">Log in</a>
                </button>
            {:else}
                <div class="flex items-center items-bottom relative">
                    <a href="/profile">
                        {#if user?.image === undefined}
                            <Icon icon="lets-icons:user-alt-fill" width="1.5rem" height="1.5rem" class="mx-2"/>
                        {:else}
                            <Avatar
                            name={user.name ? user.name.substring(0,2) : 'U'}
                            src={user.image}
                            classes="w-8 h-8">
                            </Avatar>
                        {/if}
                    </a>
                </div>
            {/if}
        {/snippet}
    </AppBar>
</header>
