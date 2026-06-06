<script lang="ts">
    import Icon from '@iconify/svelte';
    import { goto } from '$app/navigation';
    import { tick } from 'svelte';
    import { superForm } from 'sveltekit-superforms';
    import { FileUpload } from '@skeletonlabs/skeleton-svelte';
    import { CldImage } from 'svelte-cloudinary';
    import LoadingOverlay from '$lib/components/common/LoadingOverlay.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import { t } from '$lib/translations';

    let { data } = $props();

    let isSubmitting = $state(false);
    let loadingMessage = $state('');
    let submissionStartTime = 0;
    const MIN_LOADING_TIME = 2000;

    async function hideLoading() {
        const elapsed = Date.now() - submissionStartTime;
        if (elapsed < MIN_LOADING_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
        }
        isSubmitting = false;
        loadingMessage = '';
    }

    let selected_image_src = $state<string | undefined>(undefined);
    let formErrors = $state<Record<string, string>>({});

    // svelte-ignore state_referenced_locally
    const { form, errors, message, enhance } = superForm(data.form, {
        dataType: 'json',
        async onSubmit({ cancel }) {
            submissionStartTime = Date.now();
            isSubmitting = true;
            loadingMessage = 'Validating...';

            const isValid = validateForm();
            if (!isValid) {
                isSubmitting = false;
                loadingMessage = '';
                await focusFirstInvalidField();
                cancel();
                return;
            }

            loadingMessage = selected_image_src && !selected_image_src.includes('puzzles') ? 'Uploading image...' : 'Saving puzzle...';
        },
        async onResult({ result }) {
            await hideLoading();
            if (result.type === 'success' && result.data?.form?.message?.success) {
                await goto('/puzzles');
            }
        },
        async onError() {
            await hideLoading();
            await focusFirstInvalidField();
        },
        async onUpdated({ form }) {
            await hideLoading();
            if (!form.valid) await focusFirstInvalidField();
        }
    });

    const isEdit = !!$form.id;

    if (isEdit && $form.image_cld_id) {
        selected_image_src = $form.image_cld_id as string;
    }

    $effect(() => {
        $form.image_cld_id = selected_image_src;
    });

    function validateForm(): boolean {
        let isValid = true;
        formErrors = {};

        if (!$form.pieces || $form.pieces < 1) {
            formErrors.pieces = 'Number of pieces is required and must be at least 1';
            isValid = false;
        }

        if (!$form.brand || $form.brand.trim() === '') {
            formErrors.brand = 'Brand is required';
            isValid = false;
        }

        if (!$form.barcode || $form.barcode.trim() === '') {
            formErrors.barcode = 'Barcode is required';
            isValid = false;
        }

        return isValid;
    }

    async function focusFirstInvalidField() {
        await tick();
        const firstError = document.querySelector<HTMLSpanElement>('span.invalid');
        if (firstError) {
            const container = firstError.closest('.label');
            const input = container?.querySelector<HTMLInputElement>('input, select, textarea');
            if (input) {
                input.focus();
                input.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    function handleImageChange(event: { acceptedFiles: File[] }) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = e.target?.result;
            if (typeof image === 'string') {
                selected_image_src = image;
            }
        };
        reader.readAsDataURL(event.acceptedFiles[0]);
    }

    // Delete confirmation
    let showDeleteConfirmation = $state(false);
    let isDeleting = $state(false);

    async function handleDelete() {
        isDeleting = true;
        const formEl = document.createElement('form');
        formEl.method = 'POST';
        formEl.action = '?/delete_puzzle';
        document.body.appendChild(formEl);
        formEl.submit();
    }
</script>

<TitleBackButton href="/puzzles" text={isEdit ? $t('puzzles.edit_title') : $t('puzzles.add_title')} />

<div class="container mx-auto relative">
    <div class="space-y-3 mb-2">
        <p class="text-surface-600-400">
            {isEdit ? 'Update puzzle details' : 'Enter puzzle details to add it to the catalog'}
        </p>
    </div>

    <form
        method="POST"
        action="?/save_puzzle"
        class="space-y-4"
        novalidate
        use:enhance
    >
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:puzzle" width="1.5rem" height="1.5rem" class="text-primary-500" />
                Puzzle Details
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="label">
                    <span>Name</span>
                    <input
                        type="text"
                        name="name"
                        bind:value={$form.name}
                        maxlength="120"
                        placeholder="e.g. Starry Night"
                        class="input rounded-lg bg-primary-50-950"
                    />
                </div>

                <div class="label">
                    <span>Pieces *</span>
                    <input
                        type="number"
                        name="pieces"
                        bind:value={$form.pieces}
                        min="1"
                        placeholder="e.g. 500"
                        class="input rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.pieces || $errors.pieces}
                        oninput={() => { if (formErrors.pieces) formErrors.pieces = ''; }}
                    />
                    {#if formErrors.pieces}
                        <span class="invalid text-error-500 text-sm">{formErrors.pieces}</span>
                    {:else if $errors.pieces}
                        <span class="invalid text-error-500 text-sm">{$errors.pieces}</span>
                    {/if}
                </div>

                <div class="label">
                    <span>Brand *</span>
                    <input
                        type="text"
                        name="brand"
                        bind:value={$form.brand}
                        maxlength="120"
                        placeholder="e.g. Ravensburger"
                        class="input rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.brand || $errors.brand}
                        oninput={() => { if (formErrors.brand) formErrors.brand = ''; }}
                    />
                    {#if formErrors.brand}
                        <span class="invalid text-error-500 text-sm">{formErrors.brand}</span>
                    {:else if $errors.brand}
                        <span class="invalid text-error-500 text-sm">{$errors.brand}</span>
                    {/if}
                </div>

                <div class="label">
                    <span>Barcode *</span>
                    <input
                        type="text"
                        name="barcode"
                        bind:value={$form.barcode}
                        maxlength="120"
                        placeholder="e.g. 4005556170654"
                        class="input rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.barcode || $errors.barcode}
                        oninput={() => { if (formErrors.barcode) formErrors.barcode = ''; }}
                    />
                    {#if formErrors.barcode}
                        <span class="invalid text-error-500 text-sm">{formErrors.barcode}</span>
                    {:else if $errors.barcode}
                        <span class="invalid text-error-500 text-sm">{$errors.barcode}</span>
                    {/if}
                </div>

                <div class="label">
                    <span>Serial Number</span>
                    <input
                        type="text"
                        name="serialNumber"
                        bind:value={$form.serialNumber}
                        maxlength="120"
                        placeholder="e.g. 17065"
                        class="input rounded-lg bg-primary-50-950"
                    />
                </div>

                <div class="label">
                    <span>{$t('puzzles.image')}</span>
                    {#if selected_image_src === undefined}
                        <FileUpload accept="image/*" maxFiles={1} onFileChange={handleImageChange}>
                            <FileUpload.Dropzone>
                                <FileUpload.Trigger class="btn preset-tonal">{$t('puzzles.choose_image')}</FileUpload.Trigger>
                            </FileUpload.Dropzone>
                            <FileUpload.HiddenInput name="puzzle_image" />
                        </FileUpload>
                    {:else}
                        <div class="flex flex-col items-center gap-2">
                            {#if selected_image_src?.includes('puzzles')}
                                <CldImage src={selected_image_src} width="400" height="400" alt="Puzzle" class="rounded-lg max-h-48 object-contain" />
                            {:else}
                                <img src={selected_image_src} alt="Puzzle" class="rounded-lg max-h-48 object-contain" />
                            {/if}
                            <button
                                type="button"
                                class="btn preset-filled-error-500 rounded-lg"
                                onclick={() => selected_image_src = undefined}
                            >
                                <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                Remove Image
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Alert Messages -->
        {#if $message && $message.success === true}
            <div class="alert preset-filled-success-500 rounded-lg mt-4 p-2 flex items-center">
                <Icon icon="mdi:check-circle" width="1.5rem" height="1.5rem" />
                <p class="p-2">{$message.message}</p>
            </div>
        {:else if $message && $message.success === false}
            <div class="alert preset-filled-error-500 rounded-lg mt-4 p-2 flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
                <p>{$message.message}</p>
            </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex justify-between mt-4">
            <div>
                {#if isEdit}
                    <button
                        type="button"
                        class="btn preset-filled-error-500 rounded-lg"
                        onclick={() => showDeleteConfirmation = true}
                        disabled={isSubmitting}
                    >
                        <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                        Delete Puzzle
                    </button>
                {/if}
            </div>
            <div class="flex gap-4">
                <a href="/puzzles" class="btn preset-tonal rounded-lg" class:pointer-events-none={isSubmitting} class:opacity-50={isSubmitting}>
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                    Cancel
                </a>
                <button
                    type="submit"
                    class="btn preset-filled-primary-500 rounded-lg"
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <Icon icon="mdi:loading" width="1.2rem" height="1.2rem" class="animate-spin" />
                        {loadingMessage || 'Saving...'}
                    {:else}
                        <Icon icon="mdi:content-save" width="1.2rem" height="1.2rem" />
                        {isEdit ? 'Update Puzzle' : 'Save Puzzle'}
                    {/if}
                </button>
            </div>
        </div>
    </form>

    <LoadingOverlay show={isSubmitting} message={loadingMessage} />
</div>

<!-- Delete Confirmation Dialog -->
{#if showDeleteConfirmation}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
        <div class="card preset-filled-surface-100-900 p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
            <h3 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:alert" width="1.5rem" height="1.5rem" class="text-warning-500" />
                Confirm Delete
            </h3>
            <p class="mb-6 text-surface-600-400">
                Are you sure you want to delete this puzzle? It will be unlinked from all categories.
            </p>
            <div class="flex justify-end gap-4">
                <button type="button" class="btn preset-tonal rounded-lg" onclick={() => showDeleteConfirmation = false}>
                    Cancel
                </button>
                <button type="button" class="btn preset-filled-error-500 rounded-lg" onclick={handleDelete} disabled={isDeleting}>
                    {#if isDeleting}
                        <Icon icon="mdi:loading" width="1.2rem" height="1.2rem" class="animate-spin" />
                        Deleting...
                    {:else}
                        <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                        Delete
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
