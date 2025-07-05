<script lang="ts">
    import { type Competition, type Category, type Prisma} from "@prisma/client";
    import { t } from '$lib/translations';
    import { getPartySizeByCategoryType } from "$lib/utils/category_utils.js";

    let {data, form} = $props();

    let new_competition = $state<Prisma.CompetitionCreateInput>({
        name: '',
        startDate: '',
        endDate: '',
        creator: { connect: { id: data.user.id } }
    });

    // Category configurations
    let category_counter = $state(0);
    let category_map: Map<number, Prisma.CategoryUncheckedCreateInput> = $state(new Map<number, Prisma.CategoryUncheckedCreateInput>());

    // some things clear:
    // We want to store Date as datetime objects in the database
    // Preferrably we want to store the UTC time in the database
    // We want to display the time in the local time of the user

    function addCategory() {
        const newCategory: Prisma.CategoryUncheckedCreateInput = {
            name: '',
            type: 'INDIVIDUAL',
            startTime: '',
            endTime: '',
            maxParties: 0,
            maxPartySize: 1,
            competitionId: -1
        };
        const id = category_counter++;
        category_map.set(id, newCategory);
        category_map = new Map(category_map);
    }

    function removeCategory(categoryId: number) {
        category_map.delete(categoryId);
    }

    function updateCompetition(field: string, value: any) {
        new_competition = { ...new_competition, [field]: value } as Prisma.CompetitionCreateInput;
        if (field === 'startDate') {
            console.log("updateCompetition startDate param: ", value)
            new_competition.startDate = new Date(value);
            new_competition.endDate   = new Date(value);
            console.log("updateCompetition startDate: startDate", new_competition.startDate);
            console.log("updateCompetition startDate: endDate", new_competition.endDate);
            // Update all category dates when competition start date changes
            updateCategoryDates(new_competition.startDate);
        }
        console.log("after updateCompetition startDate: new_competition", $state.snapshot(new_competition));
        console.log("after updateCompetition startDate: category_map", category_map);
    }

    function updateCategoryDates(dateUTC: Date) {
        console.log("updateCategoryDates: dateUTC", dateUTC);
        category_map.forEach((category, categoryId) => {
            if (category.startTime) {
                console.log('startTime', category.startTime);
                const start_hours = (new Date(category.startTime)).getHours();
                const start_minutes = (new Date(category.startTime)).getMinutes();
                category.startTime = (new Date(new Date(dateUTC).setHours(start_hours, start_minutes)));
                console.log('updated startTime', category.startTime);
            }
            if (category.endTime) {
                console.log('endTime', category.endTime);
                const end_hours = (new Date(category.endTime)).getHours();
                const end_minutes = (new Date(category.endTime)).getMinutes();
                category.endTime = (new Date(new Date(dateUTC).setHours(end_hours, end_minutes)));
                console.log('updated endTime', category.endTime);
            }
            category_map.set(categoryId, category);
        });
        category_map = new Map(category_map); // This triggers reactivity
        console.log("after updateCategoryDates: category_map", category_map);
    }

    function updateCategory(categoryId: number, field: string, value: any) {
        if (category_map.has(categoryId)) {
            let updatedCategory = { ...category_map.get(categoryId), [field]: value } as Prisma.CategoryUncheckedCreateInput;

            // Update maxPartySize when type changes
            if (field === 'type') {
                updatedCategory.maxPartySize = getPartySizeByCategoryType(value);
            }

            try {
                if (field === 'startTime') {
                    console.log('startTime', value);
                    const categoryStartTime = new Date(new Date(new_competition.startDate as Date).setHours(parseInt(value.split(':')[0]), parseInt(value.split(':')[1])));
                    console.log('categoryStartTime', categoryStartTime);
                    updatedCategory.startTime = categoryStartTime
                }

                if (field === 'endTime') {
                    console.log('startTime', value);
                    const categoryEndTime = new Date(new Date(new_competition.startDate as Date).setHours(parseInt(value.split(':')[0]), parseInt(value.split(':')[1])));
                    console.log('categoryEndTime', categoryEndTime);
                    updatedCategory.endTime = categoryEndTime
                }
            } catch (e) {
                console.error(e);
            }
            category_map.set(categoryId, updatedCategory);
            category_map = new Map(category_map); // This triggers reactivity
        }
        console.log(category_map);
    }
</script>

<h4>{$t('create_competition.title')}</h4>
{#if form?.success === false}
    <div class="alert preset-filled-error-500 mt-4">
        <p>{form.message}</p>
    </div>
    {/if}
    {#if form?.success === true}
    <div class="alert preset-filled-success-500 rounded mt-4 p-2">
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
                    onchange={(e) => updateCompetition('name', e.currentTarget.value)}
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
                    onchange={(e) => updateCompetition('location', e.currentTarget.value)}
                    placeholder="Enter venue location"
                />
            </label>

            <label class="label">
                <span class="text-sm font-medium">Description</span>
                <input
                    name="description"
                    onchange={(e) => updateCompetition('description', e.currentTarget.value)}
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
                        onchange={(e) => updateCompetition('startDate', e.currentTarget.value)}
                        required
                    />
                </label>

                <!-- <label class="label flex-1">
                    <span class="text-sm font-medium mb-2">End Date</span>
                    <input
                        type="date"
                        name="end_date"
                        onchange={(e) => updateCompetition('endDate', new Date(e.currentTarget.value))}
                        min={new_competition.startDate.toString()}
                    />
                </label> -->
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
            {#each category_map.entries() as [categoryId, category]}
                <div class="relative group">
                    <div class="absolute inset-0 bg-linear-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
                    <div class="relative p-4 border-2 border-surface-200-700 rounded-lg transition-all duration-200 hover:border-surface-300-600">
                        <!-- Floating remove button -->
                        <button
                            type="button"
                            class="absolute top-2 right-2 btn btn-sm preset-tonal-error border border-error-500 opacity-60 hover:opacity-100 transition-opacity"
                            onclick={() => removeCategory(categoryId)}
                        >
                            <span>🗑️</span>
                        </button>

                        <div class="mb-4">
                            <label class="label">
                                <span class="text-sm font-medium">Category Type *</span>
                                <select
                                    value={category.type}
                                    onchange={(e) => updateCategory(categoryId, 'type', e.currentTarget.value)}
                                    required
                                >
                                    <option value="">Select a category type</option>
                                    {#each Object.entries(data.props.categoryTypes || {}) as [categoryType, categoryName]}
                                        <option value={categoryName}>
                                            {categoryName.replace(/_/g, ' ')}
                                        </option>
                                    {/each}
                                </select>
                            </label>
                        </div>

                        {#if category.type !== null}
                            <div class="grid grid-cols-2 gap-4">
                                <label class="label">
                                    <span class="text-sm">Start Time</span>
                                    <input
                                        type="time"
                                        onchange={(e) => updateCategory(categoryId, 'startTime', e.currentTarget.value)}
                                    />
                                </label>

                                <label class="label">
                                    <span class="text-sm">End Time</span>
                                    <input
                                        type="time"
                                        onchange={(e) => updateCategory(categoryId, 'endTime', e.currentTarget.value)}
                                    />
                                </label>

                                <label class="label col-span-2">
                                    <span class="text-sm">Max Parties</span>
                                    <input
                                        type="number"
                                        value={category.maxParties}
                                        onchange={(e) => updateCategory(categoryId, 'maxParties', parseInt(e.currentTarget.value))}
                                        min="0"
                                        step="1"
                                    />
                                </label>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}

            {#if category_map.size === 0}
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
    <input type="hidden" name="new_competition" value={JSON.stringify(new_competition)} />
    <input type="hidden" name="new_categories" value={JSON.stringify(Array.from(category_map.values()).map(({ type, ...rest }) => ({ ...rest, type })))} />

    <!-- Submit Button -->
    <div class="flex justify-end gap-4 pt-4 border-t-2 border-surface-200-700">
        <a href="/competitions" class="btn preset-tonal-surface border border-surface-500">Cancel</a>
        <button
            type="submit"
            class="btn preset-filled-primary-500 btn-lg"
            disabled={!new_competition.name  || category_map.size === 0}
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
