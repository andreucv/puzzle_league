<script lang="ts">
	import type { Competition } from '$lib/.prisma/generated/prisma/browser';

	let { competition }: { competition: Competition } = $props();
</script>

<a
	href="/competitions/competition_details/{competition.id}"
	class="card preset-tonal-surface-200-800 p-2 hover:preset-tonal-primary transition-all block mb-2"
>
	<p class="font-semibold">{competition.name}</p>
	<p class="text-sm text-surface-600-400">{competition.location}</p>
	<p class="text-sm text-surface-500-500">
		{(new Date(competition.startDate).toLocaleDateString())}
	</p>
</a>
