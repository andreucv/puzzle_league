<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import { initializeFirebase, listenForAuthChanges } from '$lib/firebase/client';
    import { onMount } from 'svelte';
    import { authStore } from '../stores/authStore';
	
	let { children } = $props();

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

<Header />
{@render children()}
