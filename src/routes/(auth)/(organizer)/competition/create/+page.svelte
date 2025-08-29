<script lang="ts">
    import Icon from "@iconify/svelte";
    import { t } from "$lib/translations";
    import { superForm, dateProxy } from "sveltekit-superforms";
    import { getCategoryTypeName } from "$lib/utils/category_utils.js";

    let { data } = $props();
    const { form, errors, constraints, message, enhance } = superForm(data.form, {dataType:"json"});
    const startDateProxy = dateProxy(form, 'startDate', { format: 'date' });
    const endDateProxy   = dateProxy(form, 'endDate',   { format: 'date' });

    console.log("/competition/create/+page.svelte load now data", form);
    console.log("/competition/create/+page.svelte message", message);

    // Update form with creator ID when loaded
    $form.status = "UPCOMING";
    $form.creator = { connect: { id: data.user.id } };
    $form.categories = { createMany: { data: [] } };

    let categories_times = $state([]);

    function addCategory() {
        $form.categories.createMany.data = [...$form.categories.createMany.data, {
            name: "",
            type: "INDIVIDUAL", // or whatever default CategoryType you want
            startTime: "", // Add this property
            endTime: "", // Add this property
            // Optional fields can be omitted or set to defaults
            maxParties: null, // Add this property
            maxPartySize: 1, // Change from null to 1
            status: "UPCOMING"
        }];
        categories_times = [...categories_times, {startTime: "", endTime: ""}];
    }

    function mixCompetitionDateWithCategoryTime(field: string, index: number, time_value: string) {
        if ($form.startDate === "" || $form.startDate === undefined || time_value === "") {
            return "";
        }

        console.log("mixCompetitionDateWithCategoryTime", ($form.startDate as string).toString(), time_value);
        let date = new Date($form.startDate as number);
        date.setHours(parseInt(time_value.split(":")[0]));
        date.setMinutes(parseInt(time_value.split(":")[1]));

        if(field === "startTime") {
            $form.categories.createMany.data[index].startTime = date.toISOString();
        } else if (field === "endTime") {
            $form.categories.createMany.data[index].endTime = date.toISOString();
        }
    }

    function onDateChange(date_value: string) {
        console.log("onDateChange", date_value);
        $form.startDate = date_value;
        $form.endDate = date_value;

        for (let i = 0; i < categories_times.length; i++) {
            mixCompetitionDateWithCategoryTime('startTime', i, categories_times[i].startTime);
            mixCompetitionDateWithCategoryTime('endTime', i, categories_times[i].endTime);
        }
    }

</script>

<svelte:head>
    <title>{$t('create_competition.title')}</title>
</svelte:head>

<h4>{$t('create_competition.title')}</h4>
<div class="container mx-auto">
    <!-- Header Section -->
    <div class="space-y-3 mb-2">
        <div>
            <p class="text-surface-600-400">
                {$t('create_competition.details')}
            </p>
        </div>
    </div>

    <!-- Alert Messages -->
    {#if $message }
        <div class="alert preset-filled-success-500 rounded-lg mb-4 p-2 flex items-center">
            <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
            <div class="p-2">
                <h4 class="font-semibold">Competition Created!</h4>
                <p class="mt-1">
                    <a
                        href={`/competitions/competition_details/${$message.id}`}
                        class="anchor"
                    >
                        View created competition →
                    </a>
                </p>
            </div>
        </div>
    {:else if $form.posted && !$form.valid }
        <div class="alert preset-filled-error-500 rounded-lg mb-4 p-2 flex items-center">
            <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
            <div class="p-2">
                <h4 class="font-semibold">Fix form issues!</h4>
            </div>
        </div>
    {/if}

    <form
        method="POST"
        action="?/create_competition"
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
                    <span>Location</span>
                    <input
                        type="text"
                        name="location"
                        bind:value={$form.location}
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>
                {#if $errors.location}<span class="invalid">{$errors.location}</span>{/if}

                <label class="label lg:col-span-2">
                    <span>Description</span>
                    <textarea
                        name="description"
                        bind:value={$form.description}
                        rows="3"
                        class="textarea rounded-lg bg-primary-50-950"
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
                {#each $form.categories?.createMany.data as _, i}
                    <div class="p-2 border rounded-lg">
                        <!-- Category Header -->
                        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Category Name -->
                            <label class="label">
                                <span class="text-sm font-medium">Category Name</span>
                                <input
                                    type="text"
                                    class="input bg-primary-50-950"
                                    bind:value={$form.categories.createMany.data[i].name}
                                    placeholder="Enter category name"
                                />
                            </label>

                            <!-- Category Type -->
                            <label class="label">
                                <span class="text-sm font-medium">Category Type *</span>
                                <select
                                    class="select bg-primary-50-950"
                                    bind:value={$form.categories.createMany.data[i].type}
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
                        {#if $form.categories.createMany.data[i].type}
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <!-- Start Time -->
                            <label class="label">
                                <span class="text-sm font-medium">Start Time *</span>
                                <input
                                    type="time"
                                    class="input bg-primary-50-950"
                                    bind:value={categories_times[i].startTime}
                                    required
                                    onchange={(e) => mixCompetitionDateWithCategoryTime('startTime', i, e.currentTarget.value)}
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
                                    bind:value={categories_times[i].endTime}
                                    required
                                    onchange={(e) => mixCompetitionDateWithCategoryTime('endTime', i, e.currentTarget.value)}
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
                                    bind:value={$form.categories.createMany.data[i].maxParties}
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
                                    bind:value={$form.categories.createMany.data[i].maxPartySize}
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
                                onclick={() => $form.categories.createMany.data.splice(i, 1)}
                            >
                                <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                Remove Category
                            </button>
                        </div>
                    </div>
            {/each}

            {#if $form.categories?.createMany.data?.length === 0}
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

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-4 mt-4">
            <a href="/competitions" class="btn preset-tonal rounded-lg">
                <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                Cancel
            </a>
            <button
                type="submit"
                class="btn preset-filled-primary-500 rounded-lg"
                disabled={$form.isValid === false}
            >
                <Icon icon="mdi:content-save" width="1.2rem" height="1.2rem" />
                {$t('create_competition.submit_button')}
            </button>
        </div>
    </form>
</div>

<style>
  .invalid {
    color: red;
  }
</style>
