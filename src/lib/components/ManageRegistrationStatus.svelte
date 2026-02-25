<script lang="ts">
	import Card from '$lib/components/common/card/Card.svelte';
	import Icon from '@iconify/svelte';

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
<Card>
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<Icon icon={competition_registration_status ? 'mdi:lock-open-variant' : 'mdi:lock'} width="1.2rem" height="1.2rem" class={competition_registration_status ? 'text-success-500' : 'text-error-500'} />
			<p class="text-sm">
				Registration is
				<span class="font-semibold" class:text-success-500={competition_registration_status} class:text-error-500={!competition_registration_status}>
					{competition_registration_status ? 'open' : 'closed'}
				</span>
			</p>
		</div>
		<button
			class="btn btn-sm {competition_registration_status ? 'preset-filled-error-500' : 'preset-filled-success-500'}"
			onclick={toggleRegistration}
			disabled={loading || !hasCategories}
			data-testid="toggle-registration"
		>
			{#if loading}
				Updating...
			{:else}
				{competition_registration_status ? 'Close' : 'Open'}
			{/if}
		</button>
	</div>
	{#if !hasCategories}
		<p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
			Add categories before opening registration.
		</p>
	{/if}
	{#if feedbackMessage}
		<aside class="alert {feedbackSuccess ? 'preset-filled-success-500' : 'preset-filled-error-500'} mt-2">
			<p>{feedbackMessage}</p>
		</aside>
	{/if}
</Card>
