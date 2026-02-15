<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatTime } from '$lib/utils/datetime_utils';
	import { getCategoryTypeName } from '$lib/utils/category_utils';
	import type { Category, Competition } from '@prisma/client';

	type CategoryWithCounts = Category & { totalRecords: number };

	let {
		competition = $bindable(),
		categories
	}: {
		competition: Competition;
		categories: CategoryWithCounts[];
	} = $props();

	let loading = $state(false);
	let feedbackMessage = $state('');
	let feedbackSuccess = $state(false);

	async function toggleRegistration() {
		loading = true;
		feedbackMessage = '';

		try {
			const response = await fetch(`/api/competitions/${competition.id}/toggle_registration`, {
				method: 'POST'
			});

			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (response.ok) {
				const result = await response.json();
				competition = result.competition;
				feedbackSuccess = true;
				feedbackMessage = '';
			} else {
				const errorData = await response.json();
				feedbackSuccess = false;
				feedbackMessage = errorData.error || 'Failed to update registration status';
			}
		} catch {
			feedbackSuccess = false;
			feedbackMessage = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<!-- Registration Toggle -->
<div class="card p-6 space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h6 class="text-md font-semibold">Registration Status</h6>
			<p class="text-sm text-surface-600 dark:text-surface-400">
				Registration is currently
				<span class="font-semibold" class:text-success-500={competition.registrationOpen} class:text-error-500={!competition.registrationOpen}>
					{competition.registrationOpen ? 'open' : 'closed'}
				</span>
			</p>
		</div>
	</div>

	<button
		class="btn {competition.registrationOpen ? 'preset-filled-error-500' : 'preset-filled-success-500'}"
		onclick={toggleRegistration}
		disabled={loading}
	>
		{#if loading}
			<span class="loading loading-spinner loading-sm"></span>
			Updating...
		{:else}
			{competition.registrationOpen ? 'Close Registration' : 'Open Registration'}
		{/if}
	</button>

	{#if feedbackMessage}
		<aside class="alert {feedbackSuccess ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p>{feedbackMessage}</p>
		</aside>
	{/if}
</div>
