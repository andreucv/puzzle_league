<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { page } from '$app/stores';
    import AccountIcon from '@iconify-svelte/mdi/account';
    import HomeOutlineIcon from '@iconify-svelte/mdi/home-outline';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';
    import BellOutlineIcon from '@iconify-svelte/mdi/bell-outline';
    import PlusCircleOutlineIcon from '@iconify-svelte/mdi/plus-circle-outline';
    import ClipboardListOutlineIcon from '@iconify-svelte/mdi/clipboard-list-outline';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import ShieldCheckOutlineIcon from '@iconify-svelte/mdi/shield-check-outline';
    import LogoutIcon from '@iconify-svelte/mdi/logout';

    import { drawerState } from '../../shareds/drawer.svelte';
    import { t } from '$lib/translations';
    import { authClient } from '$lib/auth_client';
    import { goto } from '$app/navigation';

    let { user = null }: { user: any } = $props();

    let currentPath = $derived($page.url.pathname);

    function isActive(href: string) {
        if (href === '/') return currentPath === '/';
        return currentPath.startsWith(href);
    }

    function navigate() {
        drawerState.open = false;
    }
</script>

<!-- User greeting -->
{#if user}
<a href="/profile" onclick={navigate} class="flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl bg-surface-200-800 hover:bg-surface-300-700 transition-colors no-underline text-inherit">
    {#if user.image}
        <Avatar class="w-9 h-9">
            <Avatar.Image src={user.image} alt={user.name ?? 'User'} />
            <Avatar.Fallback>{user.name ? user.name.substring(0,2) : 'U'}</Avatar.Fallback>
        </Avatar>
    {:else}
        <div class="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center">
            <AccountIcon width="1.25rem" height="1.25rem" class="text-primary-500" />
        </div>
    {/if}
    <span class="text-sm font-medium truncate">{user.name ?? 'User'}</span>
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
    {#if user}
    <li>
        <a data-testid="nav-drawer-notifications" href="/notifications" onclick={navigate} class="nav-item" class:active={isActive('/notifications')}>
            <BellOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{$t('notifications.title')}</span>
        </a>
    </li>
    {/if}

    {#if user?.roleAssignments?.some((role: any) => role.role === "ORGANIZER")}
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

    {#if user?.roleAssignments?.some((role: any) => role.role === "ADMIN")}
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
{#if user}
<div class="px-3 pb-5 pt-2">
    <hr class="mb-3 border-surface-300-700" />
    <button data-testid="nav-drawer-signout" onclick={async () => { drawerState.open = false; await authClient.signOut({ fetchOptions: { onSuccess: () => goto('/login') } }); }} class="nav-item w-full text-error-500 hover:bg-error-500/10">
        <LogoutIcon width="1.25rem" height="1.25rem" />
        <span>Sign out</span>
    </button>
</div>
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
