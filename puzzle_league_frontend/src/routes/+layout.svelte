<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';

	let { children } = $props();

	import { page } from '$app/stores';
	let currentPath = $derived($page.url.pathname);
	console.log("layout.svelte: currentPath", currentPath);
	console.log("layout.svelte: $page", $page);
    let user = $derived($page.data.user);
    console.log("layout.svelte: user", user);
	import { Drawer, initializeStores, getDrawerStore} from '@skeletonlabs/skeleton';
	initializeStores();
	const drawerStore = getDrawerStore();

	import { t, locale, locales } from '$lib/translations';
    import { authStore } from '../stores/authStore';

	function handleLogout() {
		authStore.logout();
	}
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
				<a href="/competitions" onclick={() => drawerStore.close()}>{$t('common.landing_page.explore_competitions')}</a>
			</li>
			{#if user !== undefined}
				<li>
					<a href="/profile" onclick={() => drawerStore.close()}>Profile Settings</a>
				</li>
				<li>
					<a href="/" onclick={() => {drawerStore.close(); handleLogout();}}>Logout</a>
				</li>
			{/if}
		</ul>
	</nav>
</Drawer>
<Header user={user} currentPath={currentPath}/>
<div class="px-4">
{@render children()}
</div>
{#if currentPath == "/" || currentPath.includes("footer")}
<Footer />
{/if}
