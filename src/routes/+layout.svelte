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
				<a href="/" onclick={() => drawerState.open = false}>Home</a>
			</li>
			<li>
				<a href="/competitions" onclick={() => drawerState.open = false}>{$t('drawer_menu.explore_competitions')}</a>
			</li>
			{#if data.roleAssignments?.some((role: any) => role.role === "ORGANIZER")}
            <li>
                <a href="/competition/edit/" onclick={() => drawerState.open = false}>{$t('drawer_menu.create_competition')}</a>
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
<div class="px-4 pb-4" id="layout-start">
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
