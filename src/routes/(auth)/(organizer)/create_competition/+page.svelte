<script lang="ts">
    import type { CategoryType } from "@prisma/client/wasm";
    import { t } from '$lib/translations';

    let {data, form} = $props();

    let selectedLeague = $state('');
    let sameDay = $state(true);

    // Form data
    let competitionName = $state('');
    let description = $state('');
    let location = $state('');
    let startDate = $state('');
    let endDate = $state('');

    // Category configurations
    let categoryConfigs: Array<{
        id: string;
        categoryType: string;
        categoryName: string;
        date: string;
        startTime: string;
        endTime: string;
        participationFee: number;
        maxPartySize: number;
    }> = $state([]);

    function addCategory() {
        const newCategory = {
            id: Math.random().toString(36),
            categoryType: '',
            categoryName: '',
            date: startDate,
            startTime: '09:00',
            endTime: '11:00',
            participationFee: 0,
            maxPartySize: 0
        };
        categoryConfigs.push(newCategory);
    }

    function getPartySize(categoryType : CategoryType) {
        if (categoryType === 'INDIVIDUAL' || categoryType === 'JUNIOR_INDIVIDUAL') {
            return 1;
        } else if (categoryType === 'PAIRS' || categoryType === 'JUNIOR_PAIRS') {
            return 2;
        } else if (categoryType === 'TEAM') {
            return 4;
        } else {
            return 8;
        }
    }
    function removeCategory(categoryId: string) {
        categoryConfigs = categoryConfigs.filter(config => config.id !== categoryId);
    }

    function updateCategoryConfig(categoryId: string, field: string, value: any) {
        categoryConfigs = categoryConfigs.map(config => {
            if (config.id === categoryId) {
                let updatedConfig = { ...config, [field]: value };

                // Update maxPartySize when categoryType changes
                if (field === 'categoryType') {
                    updatedConfig.maxPartySize = getPartySize(value);
                }

                return updatedConfig;
            }
            return config;
        });
    }

    // Update selectedCategories to reflect current categoryConfigs
    let selectedCategories = $derived(
        categoryConfigs
            .filter(config => config.categoryType)
            .map(config => config.categoryType)
    );

</script>

<h4>{$t('create_competition.title')}</h4>
{#if form?.success === false}
    <div class="alert preset-filled-error-500 mt-4">
        <p>{form.message}</p>
    </div>
    {/if}
    {#if form?.success === true}
    <div class="alert preset-filled-success-500 mt-4">
        <p>{form.message}</p>
        <p>Go to competition <a href={`/competitions/competition_details/${form.competitionId}`}>here</a>.</p>
    </div>
{/if}
<form method="POST" action="?/create_competition" enctype="multipart/form-data" class="max-w-6xl mx-auto space-y-4 mb-4">
    <!-- Basic Information Section -->
    <section class="">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <label class="label">
                <span class="text-sm font-medium">Competition Name *</span>
                <input
                    type="text"
                    name="competition_name"
                    bind:value={competitionName}
                    placeholder="Enter competition name"
                    required
                />
            </label>

            <label class="label">
                <span class="text-sm font-medium">
                    Location
                </span>
                <input
                    type="text"
                    name="location"
                    bind:value={location}
                    placeholder="Enter venue location"
                />
            </label>

            <label class="label">
                <span class="text-sm font-medium">Description</span>
                <input
                    name="description"
                    bind:value={description}
                    placeholder="Describe your competition..."
                />
            </label>

            <!-- <label class="label">
                <span class="text-sm font-medium">League</span>
                <select
                    name="league_id"
                    bind:value={selectedLeague}
                >
                    <option value="">Select a league</option>
                    {#each data.props.leagues as league}
                        <option value={league.id}>{league.name}</option>
                    {/each}
                </select>
            </label> -->
        </div>
    </section>

    <!-- Date Configuration Section -->
    <section class="">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div class="flex flex-col sm:flex-row gap-4 w-full">
                <label class="label flex-1">
                    <span class="text-sm font-medium mb-2">Start Date *</span>
                    <input
                        type="date"
                        name="start_date"
                        bind:value={startDate}
                        required
                    />
                </label>

                <label class="label flex-1">
                    <span class="text-sm font-medium mb-2">End Date</span>
                    <input
                        type="date"
                        name="end_date"
                        bind:value={endDate}
                        min={startDate}
                    />
                </label>
            </div>
        </div>
    </section>

    <!-- Categories Section -->
    <section class="">
        <div class="flex items-center justify-end gap-2">
            <button
                type="button"
                class="btn preset-filled-primary-500 btn-sm"
                onclick={addCategory}
            >
                <span>➕</span>
                <span>Add Category</span>
            </button>
        </div>

        <div class="space-y-4 mt-4">
            {#each categoryConfigs as category (category.id)}
                <div class="relative group">
                    <div class="absolute inset-0 bg-linear-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
                    <div class="relative p-4 border-2 border-surface-200-700 rounded-lg transition-all duration-200 hover:border-surface-300-600">
                        <!-- Floating remove button -->
                        <button
                            type="button"
                            class="absolute top-2 right-2 btn btn-sm preset-tonal-error border border-error-500 opacity-60 hover:opacity-100 transition-opacity"
                            onclick={() => removeCategory(category.id)}
                        >
                            <span>🗑️</span>
                        </button>

                        <div class="mb-4">
                            <label class="label">
                                <span class="text-sm font-medium">Category Type *</span>
                                <select
                                    value={category.categoryType}
                                    onchange={(e) => updateCategoryConfig(category.id, 'categoryType', e.currentTarget.value)}
                                    required
                                >
                                    <option value="">Select a category type</option>
                                    {#each data.props.categories as categoryType}
                                        <option
                                            value={categoryType}
                                            disabled={selectedCategories.includes(categoryType) && category.categoryType !== categoryType}
                                        >
                                            {categoryType.replace(/_/g, ' ')}
                                        </option>
                                    {/each}
                                </select>
                            </label>
                        </div>

                        {#if category.categoryType}
                            <div class="grid grid-cols-2 gap-4">
                                {#if !sameDay}
                                    <label class="label col-span-2">
                                        <span class="text-sm">Date</span>
                                        <input
                                            type="date"
                                            value={category.date}
                                            onchange={(e) => updateCategoryConfig(category.id, 'date', e.currentTarget.value)}
                                            min={startDate}
                                            max={endDate || startDate}
                                        />
                                    </label>
                                {/if}

                                <label class="label">
                                    <span class="text-sm">Start Time</span>
                                    <input
                                        type="time"
                                        value={category.startTime}
                                        onchange={(e) => updateCategoryConfig(category.id, 'startTime', e.currentTarget.value)}
                                    />
                                </label>

                                <label class="label">
                                    <span class="text-sm">End Time</span>
                                    <input
                                        type="time"
                                        value={category.endTime}
                                        onchange={(e) => updateCategoryConfig(category.id, 'endTime', e.currentTarget.value)}
                                    />
                                </label>

                                <label class="label col-span-2">
                                    <span class="text-sm">Participation Fee (Eur)</span>
                                    <input
                                        type="number"
                                        value={category.participationFee}
                                        onchange={(e) => updateCategoryConfig(category.id, 'participationFee', parseFloat(e.currentTarget.value))}
                                        min="0"
                                        step="0.01"
                                    />
                                </label>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}

            {#if categoryConfigs.length === 0}
                <div class="text-center py-8 px-4 bg-surface-200-700 border-2 border-dashed border-surface-300-600 rounded-lg">
                    <p class="text-surface-600 dark:text-surface-400 mb-4">No categories added yet</p>
                    <button
                        type="button"
                        class="btn preset-filled-primary-500"
                        onclick={addCategory}
                    >
                        <span>➕</span>
                        <span>Add Your First Category</span>
                    </button>
                </div>
            {/if}
        </div>
    </section>

    <!-- Hidden inputs for category data -->
    <input type="hidden" name="selected_categories" value={JSON.stringify(selectedCategories)} />
    <input type="hidden" name="category_configs" value={JSON.stringify(categoryConfigs.map(({ categoryType, ...rest }) => ({ ...rest, type: categoryType })))} />

    <!-- Submit Button -->
    <div class="flex justify-end gap-4 pt-4 border-t-2 border-surface-200-700">
        <a href="/competitions" class="btn preset-tonal-surface border border-surface-500">Cancel</a>
        <button
            type="submit"
            class="btn preset-filled-primary-500 btn-lg"
            disabled={!competitionName  || categoryConfigs.length == 0}
        >
            <span>Create Competition</span>
        </button>
    </div>
</form>

<style lang="postcss">
    @reference "../../../../app.css";

    input, select {
        @apply w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 text-black focus:border-indigo-500 focus:bg-white focus:outline-none;
    }
</style>
