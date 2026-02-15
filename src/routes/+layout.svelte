<script lang="ts">
    import '../app.css';
    import { Modal } from '@skeletonlabs/skeleton-svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Icon from '@iconify/svelte';

    let {children, data} = $props();
    import { drawerState } from '../shareds/drawer.svelte';

    import { t } from '$lib/translations';
</script>

<Modal open={drawerState.open}
triggerBase="btn preset-tonal"
  contentBase="bg-surface-100-900 p-4 space-y-4 shadow-xl w-[480px] h-screen"
  positionerJustify="justify-start"
  positionerAlign=""
  positionerPadding=""
  transitionsPositionerIn={{ x: -480, duration: 200 }}
  transitionsPositionerOut={{ x: -480, duration: 200 }}>
      {#snippet content()}
    <nav class="pt-1">
        <ul>
            <li>
                <button onclick={() => drawerState.open = false} class="mb-4">
                    <Icon icon="icon-park:close" width="1.5rem" height="1.5rem" />
                </button>
            </li>
            <li>
                <a href="/" onclick={() => drawerState.open = false}>{$t('drawer_menu.home')}</a>
            </li>
            <li>
                <a href="/competitions/explore_competitions" onclick={() => drawerState.open = false}>{$t('drawer_menu.explore_competitions')}</a>
            </li>
            <li>
                <a href="/competitions/explore_results" onclick={() => drawerState.open = false}>{$t('drawer_menu.explore_results')}</a>
            </li>
            <li>
                <a href="/competitions/calendar/list" onclick={() => drawerState.open = false}>{$t('competitions.calendar_list.title')}</a>
            </li>
            <li>
                <a href="/competitions/calendar/table" onclick={() => drawerState.open = false}>{$t('competitions.calendar_table.title')}</a>
            </li>
            {#if data.roleAssignments?.some((role: any) => role.role === "ORGANIZER")}
            <li>
                <a href="/competition/edit/" onclick={() => drawerState.open = false}>{$t('drawer_menu.create_competition')}</a>
            </li>
            <li>
                <a href="/my_organized_competitions" onclick={() => drawerState.open = false}>{$t('competitions.my_organized_competitions')}</a>
            </li>
            <li>
                <a href="/puzzles" onclick={() => drawerState.open = false}>{$t('drawer_menu.puzzles')}</a>
            </li>
            {/if}
            {#if data.roleAssignments?.some((role: any) => role.role === "ADMIN")}
            <li>
                <a href="/admin/review_requests" onclick={() => drawerState.open = false}>{$t('landing_page.review_requests')}</a>
            </li>
            {/if}
        </ul>
    </nav>
    {/snippet}
</Modal>
<Header/>
<div id="layout-start">
{@render children()}
</div>
<!-- {#if !data.user || currentPath.includes("footer")} -->
{#if !data.user}
<Footer />
{/if}

<style>
    li a {
        padding-bottom: 0.75rem;
        font-size: 1.25rem;
        display: block;
    }
</style>
