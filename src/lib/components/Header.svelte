<script lang="ts">
    import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
    import HamburgerIcon from '@iconify-svelte/icon-park/hamburger-button';
    import BellOutlineIcon from '@iconify-svelte/mdi/bell-outline';
    import UserAltFillIcon from '@iconify-svelte/mdi/account-circle';
    import { page } from '$app/state';
    let user = $derived(page.data.user);
    let currentPath = $derived(page.url.pathname);

    import { drawerState } from '../../shareds/drawer.svelte';
    import { useEventStream } from '$lib/events/client/use-event-stream.svelte';

    let hasUnread = $state(false);

    $effect(() => {
        if (user) {
            const stream = useEventStream('notifications', { userId: user.id }, {
                idleInterval: 15_000,
                backgroundInterval: 30_000
            });
            // Reactive derivation in inner effect to track state changes
            $effect(() => {
                hasUnread = stream.state?.hasUnread ?? false;
            });
            return () => {
                stream.destroy();
            };
        }
    });
</script>

<header>
    <AppBar class="p-4 pb-2 bg-transparent">
        <AppBar.Toolbar class="grid-cols-[auto_1fr_auto] items-center">
        <AppBar.Lead>
            <button id="states-button" class="flex items-center" onclick={() => drawerState.open = true} type="button">
                <HamburgerIcon width="1.5rem" height="1.5rem" />
            </button>
        </AppBar.Lead>
        <AppBar.Headline>
            <div class="flex items-center">
                <h1 class="h4 font-sans" style="font-weight: 800; font-stretch: 125%;"><a href='/'>PuzzLigas</a></h1>
            </div>
        </AppBar.Headline>
        <AppBar.Trail>
            {#if user === null}
                <button id="login-button" type="button" class="btn btn-sm preset-filled" style:visibility="{currentPath === '/login' ? 'hidden' : 'visible'}">
                    <a href="/login">Log in</a>
                </button>
            {:else}
                <div class="flex items-center items-bottom relative gap-3">
                    <a href="/notifications" class="relative p-1 text-primary-600" aria-label="Notifications">
                        <BellOutlineIcon width="1.5rem" height="1.5rem" class="text-primary-600" />
                        {#if hasUnread}
                            <span class="absolute top-1 right-1 w-2 h-2 rounded-full" style="background-color: #DD2200;"></span>
                        {/if}
                    </a>
                    <a href="/profile" data-testid="profile-avatar">
                        {#if user?.image === undefined}
                            <UserAltFillIcon width="1.5rem" height="1.5rem" class="mx-2"/>
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
