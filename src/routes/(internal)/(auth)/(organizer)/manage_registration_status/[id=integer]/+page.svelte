<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatTime } from '$lib/utils/datetime_utils';
	import { getCategoryTypeName } from '$lib/utils/category_utils';
	import { getCompetitionStatusLabel } from '$lib/utils/competition_utils';
    import { getCountryFlag } from '$lib/country_utils.js';

	let { data } = $props();

	let competition = $state(data.props.competition);
	let categories = $state(data.props.categories);
	let loading = $state(false);
	let feedbackMessage = $state('');
	let feedbackSuccess = $state(false);

	const startDate = $derived(new Date(competition.startDate));
	const endDate = $derived(new Date(competition.endDate));
	const isMultiDay = $derived(startDate.toDateString() !== endDate.toDateString());

	async function toggleRegistration() {
		loading = true;
		feedbackMessage = '';

		try {
			const response = await fetch(`/api/competitions/${competition.id}/toggle_registration`, {
				method: 'POST'
			});

			// Enforce 2-second minimum loading state
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

<h4 class="text-xl font-bold mb-6">Manage Registration Status</h4>

<!-- Competition Overview -->
<div class="space-y-4 mb-6">
	<div class="flex justify-between items-start">
		<h5 class="text-lg font-semibold">{competition.name}</h5>
		<span class="badge preset-filled-primary-500">
			{getCompetitionStatusLabel(competition.status) || competition.status}
		</span>
	</div>

	{#if competition.description}
		<p class="text-sm text-surface-600 dark:text-surface-400">{competition.description}</p>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
		{#if competition.location}
			<div class="flex items-center gap-2">
				<Icon icon="mdi:map-marker" width="1.2rem" height="1.2rem" class="text-primary-500" />
				<span>{competition.location}</span>
			</div>
		{/if}
		{#if competition.country}
			<div class="flex items-center gap-2">
				<Icon icon="mdi:earth" width="1.2rem" height="1.2rem" class="text-primary-500" />
				<span>{competition.country} {getCountryFlag(competition.country)}{competition.postalCode ? ` - ${competition.postalCode}` : ''}</span>
			</div>
		{/if}
		<div class="flex items-center gap-2">
			<Icon icon="mdi:calendar-clock" width="1.2rem" height="1.2rem" class="text-primary-500" />
			<span>
				{startDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
				{#if isMultiDay}
					- {endDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
				{/if}
			</span>
		</div>
	</div>
</div>

<!-- Categories Summary -->
{#if categories.length > 0}
	<div class="mb-6">
		<h5 class="text-lg font-semibold mb-4">
			<Icon icon="mdi:format-list-bulleted" width="1.2rem" height="1.2rem" class="inline text-primary-500" />
			{categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
		</h5>
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each categories as category}
				<div class="card preset-outlined-surface-200-800 p-4">
					<div class="flex justify-between items-start mb-2">
						<span class="font-semibold">{category.name}</span>
						<span class="badge preset-tonal-primary text-xs">{getCategoryTypeName(category.type)}</span>
					</div>
					<div class="space-y-1 text-sm text-surface-600 dark:text-surface-400">
						<div class="flex items-center gap-2">
							<Icon icon="mdi:clock-start" width="1rem" height="1rem" />
							<span>{formatTime(new Date(category.startTime))} - {formatTime(new Date(category.endTime))}</span>
						</div>
						{#if category.maxPartySize}
							<div class="flex items-center gap-2">
								<Icon icon="mdi:account-group" width="1rem" height="1rem" />
								<span>Team size: {category.maxPartySize}</span>
							</div>
						{/if}
						<div class="flex items-center gap-2">
							<Icon icon="mdi:account-check" width="1rem" height="1rem" />
							<span>{category.totalRecords} registered{category.maxParties ? ` / ${category.maxParties} max` : ''}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Registration Toggle -->
<div class="card p-6 space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h5 class="text-lg font-semibold">Registration Status</h5>
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

<!-- Actions -->
<div class="mt-6 flex flex-col sm:flex-row justify-center">
	<a href="/competition/edit/{competition.id}" class="btn w-full sm:w-auto preset-filled-primary-500">
		<Icon icon="mdi:pencil" width="1.2rem" height="1.2rem" />
		Edit Competition
	</a>
</div>
