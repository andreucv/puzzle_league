<script lang="ts">
    import { type Prisma } from '@prisma/client';
    import { getCategoryTypeName, getPartySizeByCategoryType } from '$lib/utils/category_utils.js';

    // Props
    let {
        category,
        categoryId,
        competitionStartDate,
        onRemove,
        onUpdate,
        showRemoveButton = true,
        isNew = false,
        categoryTypes = []
    }: {
        category: Prisma.CategoryUncheckedCreateInput,
        categoryId: number,
        competitionStartDate?: Date,
        onRemove?: (id: number) => void,
        onUpdate?: (category: Prisma.CategoryUncheckedCreateInput) => void,
        showRemoveButton?: boolean,
        isNew?: boolean
        categoryTypes?: string[]
    } = $props();

    // Local state for form validation
    let formErrors = $state<Record<string, string>>({});

    // Computed values
    let isValid = $derived(
        category.name &&
        category.type &&
        category.startTime &&
        category.endTime &&
        category.maxParties !== undefined &&
        category.maxParties !== null &&
        category.maxParties >= 0 &&
        category.maxPartySize !== undefined &&
        category.maxPartySize !== null &&
        category.maxPartySize > 0
    );

    // Helper function to update category field
    function updateCategory(field: keyof Prisma.CategoryUncheckedCreateInput, value: any) {
        const updatedCategory = { ...category, [field]: value };

        // Auto-update maxPartySize when type changes
        if (field === 'type') {
            updatedCategory.maxPartySize = getPartySizeByCategoryType(value);
        }

        // Handle time updates with proper date conversion
        if (field === 'startTime' || field === 'endTime') {
            if (competitionStartDate && value) {
                try {
                    const [hours, minutes] = value.split(':').map(Number);
                    const dateTime = new Date(competitionStartDate);
                    dateTime.setHours(hours, minutes);
                    updatedCategory[field] = dateTime;
                } catch (e) {
                    console.error('Error parsing time:', e);
                    updatedCategory[field] = value;
                }
            } else {
                updatedCategory[field] = value;
            }
        }

        // Update the category via callback
        onUpdate?.(updatedCategory);
        validateField(field, value);
    }

    // Validation logic
    function validateField(field: string, value: any) {
        formErrors = { ...formErrors };

        switch (field) {
            case 'name':
                if (!value || value.trim().length === 0) {
                    formErrors.name = 'Category name is required';
                } else if (value.trim().length < 2) {
                    formErrors.name = 'Category name must be at least 2 characters';
                } else {
                    delete formErrors.name;
                }
                break;
            case 'type':
                if (!value) {
                    formErrors.type = 'Category type is required';
                } else {
                    delete formErrors.type;
                }
                break;
            case 'startTime':
                if (!value) {
                    formErrors.startTime = 'Start time is required';
                } else {
                    delete formErrors.startTime;
                }
                break;
            case 'endTime':
                if (!value) {
                    formErrors.endTime = 'End time is required';
                } else if (category.startTime && value <= category.startTime) {
                    formErrors.endTime = 'End time must be after start time';
                } else {
                    delete formErrors.endTime;
                }
                break;
            case 'maxParties':
                if (value !== undefined && value < 0) {
                    formErrors.maxParties = 'Max parties cannot be negative';
                } else {
                    delete formErrors.maxParties;
                }
                break;
            case 'maxPartySize':
                if (value === undefined || value < 1) {
                    formErrors.maxPartySize = 'Participants per party must be at least 1';
                } else {
                    delete formErrors.maxPartySize;
                }
                break;
        }
    }

    // Helper to convert datetime to time string for input
    function getTimeString(dateTime: Date | string | undefined): string {
        if (!dateTime) return '';

        if (typeof dateTime === 'string') {
            // If it's already a time string (HH:MM), return it
            if (dateTime.match(/^\d{2}:\d{2}$/)) {
                return dateTime;
            }
            // If it's a date string, parse and extract time
            const date = new Date(dateTime);
            if (isNaN(date.getTime())) return '';
            return date.toTimeString().slice(0, 5);
        }

        // If it's a Date object
        if (isNaN(dateTime.getTime())) return '';
        return dateTime.toTimeString().slice(0, 5); // HH:MM format
    }
</script>

<div class="relative group">
    <!-- Background hover effect -->
    <div class="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>

    <!-- Main card container -->
    <div class="relative p-4 border-2 border-surface-200-700 rounded-lg transition-all duration-200 hover:border-surface-300-600 {isNew ? 'border-primary-500/50' : ''}">

        <!-- Remove button (floating top-right) -->
        {#if showRemoveButton && onRemove}
            <button
                type="button"
                class="absolute top-2 right-2 btn btn-sm preset-tonal-error border border-error-500 opacity-60 hover:opacity-100 transition-opacity"
                onclick={() => onRemove?.(categoryId)}
                title="Remove category"
            >
                <span>🗑️</span>
            </button>
        {/if}

        <!-- Category Header -->
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Category Name -->
            <label class="label">
                <span class="text-sm font-medium">Category Name *</span>
                <input
                    type="text"
                    class="input {formErrors.name ? 'border-error-500' : ''}"
                    value={category.name || ''}
                    onchange={(e) => updateCategory('name', e.currentTarget.value)}
                    placeholder="Enter category name"
                />
                {#if formErrors.name}
                    <span class="text-error-500 text-xs mt-1">{formErrors.name}</span>
                {/if}
            </label>

            <!-- Category Type -->
            <label class="label">
                <span class="text-sm font-medium">Category Type *</span>
                <select
                    class="select {formErrors.type ? 'border-error-500' : ''}"
                    value={category.type || ''}
                    onchange={(e) => updateCategory('type', e.currentTarget.value)}
                    required
                >
                    <option value="">Select a category type</option>
                    {#each categoryTypes as categoryType}
                        <option value={categoryType}>
                            {getCategoryTypeName(categoryType)}
                        </option>
                    {/each}
                </select>
                {#if formErrors.type}
                    <span class="text-error-500 text-xs mt-1">{formErrors.type}</span>
                {/if}
            </label>
        </div>

        <!-- Category Details (only show when type is selected) -->
        {#if category.type}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Start Time -->
                <label class="label">
                    <span class="text-sm font-medium">Start Time *</span>
                    <input
                        type="time"
                        class="input {formErrors.startTime ? 'border-error-500' : ''}"
                        value={getTimeString(category.startTime)}
                        onchange={(e) => updateCategory('startTime', e.currentTarget.value)}
                        required
                    />
                    {#if formErrors.startTime}
                        <span class="text-error-500 text-xs mt-1">{formErrors.startTime}</span>
                    {/if}
                </label>

                <!-- End Time -->
                <label class="label">
                    <span class="text-sm font-medium">End Time *</span>
                    <input
                        type="time"
                        class="input {formErrors.endTime ? 'border-error-500' : ''}"
                        value={getTimeString(category.endTime)}
                        onchange={(e) => updateCategory('endTime', e.currentTarget.value)}
                        required
                    />
                    {#if formErrors.endTime}
                        <span class="text-error-500 text-xs mt-1">{formErrors.endTime}</span>
                    {/if}
                </label>

                <!-- Max Parties -->
                <label class="label">
                    <span class="text-sm font-medium">Max Parties</span>
                    <input
                        type="number"
                        class="input {formErrors.maxParties ? 'border-error-500' : ''}"
                        value={category.maxParties || 0}
                        onchange={(e) => updateCategory('maxParties', parseInt(e.currentTarget.value))}
                        min="0"
                        step="1"
                        placeholder="0 for unlimited"
                    />
                    {#if formErrors.maxParties}
                        <span class="text-error-500 text-xs mt-1">{formErrors.maxParties}</span>
                    {/if}
                </label>
                <!-- Participants per Party -->
                <label class="label">
                    <span class="text-sm font-medium">Participants per Party *</span>
                    <input
                        type="number"
                        class="input {formErrors.maxPartySize ? 'border-error-500' : ''}"
                        value={category.maxPartySize || 1}
                        onchange={(e) => updateCategory('maxPartySize', parseInt(e.currentTarget.value))}
                        min="1"
                        required
                    />
                    {#if formErrors.maxPartySize}
                        <span class="text-error-500 text-xs mt-1">{formErrors.maxPartySize}</span>
                    {/if}
                </label>
            </div>


            <!-- Validation Status -->
            {#if Object.keys(formErrors).length > 0}
                <div class="mt-3 p-2 bg-error-500/10 border border-error-500/30 rounded text-sm text-error-700 dark:text-error-400">
                    <span class="font-medium">Please fix the following issues:</span>
                    <ul class="list-disc list-inside mt-1">
                        {#each Object.values(formErrors) as error}
                            <li>{error}</li>
                        {/each}
                    </ul>
                </div>
            {:else if isValid}
                <div class="mt-3 p-2 bg-success-500/10 border border-success-500/30 rounded text-sm text-success-700 dark:text-success-400 flex items-center gap-2">
                    <span>✅</span>
                    <span>Category configuration is valid</span>
                </div>
            {/if}
        {/if}
    </div>
</div>
