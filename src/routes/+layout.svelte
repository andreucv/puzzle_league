<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';

	let {children, data} = $props();

	import { Drawer, initializeStores, getDrawerStore} from '@skeletonlabs/skeleton';
	initializeStores();
	const drawerStore = getDrawerStore();

	import { t, locale, locales } from '$lib/translations';
    import type { LayoutLoad } from './$types';
</script>

<Drawer>
	<nav class="list-nav p-4">
		<ul>
			<li>
				<button onclick={() => drawerStore.close()} class="btn btn-clear btn-sm">
					<Icon icon="icon-park:close" width="1.5rem" height="1.5rem" />
				</button>
			</li>
			<li>
				<a href="/" onclick={() => drawerStore.close()}>Home</a>
			</li>
			<li>
				<a href="/competitions" onclick={() => drawerStore.close()}>{$t('drawer_menu.explore_competitions')}</a>
			</li>
			{#if data.roleAssignments?.some((role: any) => role.role === "ORGANIZER")}
            <li>
                <a href="/create_competition" onclick={() => drawerStore.close()}>{$t('drawer_menu.create_competition')}</a>
            </li>
            {/if}
			{#if data.roleAssignments?.some((role: any) => role.role === "ADMIN")}
            <li>
                <a href="/admin/review_requests" onclick={() => drawerStore.close()}>{$t('landing_page.review_requests')}</a>
            </li>
            {/if}
		</ul>
	</nav>
</Drawer>
<Header/>
<div class="px-4 pb-4">
{@render children()}
</div>
<!-- {#if !data.user || currentPath.includes("footer")} -->
{#if !data.user}
<Footer />
{/if}
