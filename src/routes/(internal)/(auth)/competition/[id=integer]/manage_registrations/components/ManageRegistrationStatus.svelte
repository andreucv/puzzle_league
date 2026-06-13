<script lang="ts">
	import Card from '$lib/components/common/card/Card.svelte';
	import LockOpenVariantIcon from '@iconify-svelte/mdi/lock-open-variant';
	import LockIcon from '@iconify-svelte/mdi/lock';
	import { t } from '$lib/translations';

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
		const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 500));

		try {
			const response = await fetch(`/api/competitions/${competition_id}/toggle_registration`, {
				method: 'POST'
			});

			await minLoadingTime;

			if (response.ok) {
				const result = await response.json();
				onStatusChange(result.registrationOpen);
				feedbackSuccess = true;
				feedbackMessage = '';
			} else {
				const errorData = await response.json();
				feedbackSuccess = false;
				feedbackMessage = errorData.error || $t('manage_registrations.toggle_error');
			}
		} catch {
			feedbackSuccess = false;
			feedbackMessage = $t('manage_registrations.unexpected_error');
		} finally {
			loading = false;
		}
	}
</script>

<!-- Registration Toggle -->
<Card>
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			{#if competition_registration_status}
				<LockOpenVariantIcon width="1.2rem" height="1.2rem" class="text-success-500" />
			{:else}
				<LockIcon width="1.2rem" height="1.2rem" class="text-error-500" />
			{/if}
			<p class="text-sm">
				{$t('manage_registrations.registration_label')}
				<span class="font-semibold" class:text-success-500={competition_registration_status} class:text-error-500={!competition_registration_status} data-testid="registration-status" data-open={competition_registration_status}>
					{competition_registration_status ? $t('manage_registrations.status_open') : $t('manage_registrations.status_closed')}
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
				{$t('manage_registrations.updating')}
			{:else}
				{competition_registration_status ? $t('manage_registrations.close_registration') : $t('manage_registrations.open_registration')}
			{/if}
		</button>
	</div>
	{#if !hasCategories}
		<p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
			{$t('manage_registrations.add_categories_first')}
		</p>
	{/if}
	{#if feedbackMessage}
		<aside class="alert {feedbackSuccess ? 'preset-filled-success-500' : 'preset-filled-error-500'} mt-2">
			<p>{feedbackMessage}</p>
		</aside>
	{/if}
</Card>
