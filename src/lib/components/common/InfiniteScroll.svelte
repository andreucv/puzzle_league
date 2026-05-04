<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let hasMore: boolean;

	const dispatch = createEventDispatcher();

	let observer: IntersectionObserver;
	let sentinel: HTMLDivElement;

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore) {
					dispatch('loadMore');
				}
			},
			{ threshold: 1 }
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div bind:this={sentinel}>
	{#if hasMore}
		<div class="text-center p-4">
			<p>Loading more...</p>
		</div>
	{/if}
</div>
