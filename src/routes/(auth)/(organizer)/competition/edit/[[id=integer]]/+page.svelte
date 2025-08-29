<script lang="ts">
    import Icon from "@iconify/svelte";
    import { t } from "$lib/translations";
    import SuperDebug, { superForm, dateProxy } from "sveltekit-superforms";
    import { getCategoryTypeName } from "$lib/utils/category_utils.js";

    let { data } = $props();
    const { form, errors, constraints, message, enhance } = superForm(data.form, {dataType:"json"});
    const startDateProxy = dateProxy(form, 'startDate', { format: 'date' });
    const endDateProxy   = dateProxy(form, 'endDate',   { format: 'date' });

    // Update form with creator ID when loaded
    $form.status = "UPCOMING";
    $form.creator = { connect: { id: data.user.id } };

    let toUpdateCategories = [] as any[];
    for (let i = 0; i < $form.categories?.length; i++) {
        toUpdateCategories.push(
            {
                where: {
                    id: $form.categories[i].id
                },
                data: {
                    ...$form.categories[i],
                }
            }
        );
        delete toUpdateCategories[i].data.id;
        delete toUpdateCategories[i].data.competitionId;
    }

    let nested_categories_struct = $state({ createMany: { data: [] as any[]},
                                     update: toUpdateCategories,
                                     delete: [] as any[]} );

    $effect(() => {
        $form.categories = nested_categories_struct;
    });

    let categories_times = $state({createMany: {data: [] as any[]},
                                    update: [] as any[],
                                    delete: [] as any[]});
    prepopulateCategoryTimes();

    const isEdit = $form.name !== undefined;

    function addCategory() {
        nested_categories_struct.createMany.data = [...nested_categories_struct.createMany.data, {
            name: "",
            type: "INDIVIDUAL", // or whatever default CategoryType you want
            startTime: "", // Add this property
            endTime: "", // Add this property
            // Optional fields can be omitted or set to defaults
            maxParties: null, // Add this property
            maxPartySize: 1, // Change from null to 1
            status: "UPCOMING"
        }];
        categories_times.createMany.data = [...categories_times.createMany.data, {startTime: "", endTime: ""}];
    }

    function removeCategory(source: string, index: number) {
        if(source === "create") {
            nested_categories_struct.createMany.data = nested_categories_struct.createMany.data.filter((_, i) => i !== index);
            categories_times.createMany.data = categories_times.createMany.data.filter((_, i) => i !== index);
        } else if (source === "update") {
            const categoryToDelete = nested_categories_struct.update[index].where.id;
            console.log("categoryToDelete", categoryToDelete);
            nested_categories_struct.delete = [...nested_categories_struct.delete, {id: categoryToDelete}];
            nested_categories_struct.update = nested_categories_struct.update.filter((_, i) => i !== index);
            categories_times.delete = [...categories_times.delete, categories_times.update[index]];
            categories_times.update = categories_times.update.filter((_, i) => i !== index);
        }
    }

    function mixCompetitionDateWithCategoryTime(field: string, source: string, index: number, time_value: string) {
        if ($form.startDate === "" || $form.startDate === undefined || time_value === "") {
            return "";
        }

        console.log("mixCompetitionDateWithCategoryTime", ($form.startDate as string).toString(), time_value);
        let date = new Date($form.startDate as number);
        date.setHours(parseInt(time_value.split(":")[0]));
        date.setMinutes(parseInt(time_value.split(":")[1]));

        if (source === "create") {
            nested_categories_struct.createMany.data[index][field] = date.toISOString();
        } else if (source === "update") {
            nested_categories_struct.update[index].data[field] = date.toISOString();
        }
    }

    function onDateChange(date_value: string) {
        console.log("onDateChange", date_value);
        $form.startDate = date_value;
        $form.endDate = date_value;

        for (let i = 0; i < categories_times.createMany.data.length; i++) {
            mixCompetitionDateWithCategoryTime('startTime', 'create', i, categories_times.createMany.data[i].startTime);
            mixCompetitionDateWithCategoryTime('endTime',   'create', i, categories_times.createMany.data[i].endTime);
        }

        for (let i = 0; i < categories_times.update.length; i++) {
            mixCompetitionDateWithCategoryTime('startTime', 'update', i, categories_times.update[i].startTime);
            mixCompetitionDateWithCategoryTime('endTime',   'update', i, categories_times.update[i].endTime);
        }
    }

    function prepopulateCategoryTimes() {
        for (let i = 0; i < nested_categories_struct.update?.length; i++) {
            categories_times.update[i] = {startTime: "", endTime: ""};
            categories_times.update[i].startTime = new Date(nested_categories_struct.update[i].data.startTime).toISOString().split("T")[1].split(".")[0];
            categories_times.update[i].endTime   = new Date(nested_categories_struct.update[i].data.endTime).toISOString().split("T")[1].split(".")[0];
        }
    }

</script>

<svelte:head>
    <title>{isEdit? $t('edit_competition.title') : $t('create_competition.title')}</title>
</svelte:head>

<h4>{isEdit? $t('edit_competition.title') : $t('create_competition.title')}</h4>
<div class="container mx-auto">
    <!-- Header Section -->
    <div class="space-y-3 mb-2">
        <div>
            <p class="text-surface-600-400">
                {isEdit
                    ? $t("edit_competition.details")
                    : $t("create_competition.details")}
            </p>
        </div>
    </div>

    <form
        method="POST"
        action="?/create_update_competition"
        enctype="multipart/form-data"
        class="space-y-4"
        use:enhance
    >
        <!-- Basic Information Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon
                    icon="mdi:information"
                    width="1.5rem"
                    height="1.5rem"
                    class="text-primary-500"
                />
                Competition Details
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label class="label">
                    <span>Competition Name *</span>
                    <input
                        type="text"
                        name="competition_name"
                        bind:value={$form.name}
                        required
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>
                {#if $errors.name}<span class="invalid">{$errors.name}</span>{/if}

                <label class="label">
                    <span>Location *</span>
                    <input
                        type="text"
                        name="location"
                        bind:value={$form.location}
                        required
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>
                {#if $errors.location}<span class="invalid">{$errors.location}</span>{/if}

                <label class="label lg:col-span-2">
                    <span>Description *</span>
                    <textarea
                        name="description"
                        bind:value={$form.description}
                        rows="3"
                        required
                        class="textarea rounded-lg bg-primary-50-950"
                        placeholder="Enter comments about competition here"
                    ></textarea>
                </label>
                {#if $errors.description}<span class="invalid">{$errors.description}</span>{/if}
            </div>
        </div>

        <!-- Date Configuration Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon
                    icon="mdi:calendar-clock"
                    width="1.5rem"
                    height="1.5rem"
                    class="text-primary-500"
                />
                Schedule
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="label">
                    <span>{$t('edit_competition.date')} *</span>
                    <input
                        type="date"
                        name="start_date"
                        bind:value={$startDateProxy}
                        aria-invalid={$errors.startDate ? 'true' : undefined}
                        min={new Date().toISOString().split("T")[0]}
                        onchange={(e) => onDateChange(e.currentTarget.value)}
                        required
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>

                <label class="label">
                    <!-- <span>End Date</span> -->
                    <input
                        type="hidden"
                        name="end_date"
                        bind:value={$startDateProxy}
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>
            </div>
        </div>

        <!-- Categories Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <div class="flex items-center justify-between mb-4">
                <h2 class="h4 font-semibold flex items-center gap-2">
                    <Icon
                        icon="mdi:format-list-bulleted"
                        width="1.5rem"
                        height="1.5rem"
                        class="text-primary-500"
                    />
                    Categories
                </h2>

                <button
                    type="button"
                    class="btn preset-filled-primary-500 rounded-lg"
                    onclick={addCategory}
                    disabled={$form.startDate === ""}
                >
                    <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                    Add Category
                </button>
            </div>

            <div class="space-y-4">
                {#if nested_categories_struct?.update && (nested_categories_struct?.update as []).length > 0}
                    <div>
                        <p>Current Categories</p>
                    </div>
                    {#each nested_categories_struct.update as _, i}
                        <div class="p-2 rounded-lg bg-warning-50-950">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Name -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Name</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={nested_categories_struct.update[i].data.name}
                                        placeholder="Enter category name"
                                    />
                                </label>

                                <!-- Category Type -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Type *</span>
                                    <select
                                        class="select bg-primary-50-950"
                                        bind:value={nested_categories_struct.update[i].data.type}
                                        required
                                    >
                                        <option value="">Select a category type</option>
                                        {#each data.props?.categoryTypes as categoryType}
                                            <option value={categoryType}>
                                                {getCategoryTypeName(categoryType)}
                                            </option>
                                        {/each}
                                    </select>
                                </label>
                            </div>

                            <!-- Category Details (only show when type is selected) -->
                            {#if nested_categories_struct.update[i].data.type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Start Time -->
                                <label class="label">
                                    <span class="text-sm font-medium">Start Time *</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        bind:value={categories_times.update[i].startTime}
                                        required
                                        onchange={(e) => mixCompetitionDateWithCategoryTime('startTime', 'update', i, e.currentTarget.value)}
                                        min={$startDateProxy}
                                        max={$endDateProxy}
                                    />
                                </label>

                                <!-- End Time -->
                                <label class="label">
                                    <span class="text-sm font-medium">End Time *</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        bind:value={categories_times.update[i].endTime}
                                        required
                                        onchange={(e) => mixCompetitionDateWithCategoryTime('endTime', 'update', i, e.currentTarget.value)}
                                        min={$startDateProxy}
                                        max={$endDateProxy}
                                    />
                                </label>

                                <!-- Max Parties -->
                                <label class="label">
                                    <span class="text-sm font-medium">Max Parties</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        bind:value={nested_categories_struct.update[i].data.maxParties}
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
                                        bind:value={nested_categories_struct.update[i].data.maxPartySize}
                                        min="1"
                                        required
                                    />
                                </label>
                            </div>
                            {/if}
                            <div class="flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    class="btn preset-tonal rounded-lg"
                                    onclick={() => removeCategory('update', i)}
                                >
                                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                    Remove Category
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
                {#if nested_categories_struct?.createMany?.data && (nested_categories_struct?.createMany?.data as []).length > 0}
                    <div>
                        <p>New Categories</p>
                    </div>
                    {#each nested_categories_struct.createMany.data as _, i}
                        <div class="p-2 rounded-lg bg-success-50-950">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Name -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Name *</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={nested_categories_struct.createMany.data[i].name}
                                        placeholder="Enter category name"
                                    />
                                </label>

                                <!-- Category Type -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Type *</span>
                                    <select
                                        class="select bg-primary-50-950"
                                        bind:value={nested_categories_struct.createMany.data[i].type}
                                        required
                                    >
                                        <option value="">Select a category type</option>
                                        {#each data.props?.categoryTypes as categoryType}
                                            <option value={categoryType}>
                                                {getCategoryTypeName(categoryType)}
                                            </option>
                                        {/each}
                                    </select>
                                </label>
                            </div>

                            <!-- Category Details (only show when type is selected) -->
                            {#if nested_categories_struct.createMany.data[i].type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Start Time -->
                                <label class="label">
                                    <span class="text-sm font-medium">Start Time *</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        bind:value={categories_times.createMany.data[i].startTime}
                                        required
                                        onchange={(e) => mixCompetitionDateWithCategoryTime('startTime', 'create', i, e.currentTarget.value)}
                                        min={$startDateProxy}
                                        max={$endDateProxy}
                                    />
                                </label>

                                <!-- End Time -->
                                <label class="label">
                                    <span class="text-sm font-medium">End Time *</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        bind:value={categories_times.createMany.data[i].endTime}
                                        required
                                        onchange={(e) => mixCompetitionDateWithCategoryTime('endTime', 'create', i, e.currentTarget.value)}
                                        min={$startDateProxy}
                                        max={$endDateProxy}
                                    />
                                </label>

                                <!-- Max Parties -->
                                <label class="label">
                                    <span class="text-sm font-medium">Max Parties</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        bind:value={nested_categories_struct.createMany.data[i].maxParties}
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
                                        bind:value={nested_categories_struct.createMany.data[i].maxPartySize}
                                        min="1"
                                        required
                                    />
                                </label>
                            </div>
                            {/if}
                            <div class="flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    class="btn preset-tonal rounded-lg"
                                    onclick={() => removeCategory('create', i)}
                                >
                                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                    Remove Category
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
                {#if nested_categories_struct?.createMany?.data && (nested_categories_struct?.createMany?.data as []).length === 0 && (nested_categories_struct?.update as []).length === 0}
                    <div
                        class="text-center py-2 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg"
                    >
                        <h3 class="h4 mb-2 text-surface-600 dark:text-surface-300">No categories yet</h3>
                        <p class="text-surface-500 mb-4">Add your first category to get started</p>
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 rounded-lg"
                            onclick={addCategory}
                            disabled={$form.startDate === ""}>
                            <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                            Add Category
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        {#if isEdit}
            <div
                class="card preset-outlined-warning-500 bg-warning-200-800 p-4 rounded-lg"
            >
                <h2 class="h4 font-semibold mb-4 flex items-center gap-2">
                    <Icon
                        icon="mdi:alert"
                        width="1.5rem"
                        height="1.5rem"
                        class="text-warning-500"
                    />
                    Warning
                </h2>
                <p class="text-warning-700-300">
                    {$t('edit_competition.registers_warning')}
                </p>
            </div>
        {/if}

        <!-- Alert Messages -->
        {#if $message && $message.success === true}
            <div class="alert preset-filled-success-500 rounded-lg mt-4 p-2 flex items-center">
                <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
                <div class="p-2">
                    <h4 class="font-semibold">Competition Created!</h4>
                    <p class="mt-1">
                        <a
                            href={`/competitions/competition_details/${$message.id}`}
                            class="anchor"
                        >
                            View updated competition →
                        </a>
                    </p>
                </div>
            </div>
        {:else if $message && $message.success === false }
            <div class="alert preset-filled-error-500 rounded-lg mt-4 p-2 flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
                <h4 class="font-semibold">Error</h4>
                <p>{$message.message}</p>
            </div>
        {/if}

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-4 mt-4">
            {#if isEdit}
                <a
                    href="/competitions/competition_details/{$form.id}"
                    class="btn preset-tonal rounded-lg"
                >
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                    Cancel
                </a>
            {:else}
                <a
                    href="/competitions"
                    class="btn preset-tonal rounded-lg"
                >
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                    Cancel
                </a>
            {/if}
            <button
                type="submit"
                class="btn preset-filled-primary-500 rounded-lg"
                disabled={$form.isValid === false}
            >
                <Icon icon="mdi:content-save" width="1.2rem" height="1.2rem" />
                {isEdit
                    ? $t('edit_competition.submit_button')
                    : $t('create_competition.submit_button')
                }
            </button>
        </div>
    </form>

    <SuperDebug data={$form} />
</div>

<style>
  .invalid {
    color: red;
  }
</style>
