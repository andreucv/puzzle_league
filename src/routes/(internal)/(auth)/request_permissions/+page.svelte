<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/common/card/Card.svelte';
	import { t, locale } from '$lib/translations';
	import Icon from '@iconify/svelte';

	let { data, form } = $props();

	let permissionType = $state('');
	let reason = $state('');
	let additionalInfo = $state('');
	let isSubmitting = $state(false);

	// Only the Organizer role can be requested through this page.
	const requestableRoles = ['ORGANIZER'];

	// svelte-ignore state_referenced_locally
	const existingRequests: any[] = data.props.requests || [];
	// svelte-ignore state_referenced_locally
	const requestedRoles = existingRequests.map((request: any) => request.role);

	const optionsAvailable = requestableRoles.filter((role) => !requestedRoles.includes(role));

	const roleLabel = (role: string) => $t(`request_permissions.role_${role.toLowerCase()}`);
	const roleDescription = (role: string) =>
		$t(`request_permissions.role_${role.toLowerCase()}_description`);
	const statusLabel = (status: string) => $t(`request_permissions.status_${status.toLowerCase()}`);

	const statusBadge: Record<string, string> = {
		PENDING: 'preset-tonal-warning',
		APPROVED: 'preset-filled-success-500',
		REJECTED: 'preset-filled-error-500'
	};

	const statusIcon: Record<string, string> = {
		PENDING: 'mdi:clock-outline',
		APPROVED: 'mdi:check-circle-outline',
		REJECTED: 'mdi:close-circle-outline'
	};

	const formatDate = (value: string | Date) =>
		new Date(value).toLocaleDateString($locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
</script>

<div class="container mx-auto max-w-2xl space-y-5 py-4">
	<!-- Header -->
	<header class="space-y-1">
		<div class="flex items-center gap-3">
			<span
				class="grid h-10 w-10 place-items-center rounded-full preset-tonal-primary"
				aria-hidden="true"
			>
				<Icon icon="mdi:shield-key-outline" width="1.4rem" height="1.4rem" />
			</span>
			<h1 class="h3 font-medium">{$t('request_permissions.title')}</h1>
		</div>
		<p class="text-surface-600 dark:text-surface-400">
			{$t('request_permissions.subtitle')}
		</p>
	</header>

	{#if form?.success}
		<div class="alert preset-filled-success-500">
			<Icon icon="mdi:check-circle-outline" width="1.3rem" height="1.3rem" />
			<p>{$t('request_permissions.success_message')}</p>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert preset-filled-error-500">
			<Icon icon="mdi:alert-circle-outline" width="1.3rem" height="1.3rem" />
			<p>{form.error}</p>
		</div>
	{/if}

	<!-- Existing requests -->
	{#if existingRequests.length > 0}
		<section class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-surface-500">
				{$t('request_permissions.your_requests_title')}
			</h2>
			<ul class="space-y-2">
				{#each existingRequests as request}
					<li
						class="flex items-center justify-between gap-3 rounded-container border border-surface-200-800 p-3"
					>
						<div class="min-w-0">
							<p class="font-medium">{roleLabel(request.role)}</p>
							<p class="text-xs text-surface-500">
								{$t('request_permissions.requested_on', { date: formatDate(request.createdAt) })}
							</p>
						</div>
						<span class="badge {statusBadge[request.status] ?? 'preset-tonal'} shrink-0 gap-1">
							<Icon icon={statusIcon[request.status] ?? 'mdi:help-circle-outline'} width="1rem" height="1rem" />
							{statusLabel(request.status)}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- New request -->
	{#if optionsAvailable.length === 0}
		<Card>
			<div class="flex flex-col items-center gap-2 py-6 text-center">
				<Icon
					icon="mdi:check-all"
					width="2rem"
					height="2rem"
					class="text-success-500"
				/>
				<p class="font-medium">{$t('request_permissions.all_requested_title')}</p>
				<p class="text-sm text-surface-500">{$t('request_permissions.all_requested_message')}</p>
				<a href="/" class="btn preset-tonal mt-2">{$t('request_permissions.cancel')}</a>
			</div>
		</Card>
	{:else}
		<section class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-surface-500">
				{$t('request_permissions.new_request_title')}
			</h2>
			<div class="card p-6">
				<form
					method="POST"
					class="space-y-6"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
							if (form?.success) {
								permissionType = '';
								reason = '';
								additionalInfo = '';
							}
						};
					}}
				>
					<!-- Role selection as cards -->
					<fieldset class="space-y-2">
						<legend class="mb-1 font-semibold">
							{$t('request_permissions.role_access_request')}
						</legend>
						{#each optionsAvailable as role}
							<label
								class="flex cursor-pointer items-start gap-3 rounded-container border p-3 transition-colors
									{permissionType === role
									? 'border-primary-500 bg-primary-500/5'
									: 'border-surface-200-800 hover:border-surface-400-600'}"
							>
								<input
									class="radio mt-0.5"
									type="radio"
									name="role"
									value={role}
									bind:group={permissionType}
									required
								/>
								<div>
									<p class="font-medium">{roleLabel(role)}</p>
									<p class="text-sm text-surface-500">{roleDescription(role)}</p>
								</div>
							</label>
						{/each}
					</fieldset>

					<!-- Reason -->
					<label class="block space-y-1">
						<span class="font-semibold">{$t('request_permissions.reason_label')}</span>
						<textarea
							class="textarea rounded-lg border border-surface-300 bg-white p-2"
							name="reason"
							rows="4"
							placeholder={$t('request_permissions.reason_placeholder')}
							bind:value={reason}
							required
						></textarea>
					</label>

					<!-- Additional information -->
					<label class="block space-y-1">
						<span class="font-semibold">
							{$t('request_permissions.additional_info_label')}
							<span class="text-sm font-normal text-surface-500">
								{$t('request_permissions.additional_info_optional')}
							</span>
						</span>
						<textarea
							class="textarea rounded-lg border border-surface-300 bg-white p-2"
							name="additionalInfo"
							rows="3"
							placeholder={$t('request_permissions.additional_info_placeholder')}
							bind:value={additionalInfo}
						></textarea>
					</label>

					<input type="hidden" name="userId" value={data.session?.user?.id} />

					<!-- Terms -->
					<label class="flex items-start gap-3">
						<input class="checkbox mt-1" type="checkbox" required />
						<span class="text-base">{$t('request_permissions.terms_checkbox')}</span>
					</label>

					<!-- Actions -->
					<div class="flex justify-end gap-3 border-t border-surface-200-800 pt-4">
						<a href="/" class="btn preset-tonal">{$t('request_permissions.cancel')}</a>
						<button
							type="submit"
							class="btn preset-filled-primary-500"
							disabled={isSubmitting}
						>
							{isSubmitting
								? $t('request_permissions.submitting')
								: $t('request_permissions.submit')}
						</button>
					</div>
				</form>
			</div>
		</section>
	{/if}
</div>
