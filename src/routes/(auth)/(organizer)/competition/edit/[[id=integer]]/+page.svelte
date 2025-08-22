<script lang="ts">
    import { type Competition, type Category, Prisma } from "@prisma/client";
    import Icon from "@iconify/svelte";
    import CategoryCreatorUpdator from "$lib/components/CategoryCreatorUpdator.svelte";
    import { t } from "$lib/translations";
    import SuperDebug, { superForm } from "sveltekit-superforms";
    import { enhance } from "$app/forms";
    import { number } from "zod";

    let { data } = $props();
    const { form } = superForm(data.form, {dataType:"json"});
    let categories = $state<any[]>([]);

    const existingCompetition = data?.props?.competition;
    const isEdit = existingCompetition?.id !== undefined;
    const existingCategories = existingCompetition?.categories || [];

    // Initialize competition data with existing values
    let updated_competition = $state<Prisma.CompetitionUpdateInput>({
        name: existingCompetition?.name || "",
        location: existingCompetition?.location || "",
        description: existingCompetition?.description || "",
        startDate: existingCompetition?.startDate
            ? new Date(existingCompetition.startDate)
                  .toISOString()
                  .split("T")[0]
            : "",
        endDate: existingCompetition?.endDate
            ? new Date(existingCompetition.endDate).toISOString().split("T")[0]
            : "",
        creator: { connect: { id: data.user.id } },
    });

    // Update form with creator ID when loaded
    $form.status = "UPCOMING";
    $form.creator = { connect: { id: data.user.id } };

    // Reactively update form categories when categories change
    $effect(() => {
        $form.categories = categories;
    });

    function addCategory() {
        categories = [...categories, {
            name: "",
            type: "INDIVIDUAL", // or whatever default CategoryType you want
            startTime: "", // Add this property
            endTime: "", // Add this property
            competitionId: 0, // This should be set to the actual competition ID
            // Optional fields can be omitted or set to defaults
            maxParties: null, // Add this property
            maxPartySize: 1, // Change from null to 1
            status: "UPCOMING"
        }];
    }

    $effect(() => {
        console.log("$form.categories", $form.categories);
    });
</script>

<svelte:head>
    <title>{isEdit ? `Edit ${existingCompetition?.name}` : "Create Competition"}</title>
</svelte:head>

<h4>{isEdit ? $t(`competition.edit_competition`) : $t('competition.create_competition')}</h4>
<div class="container mx-auto">
    <!-- Header Section -->
    <div class="space-y-3 mb-2">
        <div>
            <p class="text-surface-600-400">
                {isEdit
                    ? $t("competition.update_competition_details")
                    : $t('competition.create_competition_details')}
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
                    <a
                        href={`/competitions/competition_details/${form.competitionId}`}
                        class="anchor"
                    >
                        View updated competition →
                    </a>
                </p>
            </div>
        </div>
    {/if}

    <form
        method="POST"
        action="?/update_competition"
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

                <label class="label">
                    <span>Location</span>
                    <input
                        type="text"
                        name="location"
                        bind:value={$form.location}
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>

                <label class="label lg:col-span-2">
                    <span>Description</span>
                    <textarea
                        name="description"
                        bind:value={$form.description}
                        rows="3"
                        class="textarea rounded-lg bg-primary-50-950"
                    ></textarea>
                </label>
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
                    <span>Start Date *</span>
                    <input
                        type="date"
                        name="start_date"
                        bind:value={$form.startDate}
                        required
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>

                <label class="label">
                    <span>End Date</span>
                    <input
                        type="date"
                        name="end_date"
                        bind:value={$form.endDate}
                        min={$form.startDate}
                        class="input rounded-lg bg-primary-50-950"
                    />
                </label>
            </div>
        </div>

        <SuperDebug data={$form} />

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
                >
                    <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                    Add Category
                </button>
            </div>

            <div class="space-y-4">
                {#each categories as category, index}
                    <CategoryCreatorUpdator
                        bind:category={categories[index]}
                        category_types={data.props?.categoryTypes}
                    />
                {/each}

                {#if categories.entries().size === 0}
                    <div
                        class="text-center py-2 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg"
                    >
                        <h3
                            class="h4 mb-2 text-surface-600 dark:text-surface-300"
                        >
                            No categories yet
                        </h3>
                        <p class="text-surface-500 mb-4">
                            Add your first category to get started
                        </p>
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 rounded-lg"
                            onclick={addCategory}
                        >
                            <Icon
                                icon="mdi:plus"
                                width="1.2rem"
                                height="1.2rem"
                            />
                            Add Category
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Hidden inputs for form data
        <input
            type="hidden"
            name="updated_competition"
            value={JSON.stringify({
                ...updated_competition,
                startDate: updated_competition.startDate
                    ? new Date(updated_competition.startDate)
                    : null,
                endDate: updated_competition.endDate
                    ? new Date(updated_competition.endDate)
                    : null,
            })}
        /> -->

        <!-- <input
            type="hidden"
            name="updated_categories"
            value={JSON.stringify(
                Array.from(category_map.values()).map(
                    ({ originalId, ...rest }) => rest,
                ),
            )}
        /> -->
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
                    Editing the competition will delete all the entries present
                    in the categories.
                </p>
            </div>
        {/if}
        <!-- Submit Buttons -->
        <div class="flex justify-end gap-4 mt-4">
            {#if isEdit}
                <a
                    href="/competitions/competition_details/{existingCompetition?.id}"
                    class="btn preset-tonal rounded-lg"
                >
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
            >
                <Icon icon="mdi:content-save" width="1.2rem" height="1.2rem" />
                {isEdit ? "Update Competition" : "Create Competition"}
            </button>
        </div>
    </form>
</div>


