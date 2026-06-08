<script lang="ts">
    import Icon from "@iconify/svelte";
    import { t, locale } from "$lib/translations";
    import { goto } from "$app/navigation";
    import { tick } from "svelte";
    import { superForm } from "sveltekit-superforms";
    import { CalendarDate, today, getLocalTimeZone, fromDate } from "@internationalized/date";
    import { getCategoryTypeName, getPartySizeByCategoryType } from "$lib/utils/category_utils.js";
    import { validateCompetitionForm } from "$lib/utils/competition_form_validation";
    import { collectFormErrorMessages } from "$lib/utils/form_errors";
    import { buildCategoriesPayload, resolveCategoryDateTime, type CategoryDraft } from "../services/competition-categories";
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import { FileUpload, Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
    import { CldImage } from 'svelte-cloudinary';
    import { countries, getCountryFlag, getLocalizedCountryName } from '$lib/utils/country_utils';

    // Components
    import CustomDatePicker from "$lib/components/bits_ui/CustomDatePicker.svelte";
    import LoadingOverlay from "$lib/components/common/LoadingOverlay.svelte";
    import PuzzleLinkSection from "../components/PuzzleLinkSection.svelte";
    import CategoryTagSelector from "$lib/components/competition_edit/CategoryTagSelector.svelte";
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';

    let { data } = $props();

    // Country combobox data
    const countryData = $derived(countries.map(c => ({
        label: getLocalizedCountryName(c.code, $locale),
        value: c.code,
        emoji: getCountryFlag(c.code)
    })));
    let filteredCountries = $state(countries.map(c => ({
        label: getLocalizedCountryName(c.code, $locale),
        value: c.code,
        emoji: getCountryFlag(c.code)
    })));
    // svelte-ignore state_referenced_locally
    let countryValue = $state<string[]>(data.form?.data?.country ? [data.form.data.country as string] : []);
    // svelte-ignore state_referenced_locally
    let countryInputValue = $state(
        data.form?.data?.country
            ? (getLocalizedCountryName(data.form.data.country as string, $locale) || '')
            : ''
    );

    const countryCollection = $derived(useListCollection({
        items: filteredCountries,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
    }));

    // Loading state for form submission
    let isSubmitting = $state(false);
    let loadingMessage = $state('');
    let submissionStartTime = 0;
    const MIN_LOADING_TIME = 400; // Brief minimum to avoid a spinner flash on fast saves

    // Helper to ensure minimum loading time
    async function hideLoading() {
        const elapsed = Date.now() - submissionStartTime;
        if (elapsed < MIN_LOADING_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
        }
        isSubmitting = false;
        loadingMessage = '';
    }

    // Timeout error state (shown separately since $message is controlled by superForm)
    let timeoutError = $state<string | null>(null);

    // svelte-ignore state_referenced_locally
    const { form, errors, constraints, message, enhance } = superForm(data.form, {
        dataType: "json",
        async onSubmit({ cancel }) {
            // Start loading state
            submissionStartTime = Date.now();
            isSubmitting = true;
            loadingMessage = isEdit ? $t('competition.edit.validating_data') : $t('competition.create.validating_data');
            timeoutError = null;

            // Run comprehensive client-side validation
            const isValid = validateFormBeforeSubmit();
            if (!isValid) {
                isSubmitting = false;
                loadingMessage = '';
                await focusFirstInvalidField();
                cancel();
                return;
            }

            // Derive the Prisma { create, update, delete } payload once, here at submit.
            $form.categories = buildCategoriesPayload(categories) as any;

            // Update message based on whether image needs uploading
            if ($form.image_cld_id && !$form.image_cld_id.includes('competitions')) {
                loadingMessage = $t('competition.upload_image');
            } else {
                loadingMessage = $t('competition.saving_competition');
            }
        },
        async onResult({ result }) {
            await hideLoading();
            if (result.type === 'success' && result.data?.form?.message?.success) {
                const competitionId = result.data.form.message.id;
                if (competitionId) {
                    await goto(`/competitions/competition_details/${competitionId}`);
                }
            } else if (result.type === 'error') {
                timeoutError = $t('competition.timeout_error');
            }
        },
        async onError({ result }) {
            await hideLoading();
            timeoutError = result.error?.message || $t('competition.timeout_error');
        },
        async onUpdated({ form }) {
            await hideLoading();
            // If form has errors, focus on first invalid field
            if (!form.valid) {
                await focusFirstInvalidField();
            }
        }
    });

    // Comprehensive form validation before submit. Adapts the single CategoryDraft[]
    // model to the existing (create/update) validator and distributes the per-row
    // errors back onto each draft for display.
    function validateFormBeforeSubmit(): boolean {
        const existing = activeCategories.filter((c) => c.origin === 'existing');
        const created = activeCategories.filter((c) => c.origin === 'new');

        const toCatData = (c: CategoryDraft) => ({
            description: c.description,
            type: c.type,
            maxParties: c.maxParties,
            maxPartySize: c.maxPartySize,
            price: c.price
        });
        const toTimes = (c: CategoryDraft) => ({
            startTime: c.startTime,
            endTime: c.endTime,
            date: c.startDate,
            endDate: c.endDate
        });

        const result = validateCompetitionForm(
            $form,
            { create: created.map(toCatData), update: existing.map((c) => ({ data: toCatData(c) })) },
            { create: created.map(toTimes), update: existing.map(toTimes) },
            isMultiDay,
            $t
        );

        formErrors = result.formErrors;
        dateError = result.dateError;
        created.forEach((c, i) => (c.errors = result.categoryErrors.create[i] ?? {}));
        existing.forEach((c, i) => (c.errors = result.categoryErrors.update[i] ?? {}));

        return result.isValid;
    }

    async function focusFirstInvalidField() {
        await tick();

        // Check form errors first (name field)
        if (formErrors.name) {
            const nameInput = document.querySelector<HTMLInputElement>('input[name="competition_name"]');
            if (nameInput) {
                nameInput.focus();
                nameInput.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        // Check for date error and focus on date picker
        if (dateError && datePickerRef) {
            datePickerRef.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            // Try to focus the first input inside the date picker
            const dateInput = datePickerRef.querySelector<HTMLElement>('[data-segment]');
            dateInput?.focus?.();
            return;
        }

        // Check for category errors
        const firstErrorSpan = document.querySelector<HTMLSpanElement>('span.invalid');
        if (firstErrorSpan) {
            // Find the closest input or select within the same container
            const container = firstErrorSpan.closest('.label');
            const input = container?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select, textarea');
            if (input) {
                input.focus();
                input.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        // Fallback to HTML5 invalid fields
        const firstInvalidInput = document.querySelector<HTMLInputElement>('input:invalid, select:invalid, textarea:invalid');
        if (firstInvalidInput) {
            firstInvalidInput.focus();
            firstInvalidInput.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        }
    }
    const isEdit = $form.id !== undefined;

    // Server-side validation errors, flattened into readable lines so the organizer
    // sees exactly which field/category to fix instead of a generic "not valid".
    const serverErrorMessages = $derived(collectFormErrorMessages($errors));

    // Single source of truth for the categories editor. The Prisma
    // { create, update, delete } payload is derived from this once at submit.
    let categories = $state<CategoryDraft[]>([]);

    // Here inject the data from the current competition in form
    let initialCompetitionStartDate = $state<CalendarDate | null>(null);
    let selected_image_src = $state<string | undefined>(undefined);

    // Date validation error
    let dateError = $state<string | null>(null);
    let datePickerRef = $state<HTMLDivElement>();

    // Multi-day state
    let isMultiDay = $state(false);


    // Client-side validation errors for main form fields
    let formErrors = $state<{
        name?: string;
        location?: string;
        description?: string;
        country?: string;
        postalCode?: string;
        paymentMethod?: string;
    }>({});

    // Confirmation dialog state
    let showRemoveConfirmation = $state(false);
    let pendingRemoval = $state<CategoryDraft | null>(null);

    // Categories still on screen — existing rows flagged `removed` are hidden but
    // kept in `categories` so the submit payload can list them for deletion.
    const activeCategories = $derived(categories.filter((c) => !c.removed));
    const existingCategories = $derived(activeCategories.filter((c) => c.origin === 'existing'));
    const newCategories = $derived(activeCategories.filter((c) => c.origin === 'new'));

    /** Build a CalendarDate (1-indexed month) from an ISO/date string. */
    function calendarDateFrom(value: string): CalendarDate {
        const d = new Date(value);
        return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }

    /** Format the local wall-clock "HH:MM" from an ISO/date string. */
    function timeFrom(value: string): string {
        const d = new Date(value);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    if (isEdit) {
        // Map the loaded competition categories (flat array) into rich drafts.
        const loadedCategories = ($form.categories as any[]) || [];
        const drafts: CategoryDraft[] = loadedCategories.map((cat): CategoryDraft => ({
            origin: 'existing',
            id: cat.id,
            description: cat.description ?? '',
            subname: cat.subname ?? '',
            type: cat.type,
            startTime: timeFrom(cat.startTime),
            endTime: timeFrom(cat.endTime),
            startDate: calendarDateFrom(cat.startTime),
            endDate: calendarDateFrom(cat.endTime),
            maxParties: cat.maxParties ?? null,
            maxPartySize: cat.maxPartySize ?? null,
            price: cat.price ?? null,
            status: cat.status,
            puzzleIds: cat.puzzleIds ?? [],
            puzzles: cat.puzzles ?? [],
            tagCategories: cat.tagCategories ?? [],
            errors: {},
        }));
        categories = drafts;

        initialCompetitionStartDate = calendarDateFrom($form.startDate as string);
        selected_image_src = ($form.image_cld_id as string) || undefined;

        // Auto-detect multi-day: categories span multiple calendar days.
        const allDayKeys = new Set(
            drafts.map((c) => (c.startDate ? `${c.startDate.year}-${c.startDate.month}-${c.startDate.day}` : ''))
        );
        if (allDayKeys.size > 1) {
            isMultiDay = true;
        }
    }


    // Update form with creator ID when loaded
    $form.status = "NOT_STARTED";
    if (!isEdit) {
        // On create, connect the creator to the current user.
        // svelte-ignore state_referenced_locally
        $form.creator = { connect: { id: data.user.id } };
    } else {
        // On edit, drop the loaded creator relation: the loader hydrates it as a full
        // User object which does not match the { connect: { id } } schema shape and
        // would fail validation. Leaving it undefined also guarantees we never reassign
        // the creator when an admin or co-organizer edits someone else's competition.
        $form.creator = undefined;
    }
    $form.image_cld_id = undefined;

    $effect(() => {
        $form.image_cld_id = selected_image_src;
    });

    function addCategory() {
        // Default day for a new category: the competition's start day, if one is set.
        const defaultDate = $form.startDate ? calendarDateFrom($form.startDate as string) : null;

        categories.push({
            origin: 'new',
            description: "",
            subname: "",
            type: "INDIVIDUAL",
            startTime: "",
            endTime: "",
            startDate: defaultDate,
            endDate: defaultDate,
            maxParties: null,
            maxPartySize: 1,
            price: 0,
            status: "NOT_STARTED",
            puzzleIds: [],
            puzzles: [],
            tagCategories: [],
            errors: {},
        });
    }

    function requestRemoveCategory(draft: CategoryDraft) {
        // Existing categories may already have registrations — confirm first.
        if (draft.origin === 'existing') {
            pendingRemoval = draft;
            showRemoveConfirmation = true;
        } else {
            // New categories have no registrations — remove immediately.
            removeCategory(draft);
        }
    }

    function confirmRemoveCategory() {
        if (pendingRemoval) {
            removeCategory(pendingRemoval);
            pendingRemoval = null;
            showRemoveConfirmation = false;
        }
    }

    function cancelRemoveCategory() {
        pendingRemoval = null;
        showRemoveConfirmation = false;
    }

    function removeCategory(draft: CategoryDraft) {
        if (draft.origin === 'existing') {
            // Keep it in the array, flagged so the submit payload lists it for deletion.
            draft.removed = true;
        } else {
            categories = categories.filter((c) => c !== draft);
        }
        // Recompute competition dates after removing a category
        autoComputeCompetitionDates();
    }

    // Client-side per-field validation; writes onto the draft's transient errors.
    function validateCategoryField(draft: CategoryDraft, field: string, value: any) {
        const errors = draft.errors;
        switch (field) {
            case 'description':
                if (value && value.length > 60) errors.description = $t('competition.form_error.max_length.category_description');
                else delete errors.description;
                break;
            case 'type':
                if (!value) errors.type = $t('competition.form_error.required.category_type');
                else delete errors.type;
                break;
            case 'startTime':
                if (!value) errors.startTime = $t('competition.form_error.required.start_time');
                else delete errors.startTime;
                break;
            case 'endTime':
                if (!value) errors.endTime = $t('competition.form_error.required.end_time');
                else delete errors.endTime;
                break;
            case 'maxParties':
                if (value !== null && value < 1) errors.maxParties = $t('competition.form_error.min_value.max_parties');
                else delete errors.maxParties;
                break;
            case 'maxPartySize':
                if (value !== null && value < 1) errors.maxPartySize = $t('competition.form_error.min_value.max_party_size');
                else delete errors.maxPartySize;
                break;
            case 'price':
                if (value === null || value === undefined || isNaN(value) || value < 0) errors.price = $t('competition.form_error.min_value.price');
                else delete errors.price;
                break;
        }
    }

    function onDateChange(date_value: CalendarDate | null | undefined) {
        // Clear any previous date error when user interacts with date picker
        dateError = null;

        if (!date_value) return;

        const localTimeZone = getLocalTimeZone();
        const date = date_value.toDate(localTimeZone);
        $form.startDate = fromDate(date, localTimeZone).toAbsoluteString();
        $form.endDate   = fromDate(date, localTimeZone).toAbsoluteString();

        // Single-day mode: every category shares the single competition day.
        for (const c of categories) {
            c.startDate = date_value;
            c.endDate = date_value;
        }

        // Update competition dates with earliest/latest category times
        autoComputeCompetitionDates();
    }

    function onCategoryDateChange(draft: CategoryDraft, date_value: CalendarDate | null | undefined) {
        if (!date_value) return;
        draft.startDate = date_value;
        // Keep the end day on/after the start day.
        if (!draft.endDate || draft.endDate.compare(date_value) < 0) {
            draft.endDate = date_value;
        }
        // Trigger auto-compute of competition dates
        autoComputeCompetitionDates();
    }

    function onCategoryEndDateChange(draft: CategoryDraft, date_value: CalendarDate | null | undefined) {
        if (!date_value) return;
        draft.endDate = date_value;
        autoComputeCompetitionDates();
    }

    function autoComputeCompetitionDates() {
        const allStarts: Date[] = [];
        const allEnds: Date[] = [];

        for (const c of activeCategories) {
            if (c.startDate && c.startTime) allStarts.push(new Date(resolveCategoryDateTime(c.startDate, c.startTime)));
            if (c.endDate && c.endTime) allEnds.push(new Date(resolveCategoryDateTime(c.endDate, c.endTime)));
        }

        if (allStarts.length === 0) return;

        const localTimeZone = getLocalTimeZone();
        const earliest = new Date(Math.min(...allStarts.map((d) => d.getTime())));
        const latest = new Date(Math.max(...allEnds.map((d) => d.getTime())));

        $form.startDate = fromDate(earliest, localTimeZone).toAbsoluteString();
        $form.endDate   = fromDate(latest, localTimeZone).toAbsoluteString();
    }

    function onToggleMultiDay() {
        isMultiDay = !isMultiDay;

        if (isMultiDay) {
            // Off → on: seed each category's day from the single competition date.
            const compDate = $form.startDate ? calendarDateFrom($form.startDate as string) : null;
            for (const c of categories) {
                if (!c.startDate) c.startDate = compDate;
                if (!c.endDate) c.endDate = compDate;
            }
            autoComputeCompetitionDates();
        } else {
            // On → off: collapse to the earliest category day as the single date.
            let earliest: CalendarDate | null = null;
            for (const c of activeCategories) {
                if (c.startDate && (!earliest || c.startDate.compare(earliest) < 0)) {
                    earliest = c.startDate;
                }
            }
            if (earliest) {
                initialCompetitionStartDate = earliest;
                onDateChange(earliest);
            }
        }
    }

    function autofillCategoryMaxPartySize(draft: CategoryDraft, value: string) {
        draft.maxPartySize = getPartySizeByCategoryType(value as CategoryType);
    }

    // Max base64 payload size we allow (~3MB image → ~4MB base64, under Vercel's 4.5MB limit)
    const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB raw file (will be compressed)
    const IMAGE_MAX_DIMENSION = 1200; // px
    const IMAGE_QUALITY = 0.8;
    let imageError = $state<string | null>(null);

    function compressImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                // Scale down if larger than max dimension
                if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
                    if (width > height) {
                        height = Math.round(height * (IMAGE_MAX_DIMENSION / width));
                        width = IMAGE_MAX_DIMENSION;
                    } else {
                        width = Math.round(width * (IMAGE_MAX_DIMENSION / height));
                        height = IMAGE_MAX_DIMENSION;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Could not create canvas context')); return; }

                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    async function handleImageChange(event: { acceptedFiles: File[] }) {
        imageError = null;
        const file = event.acceptedFiles[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_FILE_SIZE) {
            imageError = $t('competition.form_error.image.too_large');
            return;
        }

        try {
            const compressed = await compressImage(file);
            selected_image_src = compressed;
        } catch {
            imageError = $t('competition.form_error.image.processing_failed');
        }
    }

    function handleImageReject() {
        selected_image_src = undefined;
        imageError = $t('competition.form_error.image.rejected');
    }
</script>

<svelte:head>
    <title>{isEdit? $t('edit_competition.title') : $t('competition.create.page_title')}</title>
</svelte:head>

{#if data.notEditable}
    <div class="container mx-auto space-y-6 py-8">
        <div class="card preset-outlined-surface-200-800 p-6 max-w-lg mx-auto space-y-4 text-center">
            <Icon icon="mdi:lock-outline" width="3rem" class="mx-auto text-warning-500" />
            <h3 class="h3">{$t('competition.edit.not_editable_title')}</h3>
            <p class="text-surface-600-400">
                {$t('competition.edit.not_editable_message', { name: data.notEditable.competitionName, status: data.notEditable.status })}
            </p>
            <a href="/competitions/competition_details/{data.notEditable.competitionId}" class="btn preset-filled-primary-500">
                <Icon icon="mdi:arrow-left" width="1.2rem" />
                {$t('competition_details.back_to_competitions_button')}
            </a>
        </div>
    </div>
{:else}

<TitleBackButton href={isEdit ? `/competitions/competition_details/${$form.id}` : '/competitions/explore_competitions'} text={isEdit? $t('competition.edit.title') : $t('competition.create.title')} subtitle={isEdit ? $form.name : undefined} />
<div class="container mx-auto relative">
    <!-- Header Section -->
    <div class="space-y-3 mb-2">
        <div>
            <p class="text-surface-600-400">
                {isEdit
                    ? $t("edit_competition.details")
                    : $t("competition.create.details")}
            </p>
        </div>
    </div>

    <form
        method="POST"
        action="?/create_update_competition"
        enctype="multipart/form-data"
        class="space-y-4"
        novalidate
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
                {$t('competition.create.details_title')}
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="label">
                    <span>{$t('competition.create.competition_name')} *</span>
                    <input
                        type="text"
                        name="competition_name"
                        bind:value={$form.name}
                        class="input rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.name || $errors.name}
                        oninput={() => {
                            // Clear error on input
                            if (formErrors.name) formErrors.name = undefined;
                        }}
                    />
                    {#if formErrors.name}
                        <span class="invalid text-error-500 text-sm">{formErrors.name}</span>
                    {:else if $errors.name}
                        <span class="invalid text-error-500 text-sm">{$errors.name}</span>
                    {/if}
                </div>

                <div class="label">
                    <span>{$t('competition.create.location')}</span>
                    <input
                        type="text"
                        name="location"
                        bind:value={$form.location}
                        maxlength="120"
                        class="input rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.location || $errors.location}
                        oninput={() => {
                            if (formErrors.location) formErrors.location = undefined;
                        }}
                    />
                    {#if formErrors.location}
                        <span class="invalid text-error-500 text-sm">{formErrors.location}</span>
                    {:else if $errors.location}
                        <span class="invalid text-error-500 text-sm">{$errors.location}</span>
                    {/if}
                </div>

                <div class="label">
                    <span>{$t('competition.create.country')}</span>
                    <input type="hidden" name="country" value={countryValue[0] || ''} />
                    <div class="border border-surface-300 dark:border-surface-600 rounded-lg overflow-hidden bg-primary-50-950">
                        <Combobox
                            collection={countryCollection}
                            value={countryValue}
                            inputValue={countryInputValue}
                            onValueChange={(e) => {
                                countryValue = e.value;
                                $form.country = e.value[0] || null;
                                if (formErrors.country) formErrors.country = undefined;
                            }}
                            onInputValueChange={(e) => {
                                countryInputValue = e.inputValue;
                                filteredCountries = countryData.filter((item) =>
                                    item.label.toLowerCase().includes(e.inputValue.toLowerCase())
                                );
                            }}
                            onOpenChange={() => { filteredCountries = countryData; }}
                            placeholder={$t('competition.create.select_country')}
                        >
                            <Combobox.Control>
                                <Combobox.Input class="input text-sm px-3 py-2 bg-transparent border-none w-full" />
                                <Combobox.Trigger />
                            </Combobox.Control>
                            <Portal>
                                <Combobox.Positioner>
                                    <Combobox.Content class="card bg-surface-50 dark:bg-surface-900 p-2 shadow-xl max-h-48 overflow-y-auto rounded-lg">
                                        {#each countryCollection.items as item}
                                            <Combobox.Item {item}>
                                                <Combobox.ItemText>
                                                    <div class="flex items-center gap-2 p-1">
                                                        <span>{item.emoji}</span>
                                                        <span>{item.label}</span>
                                                    </div>
                                                </Combobox.ItemText>
                                                <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                                            </Combobox.Item>
                                        {/each}
                                    </Combobox.Content>
                                </Combobox.Positioner>
                            </Portal>
                        </Combobox>
                    </div>
                    {#if formErrors.country}
                        <span class="invalid text-error-500 text-sm">{formErrors.country}</span>
                    {:else if $errors.country}
                        <span class="invalid text-error-500 text-sm">{$errors.country}</span>
                    {/if}
                </div>

                <div class="label">
                    <span>{$t('competition.create.postal_code')}</span>
                    <input
                        type="text"
                        name="postalCode"
                        bind:value={$form.postalCode}
                        maxlength="20"
                        placeholder={$t('competition.create.postal_code_placeholder')}
                        class="input rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.postalCode || $errors.postalCode}
                        oninput={() => {
                            if (formErrors.postalCode) formErrors.postalCode = undefined;
                        }}
                    />
                    {#if formErrors.postalCode}
                        <span class="invalid text-error-500 text-sm">{formErrors.postalCode}</span>
                    {:else if $errors.postalCode}
                        <span class="invalid text-error-500 text-sm">{$errors.postalCode}</span>
                    {/if}
                </div>

                <div class="label lg:col-span-2">
                    <span>{$t('competition.create.comments')}</span>
                    <textarea
                        name="description"
                        bind:value={$form.description}
                        rows="3"
                        maxlength="1000"
                        class="textarea rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.description || $errors.description}
                        oninput={() => {
                            if (formErrors.description) formErrors.description = undefined;
                        }}
                    ></textarea>
                    {#if formErrors.description}
                        <span class="invalid text-error-500 text-sm">{formErrors.description}</span>
                    {:else if $errors.description}
                        <span class="invalid text-error-500 text-sm">{$errors.description}</span>
                    {/if}
                </div>

                <div class="label lg:col-span-2">
                    <span>{$t('competition.create.payment_method')}</span>
                    <textarea
                        name="payment_method"
                        bind:value={$form.paymentMethod}
                        rows="3"
                        maxlength="500"
                        class="textarea rounded-lg bg-primary-50-950"
                        class:input-error={formErrors.paymentMethod || $errors.paymentMethod}
                        placeholder={$t('competition.create.payment_method_placeholder')}
                        data-testid="payment-method"
                        oninput={() => {
                            if (formErrors.paymentMethod) formErrors.paymentMethod = undefined;
                        }}
                    ></textarea>
                    {#if formErrors.paymentMethod}
                        <span class="invalid text-error-500 text-sm">{formErrors.paymentMethod}</span>
                    {:else if $errors.paymentMethod}
                        <span class="invalid text-error-500 text-sm">{$errors.paymentMethod}</span>
                    {/if}
                </div>

                <!-- Show payment warning toggle -->
                <div class="label lg:col-span-2">
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={$form.showPaymentWarning}
                            aria-label={$t('competition.create.show_payment_warning')}
                            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 {$form.showPaymentWarning ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}"
                            onclick={() => { $form.showPaymentWarning = !$form.showPaymentWarning; }}
                            data-testid="show-payment-warning-toggle"
                        >
                            <span
                                aria-hidden="true"
                                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {$form.showPaymentWarning ? 'translate-x-5' : 'translate-x-0'}"
                            ></span>
                        </button>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium">{$t('competition.create.show_payment_warning')}</span>
                            <span class="text-xs text-surface-500">{$t('competition.create.show_payment_warning_help')}</span>
                        </div>
                    </div>
                </div>

                <!-- Open registration toggle -->
                <div class="label lg:col-span-2">
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={$form.registrationOpen}
                            aria-label={$t('competition.create.registration_open')}
                            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 {$form.registrationOpen ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}"
                            onclick={() => { $form.registrationOpen = !$form.registrationOpen; }}
                            data-testid="registration-open-toggle"
                        >
                            <span
                                aria-hidden="true"
                                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {$form.registrationOpen ? 'translate-x-5' : 'translate-x-0'}"
                            ></span>
                        </button>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium">{$t('competition.create.registration_open')}</span>
                            <span class="text-xs text-surface-500">{$t('competition.create.registration_open_help')}</span>
                        </div>
                    </div>
                </div>

                <div class="label">
                    <span>{$t('competition.create.image')}</span>
                    {#if selected_image_src === undefined}
                        <FileUpload accept="image/*" maxFiles={1} onFileChange={handleImageChange} onFileReject={handleImageReject}>
                            <FileUpload.Dropzone>
                                <FileUpload.Trigger class="btn preset-tonal">{$t('competition.create.choose_image')}</FileUpload.Trigger>
                            </FileUpload.Dropzone>
                            <FileUpload.HiddenInput name="competition_image" />
                        </FileUpload>
                        {#if imageError}
                            <span class="text-error-500 text-sm mt-1">{imageError}</span>
                        {/if}
                    {:else}
                        <div class="flex flex-col items-center gap-2">
                            {#if selected_image_src?.includes('competitions')}
                                <CldImage src={selected_image_src} width="800" height="400" alt="Competition" class="rounded-lg" />
                            {:else}
                                <img src={selected_image_src} alt="Competition" class="rounded-lg" />
                                <input type="hidden" name="competition_image" value={selected_image_src} />
                            {/if}
                            <button
                                type="button"
                                class="btn preset-filled-error-500 rounded-lg"
                                onclick={() => selected_image_src = undefined}
                            >
                                <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                {$t('competition.create.remove_image')}
                            </button>
                        </div>
                    {/if}
                </div>
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
                {$t('competition.create.date_title')}
            </h2>

            <!-- Multi-day toggle -->
            <div class="flex items-center gap-3 mb-4">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isMultiDay}
                    aria-label={$t('competition.create.multi_day_toggle')}
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 {isMultiDay ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}"
                    onclick={onToggleMultiDay}
                >
                    <span
                        aria-hidden="true"
                        class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {isMultiDay ? 'translate-x-5' : 'translate-x-0'}"
                    ></span>
                </button>
                <span class="text-sm font-medium">{$t('competition.create.multi_day_toggle')}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" bind:this={datePickerRef}>
                {#if !isMultiDay}
                    <!-- Single-day mode -->
                    <div class="label" data-testid="date-picker">
                        <CustomDatePicker
                            name="start_date"
                            labelText="{$t('edit_competition.date')} *"
                            locale={data.i18n.locale}
                            value={initialCompetitionStartDate ?? undefined}
                            minValue={today(getLocalTimeZone())}
                            disableDaysOutsideMonth={true}
                            weekStartsOn={1}
                            pagedNavigation={true}
                            onValueChange={(e) => onDateChange(e)}
                        />
                        {#if dateError}
                            <span class="invalid text-error-500 text-sm">{dateError}</span>
                        {/if}
                    </div>
                {:else}
                    <!-- Multi-day mode: dates are auto-computed from categories -->
                    <div class="md:col-span-2">
                        <div class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 py-2">
                            <Icon icon="mdi:information-outline" width="1.1rem" height="1.1rem" />
                            <span>{$t('competition.create.auto_computed_dates')}</span>
                        </div>
                        {#if $form.startDate || $form.endDate}
                            <div class="flex items-center gap-2 text-sm mt-1">
                                <Icon icon="mdi:calendar-range" width="1.1rem" height="1.1rem" class="text-primary-500" />
                                <span class="font-medium">
                                    {#if $form.startDate}
                                        {new Date($form.startDate as string).toLocaleDateString(data.i18n.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    {/if}
                                    {#if $form.endDate && $form.startDate !== $form.endDate}
                                        &nbsp;–&nbsp;{new Date($form.endDate as string).toLocaleDateString(data.i18n.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    {/if}
                                </span>
                            </div>
                        {/if}
                        {#if dateError}
                            <span class="invalid text-error-500 text-sm mt-2">{dateError}</span>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Categories Section -->
        <div class="card preset-outlined-surface-200-800 p-4 rounded-lg">
            <div class="flex items-center justify-between gap-2 mb-4">
                <h2 class="h4 font-semibold flex items-center gap-2">
                    <Icon
                        icon="mdi:format-list-bulleted"
                        width="1.5rem"
                        height="1.5rem"
                        class="text-primary-500"
                    />
                    {$t('competition.create.categories_title')}
                </h2>

                <button
                    type="button"
                    class="btn-icon sm:btn preset-filled-primary-500 rounded-lg shrink-0"
                    onclick={addCategory}
                    disabled={!isMultiDay && !$form.startDate}
                    aria-label={$t('competition.create.add_category')}
                >
                    <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                    <span class="hidden sm:inline">{$t('competition.create.add_category')}</span>
                </button>
            </div>

            <div class="space-y-4">
                {#if existingCategories.length > 0}
                    <div>
                        <p>{$t('competition.create.current_categories')}</p>
                    </div>
                    {#each existingCategories as cat, i (cat)}
                        <div class="p-2 rounded-lg bg-warning-50-950" data-testid="category-update-{i}">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Type -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_type')}</span>
                                    <select
                                        id="category-type-update-{i}"
                                        class="select bg-primary-50-950"
                                        class:input-error={cat.errors?.type}
                                        bind:value={cat.type}
                                        onchange={(e) => {
                                            autofillCategoryMaxPartySize(cat, (e.target as HTMLInputElement).value);
                                            validateCategoryField(cat, 'type', (e.target as HTMLInputElement).value);
                                        }}
                                    >
                                        <option value="">{$t('competition.create.select_category_type')}</option>
                                        {#each data.props?.categoryTypes ?? [] as categoryType}
                                            <option value={categoryType}>
                                                {$t(getCategoryTypeName(categoryType as CategoryType))}
                                            </option>
                                        {/each}
                                    </select>
                                    {#if cat.errors?.type}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.type}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Category Details (only show when type is selected) -->
                            {#if cat.type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Category Subname -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_subname')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={cat.subname}
                                        placeholder={$t('competition.create.category_subname_placeholder')}
                                        maxlength="60"
                                    />
                                </div>
                                <!-- Category Dates (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-start-date-update-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_date')}
                                        value={cat.startDate ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryDateChange(cat, e)}
                                    />
                                    {#if cat.errors?.date}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.date}</span>
                                    {/if}
                                </div>
                                {/if}
                                <!-- Start Time -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.start_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.startTime}
                                        data-testid="start-time-update-{i}"
                                        bind:value={cat.startTime}
                                        onchange={() => {
                                            autoComputeCompetitionDates();
                                            validateCategoryField(cat, 'startTime', cat.startTime);
                                        }}
                                    />
                                    {#if cat.errors?.startTime}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.startTime}</span>
                                    {/if}
                                </div>
                                <!-- Category End Date (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-end-date-update-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_end_date')}
                                        value={cat.endDate ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={cat.startDate ?? today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryEndDateChange(cat, e)}
                                    />
                                    {#if cat.errors?.endDate}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.endDate}</span>
                                    {/if}
                                </div>
                                {/if}
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.end_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.endTime}
                                        data-testid="end-time-update-{i}"
                                        bind:value={cat.endTime}
                                        onchange={() => {
                                            autoComputeCompetitionDates();
                                            validateCategoryField(cat, 'endTime', cat.endTime);
                                        }}
                                    />
                                    {#if cat.errors?.endTime}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.endTime}</span>
                                    {/if}
                                </div>

                                <!-- Max Parties -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.max_parties')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.maxParties}
                                        data-testid="max-parties-update-{i}"
                                        bind:value={cat.maxParties}
                                        min="1"
                                        step="1"
                                        placeholder={$t('competition.create.max_parties_placeholder')}
                                        oninput={(e) => validateCategoryField(cat, 'maxParties', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if cat.errors?.maxParties}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.maxParties}</span>
                                    {/if}
                                </div>
                                <!-- Participants per Party -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.participants_per_party')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.maxPartySize}
                                        data-testid="max-party-size-update-{i}"
                                        bind:value={cat.maxPartySize}
                                        min="1"
                                        oninput={(e) => validateCategoryField(cat, 'maxPartySize', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if cat.errors?.maxPartySize}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.maxPartySize}</span>
                                    {/if}
                                </div>
                                <!-- Price -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.price')} *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.price}
                                        data-testid="price-update-{i}"
                                        bind:value={cat.price}
                                        min="0"
                                        step="1"
                                        placeholder={$t('competition.create.price_placeholder')}
                                        oninput={(e) => validateCategoryField(cat, 'price', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if cat.errors?.price}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.price}</span>
                                    {/if}
                                </div>
                                <!-- Category Description -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_description')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.description}
                                        data-testid="description-update-{i}"
                                        bind:value={cat.description}
                                        placeholder={$t('competition.create.category_description_placeholder')}
                                        minlength="3"
                                        maxlength="60"
                                        oninput={(e) => validateCategoryField(cat, 'description', (e.target as HTMLInputElement).value)}
                                    />
                                    {#if cat.errors?.description}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.description}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Sub-prize tags -->
                            <div class="mt-4 border-t border-surface-200 dark:border-surface-700 pt-3">
                                <CategoryTagSelector
                                    tags={data.props?.participantTags ?? []}
                                    bind:tagCategories={cat.tagCategories}
                                />
                            </div>
                            {/if}
                            <!-- Puzzles Section -->
                            <PuzzleLinkSection
                                puzzleIds={cat.puzzleIds || []}
                                initialPuzzles={cat.puzzles || []}
                                onUpdate={(ids) => cat.puzzleIds = ids}
                            />
                            <div class="flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    class="btn preset-tonal rounded-lg"
                                    onclick={() => requestRemoveCategory(cat)}
                                >
                                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                    {$t('competition.create.remove_category')}
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
                {#if newCategories.length > 0}
                    <div>
                        <p>{$t('competition.create.new_categories')}</p>
                    </div>
                    {#each newCategories as cat, i (cat)}
                        <div class="p-2 rounded-lg bg-success-50-950" data-testid="category-create-{i}">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Type -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_type')}</span>
                                    <select
                                        id="category-type-create-{i}"
                                        class="select bg-primary-50-950"
                                        class:input-error={cat.errors?.type}
                                        bind:value={cat.type}
                                        onchange={(e) => {
                                            autofillCategoryMaxPartySize(cat, (e.target as HTMLInputElement).value);
                                            validateCategoryField(cat, 'type', (e.target as HTMLInputElement).value);
                                        }}
                                    >
                                        <option value="">{$t('competition.create.select_category_type')}</option>
                                        {#each data.props?.categoryTypes ?? [] as categoryType}
                                            <option value={categoryType}>
                                                {$t(getCategoryTypeName(categoryType as CategoryType))}
                                            </option>
                                        {/each}
                                    </select>
                                    {#if cat.errors?.type}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.type}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Category Details (only show when type is selected) -->
                            {#if cat.type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Category Dates (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-start-date-create-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_date')}
                                        value={cat.startDate ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryDateChange(cat, e)}
                                    />
                                    {#if cat.errors?.date}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.date}</span>
                                    {/if}
                                </div>
                                {/if}
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.start_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.startTime}
                                        data-testid="start-time-create-{i}"
                                        bind:value={cat.startTime}
                                        onchange={() => {
                                            autoComputeCompetitionDates();
                                            validateCategoryField(cat, 'startTime', cat.startTime);
                                        }}
                                    />
                                    {#if cat.errors?.startTime}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.startTime}</span>
                                    {/if}
                                </div>
                                <!-- Category End Date (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-end-date-create-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_end_date')}
                                        value={cat.endDate ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={cat.startDate ?? today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryEndDateChange(cat, e)}
                                    />
                                    {#if cat.errors?.endDate}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.endDate}</span>
                                    {/if}
                                </div>
                                {/if}
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.end_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.endTime}
                                        data-testid="end-time-create-{i}"
                                        bind:value={cat.endTime}
                                        onchange={() => {
                                            autoComputeCompetitionDates();
                                            validateCategoryField(cat, 'endTime', cat.endTime);
                                        }}
                                        min={cat.startTime}
                                    />
                                    {#if cat.errors?.endTime}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.endTime}</span>
                                    {/if}
                                </div>

                                <!-- Max Parties -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.max_parties')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.maxParties}
                                        data-testid="max-parties-create-{i}"
                                        bind:value={cat.maxParties}
                                        min="1"
                                        step="1"
                                        placeholder={$t('competition.create.max_parties_placeholder')}
                                        oninput={(e) => validateCategoryField(cat, 'maxParties', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if cat.errors?.maxParties}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.maxParties}</span>
                                    {/if}
                                </div>
                                <!-- Participants per Party -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.participants_per_party')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.maxPartySize}
                                        data-testid="max-party-size-create-{i}"
                                        bind:value={cat.maxPartySize}
                                        min="1"
                                        oninput={(e) => validateCategoryField(cat, 'maxPartySize', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if cat.errors?.maxPartySize}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.maxPartySize}</span>
                                    {/if}
                                </div>
                                <!-- Price -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.price')} *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.price}
                                        data-testid="price-create-{i}"
                                        bind:value={cat.price}
                                        min="0"
                                        step="1"
                                        placeholder={$t('competition.create.price_placeholder')}
                                        oninput={(e) => validateCategoryField(cat, 'price', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if cat.errors?.price}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.price}</span>
                                    {/if}
                                </div>
                                <!-- Category Description -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_description')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        class:input-error={cat.errors?.description}
                                        data-testid="description-create-{i}"
                                        bind:value={cat.description}
                                        placeholder={$t('competition.create.category_description_placeholder')}
                                        minlength="3"
                                        maxlength="60"
                                        oninput={(e) => validateCategoryField(cat, 'description', (e.target as HTMLInputElement).value)}
                                    />
                                    {#if cat.errors?.description}
                                        <span class="invalid text-error-500 text-sm">{cat.errors.description}</span>
                                    {/if}
                                </div>
                                <!-- Category Subname -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_subname')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={cat.subname}
                                        placeholder={$t('competition.create.category_subname_placeholder')}
                                        maxlength="60"
                                    />
                                </div>
                            </div>

                            <!-- Sub-prize tags -->
                            <div class="mt-4 border-t border-surface-200 dark:border-surface-700 pt-3">
                                <CategoryTagSelector
                                    tags={data.props?.participantTags ?? []}
                                    bind:tagCategories={cat.tagCategories}
                                />
                            </div>
                            {/if}
                            <!-- Puzzles Section -->
                            <PuzzleLinkSection
                                puzzleIds={cat.puzzleIds || []}
                                onUpdate={(ids) => cat.puzzleIds = ids}
                            />
                            <div class="flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    class="btn preset-tonal rounded-lg"
                                    onclick={() => requestRemoveCategory(cat)}
                                >
                                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                    {$t('competition.create.remove_category')}
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
                {#if newCategories.length === 0}
                    <div
                        class="text-center py-2 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg"
                    >
                    <h3 class="h4 mb-2 text-surface-600 dark:text-surface-300">{$t('competition.create.not_categories_yet')}</h3>
                    <p class="text-surface-500 mb-4">{$t('competition.create.add_category_comment')}</p>
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 rounded-lg"
                            onclick={addCategory}
                            disabled={!isMultiDay && !$form.startDate}
                        >
                            <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                            {$t('competition.create.add_category')}
                        </button>
                    </div>
                {:else}
                    <div class="flex justify-center pt-2">
                        <button
                            type="button"
                            class="btn preset-filled-primary-500 rounded-lg"
                            onclick={addCategory}
                            disabled={!isMultiDay && !$form.startDate}
                        >
                            <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                            {$t('competition.create.add_category')}
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
                    {$t('edit_competition.warning')}
                </h2>
                <p class="text-warning-700-300">
                    {$t('edit_competition.registers_warning')}
                </p>
            </div>
        {/if}

        <!-- Alert Messages -->
        {#if timeoutError}
            <div class="alert preset-filled-error-500 rounded-lg mt-4 p-2 flex items-center gap-2">
                <Icon icon="mdi:cloud-off-outline" width="1.5rem" height="1.5rem" />
                <div>
                    <h4 class="font-semibold">{$t('competition.create.image_upload_error_title') ?? 'Upload Error'}</h4>
                    <p>{timeoutError}</p>
                </div>
            </div>
        {/if}
        {#if $message && $message.success === true}
            <div class="alert preset-filled-success-500 rounded-lg mt-4 p-2 flex items-center">
                <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
                <div class="p-2">
                    <h4 class="font-semibold">{$t('competition.created_success')}</h4>
                    <p class="mt-1">
                        <a
                            href={`/competitions/competition_details/${$message.id}`}
                            class="anchor"
                        >
                            {$t('competition.view_updated')}
                        </a>
                    </p>
                </div>
            </div>
        {:else if $message && $message.success === false }
            <div class="alert preset-filled-error-500 rounded-lg mt-4 p-2 flex items-start gap-2">
                <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" class="mt-0.5 shrink-0" />
                <div>
                    <h4 class="font-semibold">{$t('competition.error')}</h4>
                    {#if serverErrorMessages.length > 0}
                        <p class="mt-1">{$t('competition.fix_errors')}</p>
                        <ul class="list-disc list-inside mt-1 space-y-0.5">
                            {#each serverErrorMessages as errorLine}
                                <li>{errorLine}</li>
                            {/each}
                        </ul>
                    {:else}
                        <p>{$message.message}</p>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-4 mt-4">
            {#if isEdit}
                <a
                    href="/competitions/competition_details/{$form.id}"
                    class="btn preset-tonal rounded-lg"
                    class:pointer-events-none={isSubmitting}
                    class:opacity-50={isSubmitting}
                >
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                    {$t('edit_competition.cancel')}
                </a>
            {:else}
                <a
                    href="/"
                    class="btn preset-tonal rounded-lg"
                    class:pointer-events-none={isSubmitting}
                    class:opacity-50={isSubmitting}
                >
                    <Icon icon="mdi:cancel" width="1.2rem" height="1.2rem" />
                {$t('competition.create.cancel')}
                </a>
            {/if}
            <button
                type="submit"
                class="btn preset-filled-primary-500 rounded-lg"
                data-testid="submit-competition"
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <Icon icon="mdi:loading" width="1.2rem" height="1.2rem" class="animate-spin" />
                    {loadingMessage || $t('competition.saving')}
                {:else}
                    <Icon icon="mdi:content-save" width="1.2rem" height="1.2rem" />
                    {isEdit
                        ? $t('edit_competition.submit_button')
                        : $t('competition.create.submit_button')
                    }
                {/if}
            </button>
        </div>
    </form>

    <!-- Loading Overlay -->
    <LoadingOverlay show={isSubmitting} message={loadingMessage} />
</div>

<!-- Confirmation Dialog for Category Removal -->
{#if showRemoveConfirmation}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
        <div class="card preset-filled-surface-100-900 p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
            <h3 class="h4 font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:alert" width="1.5rem" height="1.5rem" class="text-warning-500" />
                {$t('competition.confirm_removal_title')}
            </h3>
            <p class="mb-6 text-surface-600-400">
                {$t('competition.confirm_removal_message')}
            </p>
            <div class="flex justify-end gap-4">
                <button
                    type="button"
                    class="btn preset-tonal rounded-lg"
                    onclick={cancelRemoveCategory}
                >
                    {$t('competition.create.cancel')}
                </button>
                <button
                    type="button"
                    class="btn preset-filled-error-500 rounded-lg"
                    onclick={confirmRemoveCategory}
                >
                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                    {$t('competition.remove')}
                </button>
            </div>
        </div>
    </div>
{/if}
{/if}
