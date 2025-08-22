<script lang="ts">
    import { getCategoryTypeName, getPartySizeByCategoryType } from '$lib/utils/category_utils.js';
    let { category = $bindable(), category_types} = $props();

    console.log("CategoryCreatorUpdator category", category);

    let isValid = false;
</script>

<div class="relative group">
    <!-- Background hover effect -->
    <div class="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>

    <!-- Main card container -->
    <div class="relative p-4 border-2 border-surface-200-700 rounded-lg transition-all duration-200 hover:border-surface-300-600">

        <!-- Remove button (floating top-right) -->
        <button
            type="button"
            class="absolute top-2 right-2 btn btn-sm preset-tonal-error border border-error-500 opacity-60 hover:opacity-100 transition-opacity"
            title="Remove category"
        >
            <span>🗑️</span>
        </button>

        <!-- Category Header -->
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Category Name -->
            <label class="label">
                <span class="text-sm font-medium">Category Name *</span>
                <input
                    type="text"
                    class="input bg-primary-50-950"
                    bind:value={category.name}
                    placeholder="Enter category name"
                />
            </label>

            <!-- Category Type -->
            <label class="label">
                <span class="text-sm font-medium">Category Type *</span>
                <select
                    class="select bg-primary-50-950"
                    bind:value={category.type}
                    required
                >
                    <option value="">Select a category type</option>
                    {#each category_types as categoryType}
                        <option value={categoryType}>
                            {getCategoryTypeName(categoryType)}
                        </option>
                    {/each}
                </select>
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
                        class="input bg-primary-50-950"
                        bind:value={category.startTime}
                        required
                    />
                </label>

                <!-- End Time -->
                <label class="label">
                    <span class="text-sm font-medium">End Time *</span>
                    <input
                        type="time"
                        class="input bg-primary-50-950"
                        bind:value={category.endTime}
                        required
                    />
                </label>

                <!-- Max Parties -->
                <label class="label">
                    <span class="text-sm font-medium">Max Parties</span>
                    <input
                        type="number"
                        class="input bg-primary-50-950"
                        bind:value={category.maxParties}
                        min="0"
                        step="1"
                        placeholder="0 for unlimited"
                    />
                </label>
                <!-- Participants per Party -->
                <label class="label">
                    <span class="text-sm font-medium">Participants per Party *</span>
                    <input
                        type="number"
                        class="input bg-primary-50-950"
                        bind:value={category.maxPartySize}
                        min="1"
                        required
                    />
                </label>
            </div>

            <!-- Validation Status -->
            {#if isValid}
                <div class="mt-3 p-2 bg-success-500/10 border border-success-500/30 rounded text-sm text-success-700 dark:text-success-400 flex items-center gap-2">
                    <span>✅</span>
                    <span>Category configuration is valid</span>
                </div>
            {/if}
        {/if}
    </div>
</div>
