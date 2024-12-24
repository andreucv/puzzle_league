<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';
	import { firebaseAuth } from '$lib/firebase/client';
    import { authStore } from '../stores/authStore';

	onMount(() => {
	    const unsuscribe = firebaseAuth.onAuthStateChanged(user => {
	        console.log(user);
			if (user) {
	            console.log('User is signed in');
				authStore.update((current) => {
					return {
						...current,
						isLoading: false,
						user: user,
					};
				});
	        } else {
	            console.log('User is signed out');
	        }
	    });
		return unsuscribe;
	});
	let { children } = $props();
</script>

<Header />
{@render children()}
