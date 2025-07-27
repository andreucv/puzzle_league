<script lang="ts">
    import type { Competition, Category, Prisma} from "@prisma/client";
    import { t } from '$lib/translations';
    import { getCategoryTypeName, getPartySizeByCategoryType } from "$lib/utils/category_utils.js";
    import Icon from '@iconify/svelte';
    import CategoryCreatorUpdator from '$lib/components/CategoryCreatorUpdator.svelte';

    let {data, form} = $props();

    const existingCompetition = data?.props?.competition;
    const isEdit = existingCompetition?.id !== undefined;
    const existingCategories = existingCompetition?.categories || [];

    // Initialize competition data with existing values
    let updated_competition = $state<Prisma.CompetitionUpdateInput>({
        name: existingCompetition?.name || '',
        location: existingCompetition?.location || '',
        description: existingCompetition?.description || '',
        startDate: existingCompetition?.startDate ? new Date(existingCompetition.startDate).toISOString().split('T')[0] : '',
        endDate: existingCompetition?.endDate ? new Date(existingCompetition.endDate).toISOString().split('T')[0] : '',
        creator: { connect: { id: data.user.id } }
    });

    // Initialize categories with existing data
    let category_counter = $state(existingCategories.length);
    let category_map: Map<number, Prisma.CategoryUncheckedCreateInput & { originalId?: number }> = $state(new Map());

    // Load existing categories into the map
    existingCategories.forEach((category, index) => {
        category_map.set(index, {
            originalId: category.id,
            name: category.name || '',
            type: category.type,
            startTime: category.startTime,
            endTime: category.endTime,
            maxParties: category.maxParties || 0,
            maxPartySize: category.maxPartySize || 1,
            competitionId: category.competitionId
        });
    });

    function addCategory() {
        const newCategory: Prisma.CategoryUncheckedCreateInput = {
            name: '',
            type: 'INDIVIDUAL',
            startTime: '',
            endTime: '',
            maxParties: 0,
            maxPartySize: 1,
            competitionId: existingCompetition?.id || -1
        };
        const id = category_counter++;
        category_map.set(id, newCategory);
        category_map = new Map(category_map);
    }

    function removeCategory(categoryId: number) {
        category_map.delete(categoryId);
        category_map = new Map(category_map);
    }

    function updateCompetition(field: string, value: any) {
        updated_competition = { ...updated_competition, [field]: value } as Prisma.CompetitionUpdateInput;
        if (field === 'startDate') {
            updated_competition.startDate = new Date(value);
            if (!updated_competition.endDate) {
                updated_competition.endDate = new Date(value);
            }
            // Update all category dates when competition start date changes
            updateCategoryDates(updated_competition.startDate);
        }
        if (field === 'endDate') {
            updated_competition.endDate = new Date(value);
        }
    }

    function updateCategoryDates(dateUTC: Date) {
        category_map.forEach((category, categoryId) => {
            if (category.startTime) {
                const startTimeStr = typeof category.startTime === 'string' ? category.startTime : new Date(category.startTime).toTimeString().slice(0, 5);
                const [start_hours, start_minutes] = startTimeStr.split(':').map(Number);
                category.startTime = new Date(new Date(dateUTC).setHours(start_hours, start_minutes));
            }
            if (category.endTime) {
                const endTimeStr = typeof category.endTime === 'string' ? category.endTime : new Date(category.endTime).toTimeString().slice(0, 5);
                const [end_hours, end_minutes] = endTimeStr.split(':').map(Number);
                category.endTime = new Date(new Date(dateUTC).setHours(end_hours, end_minutes));
            }
            category_map.set(categoryId, category);
        });
        category_map = new Map(category_map); // This triggers reactivity
    }

    $effect(() => {
        console.log('updated_competition', updated_competition);
        console.log('category_map', category_map);
    });
</script>

<svelte:head>
    <title>{isEdit ? `Edit ${existingCompetition?.name}` : 'Create Competition'} - Competition</title>
</svelte:head>

<h4>{isEdit ? 'Edit Competition' : 'Create Competition'}</h4>
<div class="container mx-auto">
    <!-- Header Section -->
    <div class="space-y-4 mb-2">
        <div>
            <p class="text-surface-600-400">
                {isEdit
                    ? 'Update your competition details and categories'
                    : 'Enter your competition details and categories'}
            </p>
        </div>
    </div>

    <!-- Alert Messages -->
    {#if form?.success === false}
        <div class="alert preset-filled-error-500 rounded-lg mb-4">
            <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
            <div>
                <h4 class="font-semibold">Error occurred</h4>
                <p>{form.message}</p>
            </div>
        </div>
    {/if}

    {#if form?.success === true}
        <div class="alert preset-filled-success-500 rounded-lg mb-4">
            <Icon icon="mdi:check-circle" width="1.5rem" height="1.5rem" />
            <div>
                <h4 class="font-semibold">Competition Updated!</h4>
                <p>{form.message}</p>
                <p class="mt-1">
                    <a href={`/competitions/competition_details/${form.competitionId}`}
                       class="anchor">
                        View updated competition →
                    </a>
                </p>
            </div>
        </div>
    {/if}

    <form method="POST" action="?/update_competition" enctype="multipart/form-data" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:information" width="1.5rem" height="1.5rem" class="text-primary-500" />
                Competition Details
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label class="label">
                    <span>Competition Name *</span>
                    <input
                        type="text"
                        name="competition_name"
                        value={updated_competition.name?.toString()}
                        onchange={(e) => updateCompetition('name', e.currentTarget.value)}
                        required
                        class="input rounded-lg"
                    />
                </label>

                <label class="label">
                    <span>Location</span>
                    <input
                        type="text"
                        name="location"
                        value={updated_competition.location?.toString()}
                        onchange={(e) => updateCompetition('location', e.currentTarget.value)}
                        class="input rounded-lg"
                    />
                </label>

                <label class="label lg:col-span-2">
                    <span>Description</span>
                    <textarea
                        name="description"
                        value={updated_competition.description?.toString() || ''}
                        onchange={(e) => updateCompetition('description', e.currentTarget.value)}
                        rows="3"
                        class="textarea rounded-lg"
                    ></textarea>
                </label>
            </div>
        </div>

        <!-- Date Configuration Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:calendar-clock" width="1.5rem" height="1.5rem" class="text-primary-500" />
                Schedule
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="label">
                    <span>Start Date *</span>
                    <input
                        type="date"
                        name="start_date"
                        value={typeof updated_competition.startDate === 'string' ? updated_competition.startDate : updated_competition.startDate instanceof Date ? updated_competition.startDate.toISOString().split('T')[0] : ''}
                        onchange={(e) => updateCompetition('startDate', e.currentTarget.value)}
                        required
                        class="input rounded-lg"
                    />
                </label>

                <label class="label">
                    <span>End Date</span>
                    <input
                        type="date"
                        name="end_date"
                        value={typeof updated_competition.endDate === 'string' ? updated_competition.endDate : updated_competition.endDate instanceof Date ? updated_competition.endDate.toISOString().split('T')[0] : ''}
                        onchange={(e) => updateCompetition('endDate', e.currentTarget.value)}
                        min={typeof updated_competition.startDate === 'string' ? updated_competition.startDate : updated_competition.startDate instanceof Date ? updated_competition.startDate.toISOString().split('T')[0] : undefined}
                        class="input rounded-lg"
                    />
                </label>
            </div>
        </div>

        <!-- Categories Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <div class="flex items-center justify-between mb-4">
                <h2 class="h4 font-semibold flex items-center gap-2">
                    <Icon icon="mdi:format-list-bulleted" width="1.5rem" height="1.5rem" class="text-primary-500" />
                    Categories
                </h2>

                <button
                    type="button"
                    class="btn preset-filled-primary-500 rounded-lg"
                    onclick={addCategory}
                >
                    <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                    Add Category
                </button>
            </div>

            <div class="space-y-4">
                {#each Array.from(category_map.entries()) as [categoryId, category], index}
                    <CategoryCreatorUpdator
                        category={category}
                        {categoryId}
                        competitionStartDate={new Date(updated_competition.startDate as string)}
                        onRemove={removeCategory}
                        showRemoveButton={true}
                        isNew={!category.originalId}
                        onUpdate={(updatedCategory) => {
                            category_map.set(categoryId, updatedCategory);
                            category_map = new Map(category_map);
                        }}
                        categoryTypes={data.props?.categoryTypes}
                    />
                {/each}

                {#if category_map.size === 0}
                    <div class="text-center py-12 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg">
                        <Icon icon="mdi:format-list-bulleted" width="3rem" height="3rem" class="mx-auto mb-4 text-surface-400" />
                        <h3 class="h4 mb-2 text-surface-600 dark:text-surface-300">No categories yet</h3>
                        <p class="text-surface-500 mb-4">Add your first category to get started</p>
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 rounded-lg"
                            onclick={addCategory}
                        >
                            <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                            Add Category
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Hidden inputs for form data -->
        <input type="hidden" name="updated_competition" value={JSON.stringify({
            ...updated_competition,
            startDate: updated_competition.startDate ? new Date(updated_competition.startDate) : null,
            endDate: updated_competition.endDate ? new Date(updated_competition.endDate) : null
        })} />
        <input type="hidden" name="updated_categories" value={JSON.stringify(Array.from(category_map.values()).map(({ originalId, ...rest }) => rest))} />
        {#if isEdit}
            <div class="card preset-outlined-warning-500 bg-warning-200-800 p-4 rounded-lg">
                <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                    <Icon icon="mdi:alert" width="1.5rem" height="1.5rem" class="text-warning-500" />
                    Warning
                </h2>
                <p class="text-warning-700-300">
                    Editing the competition will delete all the entries present in the categories.
                </p>
            </div>
        {/if}
        <!-- Submit Buttons -->
        <div class="flex justify-end gap-4 mt-4">
            {#if isEdit}
                <a href="/competitions/competition_details/{existingCompetition?.id}"
                   class="btn preset-tonal rounded-lg">
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                    Cancel
                </a>
            {:else}
                <a href="/competitions" class="btn preset-tonal rounded-lg">
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                    Cancel
                </a>
            {/if}
            <button
                type="submit"
                class="btn preset-filled-primary-500 rounded-lg"
                disabled={!updated_competition.name || category_map.size === 0}
            >
                <Icon icon="mdi:content-save" width="1.2rem" height="1.2rem" />
                {isEdit ? 'Update Competition' : 'Create Competition'}
            </button>
        </div>
    </form>
</div>
