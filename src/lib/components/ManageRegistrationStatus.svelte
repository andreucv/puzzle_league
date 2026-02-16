<script lang="ts">
	let {
		competition_id,
		competition_registration_status,
		hasCategories = true,
		onStatusChange
	}: {
		competition_id: number;
		competition_registration_status: boolean;
		hasCategories?: boolean;
		onStatusChange: (registrationOpen: boolean) => void;
	} = $props();

	let loading = $state(false);
	let feedbackMessage = $state('');
	let feedbackSuccess = $state(false);

	async function toggleRegistration() {
		loading = true;
		feedbackMessage = '';

		try {
			const response = await fetch(`/api/competitions/${competition_id}/toggle_registration`, {
				method: 'POST'
			});

			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (response.ok) {
				const result = await response.json();
				onStatusChange(result.registrationOpen);
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
				<span class="font-semibold" class:text-success-500={competition_registration_status} class:text-error-500={!competition_registration_status}>
					{competition_registration_status ? 'open' : 'closed'}
				</span>
			</p>
		</div>
	</div>

	<button
		class="btn {competition_registration_status ? 'preset-filled-error-500' : 'preset-filled-success-500'}"
		onclick={toggleRegistration}
		disabled={loading || !hasCategories}
	>
		{#if loading}
			<span class="loading loading-spinner loading-sm"></span>
			Updating...
		{:else}
			{competition_registration_status ? 'Close Registration' : 'Open Registration'}
		{/if}
	</button>
	{#if !hasCategories}
		<p class="text-xs text-surface-500 dark:text-surface-400">
			Add categories before opening registration.
		</p>
	{/if}

	{#if feedbackMessage}
		<aside class="alert {feedbackSuccess ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p>{feedbackMessage}</p>
		</aside>
	{/if}
</div>
