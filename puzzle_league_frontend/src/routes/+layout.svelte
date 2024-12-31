<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { initializeFirebase, listenForAuthChanges } from '$lib/firebase/client';
    import { onMount } from 'svelte';
    import { authStore } from '../stores/authStore';
	import Icon from '@iconify/svelte';

	let { children } = $props();

	import { Drawer, initializeStores, getDrawerStore} from '@skeletonlabs/skeleton';
	initializeStores();
	const drawerStore = getDrawerStore();

	onMount(() =>{
		const auth = localStorage.getItem('auth');
		if (auth) {
			const parsed_auth = JSON.parse(auth);
			authStore.set({isLoading: false, user: parsed_auth.user, backend_token: parsed_auth.backend_token});
		}
		initializeFirebase();
		listenForAuthChanges();
	});
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
				<a href="/competitions" onclick={() => drawerStore.close()}>Competitions</a>
			</li>
		</ul>
	</nav>
</Drawer>
<Header />
{@render children()}
<Footer />
