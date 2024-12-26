<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
    import { browser } from '$app/environment';
	import { initializeFirebase } from '$lib/firebase/client';
	let { children } = $props();

	if (browser) {
		try {
			initializeFirebase();
		} catch (error) {
			console.error(error);
		}
	}
</script>

<Header />
{@render children()}
