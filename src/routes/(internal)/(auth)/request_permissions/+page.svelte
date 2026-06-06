<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
	import { t } from '$lib/translations';

	let { data, form } = $props();

	let permissionType = $state('');
	let reason = $state('');
	let additionalInfo = $state('');
	let isSubmitting = $state(false);

	// svelte-ignore state_referenced_locally
	let originalRoles = data.props.filteredRoles;
	// svelte-ignore state_referenced_locally
	let requestedRoles = (data.props.requests || []).map((request: any) => request.role);
	let optionsAvailable = $state(originalRoles.filter((role: any) => !requestedRoles.includes(role)));
    let formDisabled = $state(optionsAvailable.length === 0);
</script>

<div class="container mx-auto py-4 max-w-2xl">
	<GenericTitle text={$t('request_permissions.title')} />

	{#if form?.success}
		<div class="alert preset-filled-success-500 mt-4">
			<p>{$t('request_permissions.success_message')}</p>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert preset-filled-error-500 mt-4">
			<p>{form.error}</p>
		</div>
	{/if}

	<!-- Permission Request Form -->
    <form
        method="POST"
        class="space-y-6 mt-4"
        use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
                await update();
                isSubmitting = false;
                // Reset form on success
                if (form?.success) {
                    permissionType = '';
                    reason = '';
                    additionalInfo = '';
                }
            };
        }}
        class:opacity-50={formDisabled}
	>
        <!-- Permission Type Select -->
        <label class="block">
            <span class="font-semibold">{$t('request_permissions.role_access_request')}</span>
            <select
                class="select"
                name="role"
                bind:value={permissionType}
                required
            >
                <option value="" disabled>{$t('request_permissions.select_role')}</option>
                {#each optionsAvailable as role}
                    <option value={role}>{role}</option>
                {/each}
            </select>
        </label>

        <!-- Reason Textarea -->
        <label class="block">
            <span class="font-semibold">{$t('request_permissions.reason_label')}</span>
            <textarea
                class="textarea p-2"
                name="reason"
                rows="4"
                placeholder={$t('request_permissions.reason_placeholder')}
                bind:value={reason}
                required
            ></textarea>
        </label>

        <!-- Additional Information -->
        <label class="block">
            <span class="font-semibold">{$t('request_permissions.additional_info_label')}</span>
            <span class="text-sm opacity-75">{$t('request_permissions.additional_info_optional')}</span>
            <textarea
                class="textarea p-2"
                name="additionalInfo"
                rows="3"
                placeholder={$t('request_permissions.additional_info_placeholder')}
                bind:value={additionalInfo}
            ></textarea>
        </label>

        <!-- Hidden userId field -->
        <input type="hidden" name="userId" value={data.session?.user?.id} />

        <!-- Terms Checkbox -->
        <label class="flex items-center space-x-2">
            <input class="checkbox" type="checkbox" required />
            <span>{$t('request_permissions.terms_checkbox')}</span>
        </label>

        <!-- Submit Button -->
        <div class="flex justify-end gap-4">
            <a href="/" class="btn preset-tonal border border-surface-500">{$t('request_permissions.cancel')}</a>
            <button
                type="submit"
                class="btn preset-filled-primary-500"
                disabled={isSubmitting || formDisabled}
            >
                {isSubmitting ? $t('request_permissions.submitting') : $t('request_permissions.submit')}
            </button>
        </div>
    </form>
</div>
