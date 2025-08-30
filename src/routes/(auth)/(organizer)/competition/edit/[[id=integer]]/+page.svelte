<script lang="ts">
    import Icon from "@iconify/svelte";
    import { locale, t } from "$lib/translations";
    import SuperDebug, { superForm, dateProxy } from "sveltekit-superforms";
    import { type DateValue, CalendarDate, today, getLocalTimeZone, Time, ZonedDateTime, fromDate, parseZonedDateTime, parseTime, parseDate, parseDateTime, parseAbsolute, parseAbsoluteToLocal, CalendarDateTime, toCalendarDateTime} from "@internationalized/date";
    import CustomDatePicker from "$lib/components/bits_ui/CustomDatePicker.svelte";
    import CustomTimeInputField from "$lib/components/bits_ui/CustomTimeInputField.svelte";
    import { getCategoryTypeName } from "$lib/utils/category_utils.js";

    let { data } = $props();
    const { form, errors, constraints, message, enhance } = superForm(data.form, {dataType:"json"});
    const isEdit = $form.name !== undefined;

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

    // Here inject the data from the current competition in form
    let update_categories_times_obj_arr = [] as any[];
    let initialCompetitionStartDate = null;

    let categories = $state({
        create: [] as any[]
    });
    if (isEdit) {
        categories.create = [];
        categories.update = toUpdateCategories;
        categories.delete = [];

        prepopulateCategoryTimes();
        initialCompetitionStartDate = new CalendarDate(new Date($form.startDate).getFullYear(), new Date($form.startDate).getMonth() + 1, new Date($form.startDate).getDate());
    }

    $effect(() => {
        $form.categories = categories;
    })

    // Update form with creator ID when loaded
    $form.status = "UPCOMING";
    $form.creator = { connect: { id: data.user.id } };

    function addCategory() {
        categories.create = [...categories.create, {
            name: "",
            type: "INDIVIDUAL", // or whatever default CategoryType you want
            startTime: "", // Add this property
            endTime: "", // Add this property
            // Optional fields can be omitted or set to defaults
            maxParties: null, // Add this property
            maxPartySize: 1, // Change from null to 1
            status: "UPCOMING"
        }];
    }

    function removeCategory(source: string, index: number) {
        if(source === "create") {
            categories.create = categories.create.filter((_, i) => i !== index);
        } else if (source === "update") {
            const categoryToDelete = categories.update[index].where.id;
            console.log("categoryToDelete", categoryToDelete);
            categories.delete = [...categories.delete, {id: categoryToDelete}];
            categories.update = categories.update.filter((_, i) => i !== index);
        }
    }

    function mixCompetitionDateWithCategoryTimeNewPicker(field: string, source: string, index: number, time_value: Time) {
        if ($form.startDate === "" || $form.startDate === undefined || time_value === undefined) {
            console.log("mixCompetitionDateWithCategoryTime", "startDate is empty or time_value is undefined", $form.startDate, time_value);
            return "";
        }

        console.log("mixCompetitionDateWithCategoryTime $form.startDate", $form.startDate, "time_value", time_value.toString());
        console.log("mixCompetitionDateWithCategoryTime $form.startDate", $form.startDate, "time_value", parseInt(time_value.toString().split(':')[0]), parseInt(time_value.toString().split(':')[1]));
        const date = parseAbsolute($form.startDate, getLocalTimeZone());
        const js_date = toCalendarDateTime(date, time_value).toDate(getLocalTimeZone());
        const updated_date = fromDate(js_date, getLocalTimeZone()).toAbsoluteString();

        console.log("mixCompetitionDateWithCategoryTime after math", updated_date);

        if(source === "create") {
            console.log("category_start_time", updated_date);
            categories.create[index][field] = updated_date;
        } else if (source === "update") {
            console.log("category_end_time", updated_date);
            categories.update[index].data[field] = updated_date;
        }
    }

    function onDateChange(date_value: CalendarDate) {
        console.log("onDateChange", date_value);
        const localTimeZone = getLocalTimeZone();
        const date = date_value.toDate(localTimeZone);
        $form.startDate = fromDate(date, localTimeZone).toAbsoluteString();
        $form.endDate   = fromDate(date, localTimeZone).toAbsoluteString();

        console.log("onDateChange changing all categories times...");

        if (categories.create) {
            for (let i = 0; i < categories.create.length; i++) {
                console.log("onDateChange changing create category time", i, categories.create);
                mixCompetitionDateWithCategoryTimeNewPicker('startTime', 'create', i, categories.create[i].startTime);
                mixCompetitionDateWithCategoryTimeNewPicker('endTime',   'create', i, categories.create[i].endTime);
            }
        }

        if (categories.update) {
            for (let i = 0; i < categories.update.length; i++) {
                console.log("onDateChange changing update category time", i, categories.update);
                mixCompetitionDateWithCategoryTimeNewPicker('startTime', 'update', i, update_categories_times_obj_arr[i].startTime);
                mixCompetitionDateWithCategoryTimeNewPicker('endTime',   'update', i, update_categories_times_obj_arr[i].endTime);
            }
        }
    }

    function prepopulateCategoryTimes() {
        for (let i = 0; i < toUpdateCategories.length; i++) {
            update_categories_times_obj_arr[i] = {startTime: new Time(0,0), endTime: new Time(0,0)};
            const startTime = new Date(toUpdateCategories[i].data.startTime);
            update_categories_times_obj_arr[i].startTime = new Time(startTime.getHours(), startTime.getMinutes());
            const endTime = new Date(toUpdateCategories[i].data.endTime);
            update_categories_times_obj_arr[i].endTime   = new Time(endTime.getHours(), endTime.getMinutes());
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
                {$t('create_competition.details_title')}
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label class="label">
                    <span>{$t('create_competition.competition_name')} *</span>
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
                    <span>{$t('create_competition.location')}</span>
                    <input
                        type="text"
                        name="location"
                        bind:value={$form.location}
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>
                {#if $errors.location}<span class="invalid">{$errors.location}</span>{/if}

                <label class="label lg:col-span-2">
                    <span>{$t('create_competition.comments')}</span>
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
                {$t('create_competition.date_title')}
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomDatePicker
                    name="start_date"
                    labelText="{$t('edit_competition.date')} *"
                    locale={data.i18n.locale}
                    value={initialCompetitionStartDate}
                    minValue={today(getLocalTimeZone())}
                    required
                    disableDaysOutsideMonth={false}
                    weekStartsOn={1}
                    pagedNavigation={true}
                    onValueChange={(e) => onDateChange(e)}
                />
                <label class="label">
                    <!-- <span>End Date</span> -->
                    <input
                        type="hidden"
                        name="end_date"
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
                    {$t('create_competition.categories_title')}
                </h2>

                <button
                    type="button"
                    class="btn preset-filled-primary-500 rounded-lg"
                    onclick={addCategory}
                    disabled={$form.startDate === "" || $form.startDate === undefined}
                >
                    <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                    {$t('create_competition.add_category')}
                </button>
            </div>

            <div class="space-y-4">
                {#if categories?.update && (categories?.update as []).length > 0}
                    <div>
                        <p>Current Categories</p>
                    </div>
                    {#each categories.update as _, i}
                        <div class="p-2 rounded-lg bg-warning-50-950">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Name -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Name</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.update[i].data.name}
                                        placeholder="Enter category name"
                                    />
                                </label>

                                <!-- Category Type -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Type *</span>
                                    <select
                                        class="select bg-primary-50-950"
                                        bind:value={categories.update[i].data.type}
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
                            {#if categories.update[i].data.type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Start Time -->
                                <CustomTimeInputField
                                    labelText="{$t('create_competition.start_time')} *"
                                    locale={data.i18n.locale}
                                    value={update_categories_times_obj_arr[i].startTime}
                                    required
                                    onValueChange={(e) => mixCompetitionDateWithCategoryTimeNewPicker('startTime', 'update', i, e)}
                                />
                                <CustomTimeInputField
                                    labelText="{$t('create_competition.end_time')} *"
                                    locale={data.i18n.locale}
                                    value={update_categories_times_obj_arr[i].endTime}
                                    required
                                    onValueChange={(e) => mixCompetitionDateWithCategoryTimeNewPicker('endTime', 'update', i, e)}
                                />

                                <!-- Max Parties -->
                                <label class="label">
                                <span class="text-sm font-medium">Max Parties *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.update[i].data.maxParties}
                                        min="1"
                                        step="1"
                                        placeholder="Maximum number of parties"
                                        required
                                    />
                                </label>
                                <!-- Participants per Party -->
                                <label class="label">
                                    <span class="text-sm font-medium">Participants per Party *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.update[i].data.maxPartySize}
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
                {#if categories?.create && (categories?.create as []).length > 0}
                    <div>
                        <p>New Categories</p>
                    </div>
                    {#each categories.create as _, i}
                        <div class="p-2 rounded-lg bg-success-50-950">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Name -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Name *</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.create[i].name}
                                        placeholder="Enter category name"
                                    />
                                </label>

                                <!-- Category Type -->
                                <label class="label">
                                    <span class="text-sm font-medium">Category Type *</span>
                                    <select
                                        class="select bg-primary-50-950"
                                        bind:value={categories.create[i].type}
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
                            {#if categories.create[i].type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <CustomTimeInputField
                                    labelText="{$t('create_competition.start_time')} *"
                                    locale={data.i18n.locale}
                                    required
                                    onValueChange={(e) => mixCompetitionDateWithCategoryTimeNewPicker('startTime', 'create', i, e)}
                                />
                                <CustomTimeInputField
                                    labelText="{$t('create_competition.end_time')} *"
                                    locale={data.i18n.locale}
                                    required
                                    onValueChange={(e) => mixCompetitionDateWithCategoryTimeNewPicker('endTime', 'create', i, e)}
                                />

                                <!-- Max Parties -->
                                <label class="label">
                                    <span class="text-sm font-medium">Max Parties *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.create[i].maxParties}
                                        min="1"
                                        step="1"
                                        placeholder="Maximum number of parties"
                                        required
                                    />
                                </label>
                                <!-- Participants per Party -->
                                <label class="label">
                                    <span class="text-sm font-medium">Participants per Party *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.create[i].maxPartySize}
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
                {#if categories.create && (categories.create as []).length === 0}
                    <div
                        class="text-center py-2 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg"
                    >
                    <h3 class="h4 mb-2 text-surface-600 dark:text-surface-300">{$t('create_competition.not_categories_yet')}</h3>
                    <p class="text-surface-500 mb-4">{$t('create_competition.add_category_comment')}</p>
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 rounded-lg"
                            onclick={addCategory}
                            disabled={$form.startDate === "" || $form.startDate === undefined}
                        >
                            <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                            {$t('create_competition.add_category')}
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

        <SuperDebug data={$form} />
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
                {$t('create_competition.cancel')}
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
</div>
