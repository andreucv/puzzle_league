<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import AccountIcon from '@iconify-svelte/mdi/account';
    import HomeOutlineIcon from '@iconify-svelte/mdi/home-outline';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';
    import BellOutlineIcon from '@iconify-svelte/mdi/bell-outline';
    import PlusCircleOutlineIcon from '@iconify-svelte/mdi/plus-circle-outline';
    import ClipboardListOutlineIcon from '@iconify-svelte/mdi/clipboard-list-outline';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import ShieldCheckOutlineIcon from '@iconify-svelte/mdi/shield-check-outline';
    import CalendarRemoveOutlineIcon from '@iconify-svelte/mdi/calendar-remove-outline';

    import { drawerState } from '$lib/stores/drawer.svelte';
    import { t } from '$lib/translations';
    import { page } from '$app/state';

    let { user = null }: { user: any } = $props();

    let currentPath = $derived(page.url.pathname);
    let appVersion: string | null = $derived(page.data.appVersion ?? null);
    let commitSha: string | null = $derived(page.data.commitSha ?? null);

    let autoCancelRunning = $state(false);
    let autoCancelResult: string | null = $state(null);

    async function runAutoCancel() {
        autoCancelRunning = true;
        autoCancelResult = null;
        try {
            const res = await fetch('/api/cron/auto-cancel?dryRun=true');
            const data = await res.json();
            if (!res.ok) {
                autoCancelResult = `Error: ${data.error ?? res.statusText}`;
            } else {
                autoCancelResult = `Eligible: ${data.eligible}, Cancelled: ${data.cancelled}, Failed: ${data.failed}`;
            }
        } catch (err) {
            autoCancelResult = `Error: ${err instanceof Error ? err.message : 'Unknown'}`;
        } finally {
            autoCancelRunning = false;
        }
    }

    function navigate() {
        drawerState.open = false;
    }

    function isActive(href: string): boolean {
        if (href === '/') return currentPath === '/';
        return currentPath.startsWith(href);
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
        <a data-testid="nav-drawer-home" href="/" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/')}>
            <HomeOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{$t('drawer_menu.home')}</span>
        </a>
    </li>
    <li>
        <a data-testid="nav-drawer-competitions" href="/competitions/explore_competitions" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/competitions')}>
            <TrophyOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{$t('drawer_menu.explore_competitions')}</span>
        </a>
    </li>
    {#if user}
    <li>
        <a data-testid="nav-drawer-notifications" href="/notifications" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/notifications')}>
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
        <a data-testid="nav-drawer-create-competition" href="/competition/edit/" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/competition/edit')}>
            <PlusCircleOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{$t('drawer_menu.create_competition')}</span>
        </a>
    </li>
    <li>
        <a data-testid="nav-drawer-my-organized-competitions" href="/my_organized_competitions" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/my_organized_competitions')}>
            <ClipboardListOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{$t('competitions.my_organized_competitions')}</span>
        </a>
    </li>
    <li>
        <a data-testid="nav-drawer-puzzles" href="/puzzles" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/puzzles')}>
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
        <a data-testid="nav-drawer-review-permissions-requests" href="/admin/review_requests" onclick={navigate} class="nav-item" class:nav-item-active={isActive('/admin')}>
            <ShieldCheckOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{$t('landing_page.review_requests')}</span>
        </a>
    </li>
    <li>
        <button onclick={runAutoCancel} disabled={autoCancelRunning} class="nav-item w-full text-left">
            <CalendarRemoveOutlineIcon width="1.25rem" height="1.25rem" />
            <span>{autoCancelRunning ? 'Running...' : 'Auto-cancel (dry run)'}</span>
        </button>
        {#if autoCancelResult}
            <p class="px-3 pt-1 text-xs opacity-70">{autoCancelResult}</p>
        {/if}
    </li>
    {/if}
</ul>

<div class="px-5 py-3 mt-auto">
    <span class="text-xs font-mono opacity-50">
        {#if appVersion}v{appVersion}{/if}
        {#if commitSha}<span class="ml-1">({commitSha})</span>{/if}
    </span>
</div>

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

    .nav-item-active {
        background-color: rgb(var(--color-primary-500) / 0.1);
        color: rgb(var(--color-primary-600));
    }

    :global([data-mode="dark"]) .nav-item-active {
        background-color: rgb(var(--color-primary-500) / 0.15);
        color: rgb(var(--color-primary-400));
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
