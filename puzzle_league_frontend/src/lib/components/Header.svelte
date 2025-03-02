<script lang="ts">
    import { AppBar, Avatar, popup } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { goto, invalidateAll } from '$app/navigation';
    import { authStore } from '../../stores/authStore';
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';

    const drawerStore = getDrawerStore();

    let { user, currentPath } = $props();

    function openDrawer() {
        drawerStore.open();
    }

    async function handleLogout() {
        await authStore.logout();
    }

    // Use $state for reactive variables with proper typing
    let userMenuOpen = $state(false);
    let userMenuElement: HTMLDivElement | null = $state(null);
    let userButtonElement: HTMLDivElement | null = $state(null);

    function toggleUserMenu() {
        userMenuOpen = !userMenuOpen;

        if (browser && userMenuOpen) {
            document.body.classList.add('user-menu-open');
        } else if (browser) {
            document.body.classList.remove('user-menu-open');
        }
    }

    function handleClickOutside(event: MouseEvent) {
        if (userMenuOpen &&
            userMenuElement && !userMenuElement.contains(event.target as Node) &&
            userButtonElement && !userButtonElement.contains(event.target as Node)) {
            userMenuOpen = false;
            if (browser) {
                document.body.classList.remove('user-menu-open');
            }
        }
    }

    onMount(() => {
        if (browser) {
            document.addEventListener('click', handleClickOutside);
        }
    });

    onDestroy(() => {
        if (browser) {
            document.removeEventListener('click', handleClickOutside);
            document.body.classList.remove('user-menu-open');
        }
    });
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
                    <div bind:this={userButtonElement} class="flex items-center cursor-pointer" onclick={toggleUserMenu}>
                        {#if user?.photoURL === undefined}
                            <Icon icon="lets-icons:user-alt-fill" width="1.5rem" height="1.5rem" class="mx-2"/>
                        {:else}
                            <Avatar
                                id="user-avatar"
                                initials={user.name ? user.name.substring(0,2) : 'U'}
                                src={user.photoURL}
                                alt={user.name}
                                width="w-8"
                                referrerPolicy='no-referrer'>
                            </Avatar>
                        {/if}
                        <Icon icon="mdi:chevron-down" width="1rem" height="1rem" class="ml-1" />
                    </div>

                    {#if userMenuOpen}
                        <div bind:this={userMenuElement} class="absolute right-0 mt-2 w-48 bg-surface-100-800-token rounded-lg shadow-lg py-1 z-50 top-10">
                            <a href="/profile" class="block px-4 py-2 hover:bg-primary-500/20">Profile</a>
                            <hr class="opacity-50 my-1">
                            <button onclick={handleLogout} class="w-full text-left px-4 py-2 hover:bg-primary-500/20">
                                Logout
                            </button>
                        </div>
                    {/if}
                </div>
            {/if}
        </svelte:fragment>
    </AppBar>
</header>

<style>
    /* Add click away listener styles */
    :global(body.user-menu-open) {
        position: relative;
    }

    :global(body.user-menu-open::after) {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 40;
    }
</style>
