<script lang="ts">
    import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
    import HamburgerIcon from '@iconify-svelte/icon-park/hamburger-button';
    import BellOutlineIcon from '@iconify-svelte/mdi/bell-outline';
    import UserAltFillIcon from '@iconify-svelte/mdi/account-circle';
    import { page } from '$app/state';
    let user = $derived(page.data.user);
    let currentPath = $derived(page.url.pathname);
    let isPreview: boolean = $derived(page.data.isPreview ?? false);
    let displayVersion: string | null = $derived(page.data.displayVersion ?? null);
    import { t } from '$lib/translations';

    import { drawerState } from '$lib/stores/drawer.svelte';
    import { notificationState } from '$lib/stores/notifications.svelte';

    // Disabled until client-side hydration completes so Playwright (and real users)
    // can't click the button before the onclick handler is attached.
    let hydrated = $state(false);
    $effect(() => { hydrated = true; });
</script>

<header>
    <AppBar class="p-4 pb-2 bg-transparent">
        <AppBar.Toolbar class="grid-cols-[auto_1fr_auto] items-center">
        <AppBar.Lead>
            <button id="states-button" class="flex items-center" onclick={() => drawerState.open = true} type="button" disabled={!hydrated}>
                <HamburgerIcon width="1.5rem" height="1.5rem" />
            </button>
        </AppBar.Lead>
        <AppBar.Headline>
            <div class="flex items-center">
                <h1 class="h4 font-sans" style="font-weight: 800; font-stretch: 125%;"><a href='/'>PuzzLigas</a></h1>
                {#if isPreview && displayVersion}
                    <span class="ml-2 text-xs font-mono text-surface-500" title="App version">v{displayVersion}</span>
                {/if}
            </div>
        </AppBar.Headline>
        <AppBar.Trail>
            {#if user === undefined}
                <button id="login-button" type="button" class="btn btn-sm preset-filled" style:visibility="{currentPath === '/login' ? 'hidden' : 'visible'}" data-testid="sign-in-button">
                    <a href="/login">{$t('landing_page.sign_in')}</a>
                </button>
            {:else}
                <div class="flex items-center items-bottom relative gap-3">
                    <a href="/notifications" class="relative p-1 text-primary-600" aria-label="Notifications">
                        <BellOutlineIcon width="1.5rem" height="1.5rem" class="text-primary-600" />
                        {#if notificationState.hasUnread}
                            <span data-testid="notifications-unread-dot" class="absolute top-1 right-1 w-2 h-2 rounded-full" style="background-color: #DD2200;"></span>
                        {/if}
                    </a>
                    <a href="/profile" data-testid="profile-avatar" class="relative">
                        {#if user && user?.image === undefined}
                            <UserAltFillIcon width="1.5rem" height="1.5rem" class="mx-2"/>
                        {:else}
                            <Avatar class="w-8 h-8">
                                <Avatar.Image src={user.image} alt={user.name ?? 'User'} />
                                <Avatar.Fallback>{user.name ? user.name.substring(0,2) : 'U'}</Avatar.Fallback>
                            </Avatar>
                        {/if}
                        {#if !user.emailVerified}
                            <span
                                class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-warning-500 border-2 border-white"
                                title="Email not verified"
                            ></span>
                        {/if}
                    </a>
                </div>
            {/if}
        </AppBar.Trail>
        </AppBar.Toolbar>
    </AppBar>
</header>
