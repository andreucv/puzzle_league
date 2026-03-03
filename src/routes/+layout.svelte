<script lang="ts">
    import '../app.css';
    import { Dialog, Avatar, Portal } from '@skeletonlabs/skeleton-svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import { page } from '$app/stores';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import AccountIcon from '@iconify-svelte/mdi/account';
    import HomeOutlineIcon from '@iconify-svelte/mdi/home-outline';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';
    import BellOutlineIcon from '@iconify-svelte/mdi/bell-outline';
    import PlusCircleOutlineIcon from '@iconify-svelte/mdi/plus-circle-outline';
    import ClipboardListOutlineIcon from '@iconify-svelte/mdi/clipboard-list-outline';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import ShieldCheckOutlineIcon from '@iconify-svelte/mdi/shield-check-outline';
    import LogoutIcon from '@iconify-svelte/mdi/logout';

    let {children, data} = $props();
    import { drawerState } from '../shareds/drawer.svelte';

    import { t } from '$lib/translations';
    import { authClient } from '$lib/auth_client';
    import { goto } from '$app/navigation';

    let currentPath = $derived($page.url.pathname);

    function isActive(href: string) {
        if (href === '/') return currentPath === '/';
        return currentPath.startsWith(href);
    }

    function navigate() {
        drawerState.open = false;
    }

    // CSS transition classes for backdrop and drawer panel
    const animBackdrop = 'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';
    const animDrawer = 'transition transition-discrete opacity-0 -translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:-translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0';
</script>

<Dialog open={drawerState.open} onOpenChange={(e) => { drawerState.open = e.open; }}>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50/75 dark:bg-surface-950/75 {animBackdrop}" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
            <Dialog.Content class="h-screen bg-surface-100-900 shadow-xl w-[320px] overflow-y-auto {animDrawer}">
    <nav class="drawer-nav flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 class="h4 font-sans" style="font-weight: 800; font-stretch: 125%;"><a href="/" onclick={navigate}>PuzzLigas</a></h2>
            <Dialog.CloseTrigger data-testid="nav-drawer-close-button" class="p-1.5 rounded-full hover:bg-surface-200-800 transition-colors">
                <CloseIcon width="1.25rem" height="1.25rem" />
            </Dialog.CloseTrigger>
        </div>

        <!-- User greeting -->
        {#if data.user}
        <a href="/profile" onclick={navigate} class="flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl bg-surface-200-800 hover:bg-surface-300-700 transition-colors no-underline text-inherit">
            {#if data.user.image}
                <Avatar class="w-9 h-9">
                    <Avatar.Image src={data.user.image} alt={data.user.name ?? 'User'} />
                    <Avatar.Fallback>{data.user.name ? data.user.name.substring(0,2) : 'U'}</Avatar.Fallback>
                </Avatar>
            {:else}
                <div class="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <AccountIcon width="1.25rem" height="1.25rem" class="text-primary-500" />
                </div>
            {/if}
            <span class="text-sm font-medium truncate">{data.user.name ?? 'User'}</span>
        </a>
        {/if}

        <hr class="mx-5 my-1 border-surface-300-700" />

        <!-- Navigation links -->
        <ul class="flex-1 px-3 py-2 space-y-0.5">
            <li>
                <a data-testid="nav-drawer-home" href="/" onclick={navigate} class="nav-item" class:active={isActive('/')}>
                    <HomeOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('drawer_menu.home')}</span>
                </a>
            </li>
            <li>
                <a data-testid="nav-drawer-competitions" href="/competitions/explore_competitions" onclick={navigate} class="nav-item" class:active={isActive('/competitions')}>
                    <TrophyOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('drawer_menu.explore_competitions')}</span>
                </a>
            </li>
            {#if data.user}
            <li>
                <a data-testid="nav-drawer-notifications" href="/notifications" onclick={navigate} class="nav-item" class:active={isActive('/notifications')}>
                    <BellOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('notifications.title')}</span>
                </a>
            </li>
            {/if}

            {#if data.roleAssignments?.some((role: any) => role.role === "ORGANIZER")}
            <li class="pt-3">
                <span class="section-label">Organizer</span>
            </li>
            <li>
                <a data-testid="nav-drawer-create-competition" href="/competition/edit/" onclick={navigate} class="nav-item" class:active={isActive('/competition/edit')}>
                    <PlusCircleOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('drawer_menu.create_competition')}</span>
                </a>
            </li>
            <li>
                <a data-testid="nav-drawer-my-organized-competitions" href="/my_organized_competitions" onclick={navigate} class="nav-item" class:active={isActive('/my_organized_competitions')}>
                    <ClipboardListOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('competitions.my_organized_competitions')}</span>
                </a>
            </li>
            <li>
                <a data-testid="nav-drawer-puzzles" href="/puzzles" onclick={navigate} class="nav-item" class:active={isActive('/puzzles')}>
                    <PuzzleOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('drawer_menu.puzzles')}</span>
                </a>
            </li>
            {/if}

            {#if data.roleAssignments?.some((role: any) => role.role === "ADMIN")}
            <li class="pt-3">
                <span class="section-label">Admin</span>
            </li>
            <li>
                <a data-testid="nav-drawer-review-permissions-requests" href="/admin/review_requests" onclick={navigate} class="nav-item" class:active={isActive('/admin')}>
                    <ShieldCheckOutlineIcon width="1.25rem" height="1.25rem" />
                    <span>{$t('landing_page.review_requests')}</span>
                </a>
            </li>
            {/if}
        </ul>

        <!-- Sign out -->
        {#if data.user}
        <div class="px-3 pb-5 pt-2">
            <hr class="mb-3 border-surface-300-700" />
            <button data-testid="nav-drawer-signout" onclick={async () => { drawerState.open = false; await authClient.signOut({ fetchOptions: { onSuccess: () => goto('/login') } }); }} class="nav-item w-full text-error-500 hover:bg-error-500/10">
                <LogoutIcon width="1.25rem" height="1.25rem" />
                <span>Sign out</span>
            </button>
        </div>
        {/if}
    </nav>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
<Header/>
<div id="layout-start">
{@render children()}
</div>
<!-- {#if !data.user || currentPath.includes("footer")} -->
{#if !data.user}
<Footer />
{/if}

<style>
    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
        border-radius: 0.625rem;
        font-size: 0.95rem;
        font-weight: 500;
        transition: background-color 150ms ease, color 150ms ease;
        text-decoration: none;
        color: inherit;
    }

    .nav-item:hover {
        background-color: rgb(var(--color-surface-200) / 1);
    }

    :global([data-mode="dark"]) .nav-item:hover {
        background-color: rgb(var(--color-surface-800) / 1);
    }

    .nav-item.active {
        background-color: rgb(var(--color-primary-500) / 0.12);
        color: rgb(var(--color-primary-500));
        font-weight: 600;
    }

    .section-label {
        display: block;
        padding: 0 0.75rem 0.35rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.5;
    }
</style>
