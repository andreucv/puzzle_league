<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let permissionType = $state('');
	let reason = $state('');
	let additionalInfo = $state('');
	let isSubmitting = $state(false);

	let originalRoles = data.props.filteredRoles;
	let requestedRoles = (data.props.requests || []).map((request: any) => request.role);
	let optionsAvailable = $state(originalRoles.filter((role: any) => !requestedRoles.includes(role)));
    let formDisabled = $state(optionsAvailable.length === 0);
</script>

<div class="container mx-auto py-4 max-w-2xl">
	<h1 class="h1 font-bold">Request Permissions</h1>

	{#if form?.success}
		<div class="alert preset-filled-success-500 mt-4">
			<p>Your request has been submitted successfully! You will be notified once it's reviewed.</p>
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
            <span class="font-semibold">Role Access Request</span>
            <select
                class="select"
                name="role"
                bind:value={permissionType}
                required
            >
                <option value="" disabled>Select a role</option>
                {#each optionsAvailable as role}
                    <option value={role}>{role}</option>
                {/each}
            </select>
        </label>

        <!-- Reason Textarea -->
        <label class="block">
            <span class="font-semibold">Reason for Request</span>
            <textarea
                class="textarea p-2"
                name="reason"
                rows="4"
                placeholder="Include here which competitions you are planning to organize..."
                bind:value={reason}
                required
            ></textarea>
        </label>

        <!-- Additional Information -->
        <label class="block">
            <span class="font-semibold">Additional Information</span>
            <span class="text-sm opacity-75">(Optional)</span>
            <textarea
                class="textarea p-2"
                name="additionalInfo"
                rows="3"
                placeholder="Any additional details that might help with your request..."
                bind:value={additionalInfo}
            ></textarea>
        </label>

        <!-- Hidden userId field -->
        <input type="hidden" name="userId" value={data.session?.user?.id} />

        <!-- Terms Checkbox -->
        <label class="flex items-center space-x-2">
            <input class="checkbox" type="checkbox" required />
            <span>I understand that my request will be reviewed and I will be notified of the decision</span>
        </label>

        <!-- Submit Button -->
        <div class="flex justify-end gap-4">
            <a href="/" class="btn preset-tonal border border-surface-500">Cancel</a>
            <button
                type="submit"
                class="btn preset-filled-primary-500"
                disabled={isSubmitting || formDisabled}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
        </div>
    </form>
</div>
