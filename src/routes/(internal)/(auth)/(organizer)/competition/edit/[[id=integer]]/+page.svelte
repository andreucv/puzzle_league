<script lang="ts">
    import Icon from "@iconify/svelte";
    import { t } from "$lib/translations";
    import { goto } from "$app/navigation";
    import { tick } from "svelte";
    import { superForm } from "sveltekit-superforms";
    import { CalendarDate, today, getLocalTimeZone, Time, fromDate, parseAbsolute, toCalendarDateTime} from "@internationalized/date";
    import { getCategoryTypeName, getPartySizeByCategoryType } from "$lib/utils/category_utils.js";
    import { validateCompetitionForm } from "$lib/utils/competition_form_validation";
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import { FileUpload, Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
    import { CldImage } from 'svelte-cloudinary';
    import { countries, getCountryFlag } from '$lib/utils/country_utils';

    // Components
    import CustomDatePicker from "$lib/components/bits_ui/CustomDatePicker.svelte";
    import LoadingOverlay from "$lib/components/LoadingOverlay.svelte";
    import PuzzleLinkSection from "$lib/components/PuzzleLinkSection.svelte";
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';

    let { data } = $props();
    console.log("competition/edit/+page.svelte: data", data);

    // Country combobox data
    const countryData = countries.map(c => ({
        label: c.name,
        value: c.code,
        emoji: getCountryFlag(c.code)
    }));
    let filteredCountries = $state(countryData);
    let countryValue = $state<string[]>(data.form?.data?.country ? [data.form.data.country as string] : []);
    let countryInputValue = $state(
        data.form?.data?.country
            ? (countries.find(c => c.code === data.form.data.country)?.name || '')
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
    const MIN_LOADING_TIME = 2000; // Minimum 2 seconds display

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

    // Comprehensive form validation before submit
    function validateFormBeforeSubmit(): boolean {
        const result = validateCompetitionForm(
            $form,
            categories,
            categories_times_obj_arr,
            isMultiDay,
            $t
        );

        formErrors = result.formErrors;
        dateError = result.dateError;
        categoryErrors = result.categoryErrors;

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

    let toUpdateCategories = [] as any[];
    let toUpdateCategoriesTimes = [] as any[];
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

        const start_time = new Date($form.categories[i].startTime);
        const end_time = new Date($form.categories[i].endTime);
        toUpdateCategoriesTimes[i] = {startTime: `${start_time.getHours().toString().padStart(2, '0')}:${start_time.getMinutes().toString().padStart(2, '0')}`,
                                        endTime: `${end_time.getHours().toString().padStart(2, '0')}:${end_time.getMinutes().toString().padStart(2, '0')}`};
    }

    // Here inject the data from the current competition in form
    let initialCompetitionStartDate: CalendarDate | null = null;
    let selected_image_src = $state<string | undefined>(undefined);

    let categories = $state<{
        create: any[];
        update: any[];
        delete: any[];
    }>({
        create: [],
        update: [],
        delete: [],
    });
    let categories_times_obj_arr = $state<{
        create: any[];
        update: any[];
    }>({
        create: [],
        update: [],
    });

    // Client-side validation errors for categories
    let categoryErrors = $state({
        create: [] as Array<{ description?: string; type?: string; startTime?: string; endTime?: string; maxParties?: string; maxPartySize?: string; price?: string; date?: string; endDate?: string }>,
        update: [] as Array<{ description?: string; type?: string; startTime?: string; endTime?: string; maxParties?: string; maxPartySize?: string; price?: string; date?: string; endDate?: string }>
    });

    // Date validation error
    let dateError = $state<string | null>(null);
    let datePickerRef: HTMLDivElement;

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
    let pendingRemoval = $state<{ source: string; index: number } | null>(null);
    if (isEdit) {
        categories.create = [];
        categories.update = toUpdateCategories;
        categories.delete = [];


        categories_times_obj_arr.create = [];
        categories_times_obj_arr.update = toUpdateCategoriesTimes;

        initialCompetitionStartDate = new CalendarDate(new Date($form.startDate as string).getFullYear(), new Date($form.startDate as string).getMonth() + 1, new Date($form.startDate as string).getDate());
        console.log("initialCompetitionStartDate", $form.startDate);
        console.log("initialCompetitionStartDate", initialCompetitionStartDate);
        selected_image_src = ($form.image_cld_id as string) || undefined;

        // Auto-detect multi-day: check if categories span multiple calendar days
        const allDayKeys = new Set<string>();
        for (const cat of ($form.categories as any[]) || []) {
            const d = new Date(cat.startTime);
            allDayKeys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        }
        if (allDayKeys.size > 1) {
            isMultiDay = true;
        }

        // Populate per-category dates from their startTime and endTime
        for (let i = 0; i < toUpdateCategoriesTimes.length; i++) {
            const d = new Date(($form.categories as any[])[i].startTime);
            toUpdateCategoriesTimes[i].date = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
            const ed = new Date(($form.categories as any[])[i].endTime);
            toUpdateCategoriesTimes[i].endDate = new CalendarDate(ed.getFullYear(), ed.getMonth() + 1, ed.getDate());
        }
    }


    // Update form with creator ID when loaded
    $form.status = "NOT_STARTED";
    $form.creator = { connect: { id: data.user.id } };
    $form.image_cld_id = undefined;

    $effect(() => {
        $form.categories = categories;
        $form.image_cld_id = selected_image_src;
    });

    function addCategory() {
        // Default date for new categories: in multi-day use competition start date, in single-day use the existing competition date
        let defaultDate: CalendarDate | null = null;
        if ($form.startDate) {
            const d = new Date($form.startDate as string);
            defaultDate = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
        }

        categories.create = [...categories.create, {
            description: "",
            subname: "",
            type: "INDIVIDUAL",
            startTime: "",
            endTime: "",
            maxParties: null,
            maxPartySize: 1,
            price: 0,
            status: "not_started",
            puzzleIds: [],
        }];

        categories_times_obj_arr.create = [...categories_times_obj_arr.create, {startTime: "", endTime: "", date: defaultDate, endDate: defaultDate}];
    }

    function requestRemoveCategory(source: 'create' | 'update', index: number) {
        // For existing categories (update), show confirmation dialog
        if (source === "update") {
            pendingRemoval = { source, index };
            showRemoveConfirmation = true;
        } else {
            // For new categories, remove immediately (no registrations possible)
            removeCategory(source, index);
        }
    }

    function confirmRemoveCategory() {
        if (pendingRemoval) {
            removeCategory(pendingRemoval.source, pendingRemoval.index);
            pendingRemoval = null;
            showRemoveConfirmation = false;
        }
    }

    function cancelRemoveCategory() {
        pendingRemoval = null;
        showRemoveConfirmation = false;
    }

    function removeCategory(source: 'create' | 'update', index: number) {
        if(source === "create") {
            categories.create = categories.create.filter((_: any, i: number) => i !== index);
            categories_times_obj_arr.create = categories_times_obj_arr.create.filter((_: any, i: number) => i !== index);
            categoryErrors.create = categoryErrors.create.filter((_: any, i: number) => i !== index);
        } else if (source === "update") {
            const categoryToDelete = categories.update[index].where.id;
            console.log("categoryToDelete", categoryToDelete);
            categories.delete = [...categories.delete, {id: categoryToDelete}];
            categories.update = categories.update.filter((_: any, i: number) => i !== index);
            categories_times_obj_arr.update = categories_times_obj_arr.update.filter((_: any, i: number) => i !== index);
            categoryErrors.update = categoryErrors.update.filter((_: any, i: number) => i !== index);
        }
        // Recompute competition dates after removing a category
        autoComputeCompetitionDates();
    }

    // Client-side validation for category fields
    function validateCategoryField(source: 'create' | 'update', index: number, field: string, value: any) {
        if (!categoryErrors[source][index]) {
            categoryErrors[source][index] = {};
        }

        switch (field) {
            case 'description':
                if (value && value.length > 60) {
                    categoryErrors[source][index].description = $t('competition.form_error.max_length.category_description');
                } else {
                    delete categoryErrors[source][index].description;
                }
                break;
            case 'type':
                if (!value) {
                    categoryErrors[source][index].type = $t('competition.form_error.required.category_type');
                } else {
                    delete categoryErrors[source][index].type;
                }
                break;
            case 'startTime':
                if (!value) {
                    categoryErrors[source][index].startTime = $t('competition.form_error.required.start_time');
                } else {
                    delete categoryErrors[source][index].startTime;
                }
                break;
            case 'endTime':
                if (!value) {
                    categoryErrors[source][index].endTime = $t('competition.form_error.required.end_time');
                } else {
                    delete categoryErrors[source][index].endTime;
                }
                break;
            case 'maxParties':
                if (value !== null && value < 1) {
                    categoryErrors[source][index].maxParties = $t('competition.form_error.min_value.max_parties');
                } else {
                    delete categoryErrors[source][index].maxParties;
                }
                break;
            case 'maxPartySize':
                if (value !== null && value < 1) {
                    categoryErrors[source][index].maxPartySize = $t('competition.form_error.min_value.max_party_size');
                } else {
                    delete categoryErrors[source][index].maxPartySize;
                }
                break;
            case 'price':
                if (value === null || value === undefined || isNaN(value) || value < 0) {
                    categoryErrors[source][index].price = $t('competition.form_error.min_value.price');
                } else {
                    delete categoryErrors[source][index].price;
                }
                break;
        }
    }

    function buildCategoryDateTime(field: string, source: 'create' | 'update', index: number, time_value: string) {
        // Always update the time display value first
        if (time_value) {
            if (source === "create") {
                categories_times_obj_arr.create[index][field] = time_value;
            } else if (source === "update") {
                categories_times_obj_arr.update[index][field] = time_value;
            }
        }

        // Determine the date source: in multi-day mode use the category's own date (endDate for endTime), otherwise the competition date
        let dateSource: string | null = null;
        if (isMultiDay) {
            const catDate = (field === 'endTime'
                ? categories_times_obj_arr[source][index]?.endDate
                : categories_times_obj_arr[source][index]?.date) as CalendarDate | null;
            if (!catDate || !time_value) return "";
            const jsDate = catDate.toDate(getLocalTimeZone());
            dateSource = fromDate(jsDate, getLocalTimeZone()).toAbsoluteString();
        } else {
            if (!$form.startDate || $form.startDate === "" || !time_value) return "";
            dateSource = (new Date($form.startDate as string)).toISOString();
        }

        const localTimeZone = getLocalTimeZone();
        const date = parseAbsolute(dateSource, localTimeZone);
        const js_date = toCalendarDateTime(date, new Time(parseInt(time_value.split(':')[0]), parseInt(time_value.split(':')[1]))).toDate(localTimeZone);
        const updated_date = fromDate(js_date, localTimeZone).toAbsoluteString();

        if(source === "create") {
            categories.create[index][field] = updated_date;
        } else if (source === "update") {
            categories.update[index].data[field] = updated_date;
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

        // In single-day mode, update all category datetimes with the new date
        // Also set the default category date for all categories
        if (categories.create) {
            for (let i = 0; i < categories.create.length; i++) {
                categories_times_obj_arr.create[i].date = date_value;
                buildCategoryDateTime('startTime', 'create', i, categories_times_obj_arr.create[i].startTime);
                buildCategoryDateTime('endTime',   'create', i, categories_times_obj_arr.create[i].endTime);
            }
        }

        if (categories.update) {
            for (let i = 0; i < categories.update.length; i++) {
                categories_times_obj_arr.update[i].date = date_value;
                buildCategoryDateTime('startTime', 'update', i, categories_times_obj_arr.update[i].startTime);
                buildCategoryDateTime('endTime',   'update', i, categories_times_obj_arr.update[i].endTime);
            }
        }

        // Update competition dates with earliest/latest category times
        autoComputeCompetitionDates();
    }

    function onCategoryDateChange(source: 'create' | 'update', index: number, date_value: CalendarDate | null | undefined) {
        if (!date_value) return;
        categories_times_obj_arr[source][index].date = date_value;
        // If endDate hasn't been explicitly set or is before the new start date, sync it
        const curEnd = categories_times_obj_arr[source][index].endDate as CalendarDate | null;
        if (!curEnd || curEnd.compare(date_value) < 0) {
            categories_times_obj_arr[source][index].endDate = date_value;
        }
        buildCategoryDateTime('startTime', source, index, categories_times_obj_arr[source][index].startTime);
        buildCategoryDateTime('endTime',   source, index, categories_times_obj_arr[source][index].endTime);
        // Trigger auto-compute of competition dates
        autoComputeCompetitionDates();
    }

    function onCategoryEndDateChange(source: 'create' | 'update', index: number, date_value: CalendarDate | null | undefined) {
        if (!date_value) return;
        categories_times_obj_arr[source][index].endDate = date_value;
        buildCategoryDateTime('endTime', source, index, categories_times_obj_arr[source][index].endTime);
        autoComputeCompetitionDates();
    }

    function autoComputeCompetitionDates() {

        const allDatetimes: Date[] = [];
        const allEndDatetimes: Date[] = [];

        for (let i = 0; i < categories.create.length; i++) {
            if (categories.create[i].startTime) allDatetimes.push(new Date(categories.create[i].startTime));
            if (categories.create[i].endTime) allEndDatetimes.push(new Date(categories.create[i].endTime));
        }
        for (let i = 0; i < categories.update.length; i++) {
            if (categories.update[i].data.startTime) allDatetimes.push(new Date(categories.update[i].data.startTime));
            if (categories.update[i].data.endTime) allEndDatetimes.push(new Date(categories.update[i].data.endTime));
        }

        if (allDatetimes.length === 0) return;

        const localTimeZone = getLocalTimeZone();
        const earliest = new Date(Math.min(...allDatetimes.map(d => d.getTime())));
        const latest = new Date(Math.max(...allEndDatetimes.map(d => d.getTime())));

        $form.startDate = fromDate(earliest, localTimeZone).toAbsoluteString();
        $form.endDate   = fromDate(latest, localTimeZone).toAbsoluteString();
    }

    function onToggleMultiDay() {
        isMultiDay = !isMultiDay;

        if (isMultiDay) {
            // Switching to multi-day: give each category the current competition date
            const compDate = $form.startDate
                ? (() => { const d = new Date($form.startDate as string); return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()); })()
                : null;
            for (let i = 0; i < categories_times_obj_arr.create.length; i++) {
                categories_times_obj_arr.create[i].date = compDate;
                categories_times_obj_arr.create[i].endDate = compDate;
            }
            for (let i = 0; i < categories_times_obj_arr.update.length; i++) {
                if (!categories_times_obj_arr.update[i].date) {
                    categories_times_obj_arr.update[i].date = compDate;
                }
                if (!categories_times_obj_arr.update[i].endDate) {
                    categories_times_obj_arr.update[i].endDate = compDate;
                }
            }
            autoComputeCompetitionDates();
        } else {
            // Switching to single-day: use the earliest category date as the single competition date
            let earliest: CalendarDate | null = null;
            const allEntries = [...categories_times_obj_arr.create, ...categories_times_obj_arr.update];
            for (const entry of allEntries) {
                if (entry.date && (!earliest || entry.date.compare(earliest) < 0)) {
                    earliest = entry.date;
                }
            }
            if (earliest) {
                initialCompetitionStartDate = earliest;
                onDateChange(earliest);
            }
        }
    }

    function autofillCategoryMaxPartySize(index: number, source: 'create' | 'update', value: string) {
        categories[source][index].maxPartySize = getPartySizeByCategoryType(value as CategoryType);
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

<TitleBackButton href={isEdit ? `/competitions/competition_details/${$form.id}` : '/competitions/explore_competitions'} text={isEdit? $t('competition.edit.title') : $t('competition.create.title')} />
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

                <div class="label">
                    <span>{$t('competition.create.image')}</span>
                    {#if selected_image_src === undefined}
                        <FileUpload accept="image/*" maxFiles={1} onFileChange={handleImageChange} onFileReject={handleImageReject}>
                            <FileUpload.Dropzone>
                                <FileUpload.Trigger class="btn preset-tonal">Choose Image</FileUpload.Trigger>
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
            <div class="flex items-center justify-between mb-4">
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
                    class="btn preset-filled-primary-500 rounded-lg"
                    onclick={addCategory}
                    disabled={!isMultiDay && !$form.startDate}
                >
                    <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                    {$t('competition.create.add_category')}
                </button>
            </div>

            <div class="space-y-4">
                {#if categories?.update && (categories?.update as []).length > 0}
                    <div>
                        <p>{$t('competition.create.current_categories')}</p>
                    </div>
                    {#each categories.update as _, i}
                        <div class="p-2 rounded-lg bg-warning-50-950" data-testid="category-update-{i}">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Type -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_type')}</span>
                                    <select
                                        id="category-type-update-{i}"
                                        class="select bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.type}
                                        bind:value={categories.update[i].data.type}
                                        onchange={(e) => {
                                            autofillCategoryMaxPartySize(i, 'update', (e.target as HTMLInputElement).value);
                                            validateCategoryField('update', i, 'type', (e.target as HTMLInputElement).value);
                                        }}
                                    >
                                        <option value="">{$t('competition.create.select_category_type')}</option>
                                        {#each data.props?.categoryTypes ?? [] as categoryType}
                                            <option value={categoryType}>
                                                {getCategoryTypeName(categoryType as CategoryType)}
                                            </option>
                                        {/each}
                                    </select>
                                    {#if categoryErrors.update[i]?.type}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].type}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Category Details (only show when type is selected) -->
                            {#if categories.update[i].data.type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Category Subname -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_subname')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.update[i].data.subname}
                                        placeholder={$t('competition.create.category_subname_placeholder')}
                                        maxlength="60"
                                    />
                                </div>
                                <!-- Category Dates (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-start-date-update-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_date')}
                                        value={categories_times_obj_arr.update[i]?.date ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryDateChange('update', i, e)}
                                    />
                                    {#if categoryErrors.update[i]?.date}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].date}</span>
                                    {/if}
                                </div>
                                {/if}
                                <!-- Start Time -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.start_time')}</span>
                                    <label for="start-time-{i}" class="sr-only">{$t('competition.create.start_time')}</label>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.startTime}
                                        data-testid="start-time-update-{i}"
                                        value={categories_times_obj_arr.update[i].startTime}
                                        onchange={(e) => {
                                            buildCategoryDateTime('startTime', 'update', i, (e.target as HTMLInputElement).value); autoComputeCompetitionDates();
                                            validateCategoryField('update', i, 'startTime', (e.target as HTMLInputElement).value);
                                        }}
                                    />
                                    {#if categoryErrors.update[i]?.startTime}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].startTime}</span>
                                    {/if}
                                </div>
                                <!-- Category End Date (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-end-date-update-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_end_date')}
                                        value={categories_times_obj_arr.update[i]?.endDate ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={categories_times_obj_arr.update[i]?.date ?? today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryEndDateChange('update', i, e)}
                                    />
                                    {#if categoryErrors.update[i]?.endDate}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].endDate}</span>
                                    {/if}
                                </div>
                                {/if}
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.end_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.endTime}
                                        data-testid="end-time-update-{i}"
                                        value={categories_times_obj_arr.update[i].endTime}
                                        onchange={(e) => {
                                            buildCategoryDateTime('endTime', 'update', i, (e.target as HTMLInputElement).value); autoComputeCompetitionDates();
                                            validateCategoryField('update', i, 'endTime', (e.target as HTMLInputElement).value);
                                        }}
                                    />
                                    {#if categoryErrors.update[i]?.endTime}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].endTime}</span>
                                    {/if}
                                </div>

                                <!-- Max Parties -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.max_parties')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.maxParties}
                                        data-testid="max-parties-update-{i}"
                                        bind:value={categories.update[i].data.maxParties}
                                        min="1"
                                        step="1"
                                        placeholder={$t('competition.create.max_parties_placeholder')}
                                        oninput={(e) => validateCategoryField('update', i, 'maxParties', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if categoryErrors.update[i]?.maxParties}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].maxParties}</span>
                                    {/if}
                                </div>
                                <!-- Participants per Party -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.participants_per_party')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.maxPartySize}
                                        data-testid="max-party-size-update-{i}"
                                        bind:value={categories.update[i].data.maxPartySize}
                                        min="1"
                                        oninput={(e) => validateCategoryField('update', i, 'maxPartySize', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if categoryErrors.update[i]?.maxPartySize}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].maxPartySize}</span>
                                    {/if}
                                </div>
                                <!-- Price -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.price')} *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.price}
                                        data-testid="price-update-{i}"
                                        bind:value={categories.update[i].data.price}
                                        min="0"
                                        step="1"
                                        placeholder={$t('competition.create.price_placeholder')}
                                        oninput={(e) => validateCategoryField('update', i, 'price', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if categoryErrors.update[i]?.price}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].price}</span>
                                    {/if}
                                </div>
                                <!-- Category Description -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_description')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.update[i]?.description}
                                        data-testid="description-update-{i}"
                                        bind:value={categories.update[i].data.description}
                                        placeholder={$t('competition.create.category_description_placeholder')}
                                        minlength="3"
                                        maxlength="60"
                                        oninput={(e) => validateCategoryField('update', i, 'description', (e.target as HTMLInputElement).value)}
                                    />
                                    {#if categoryErrors.update[i]?.description}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.update[i].description}</span>
                                    {/if}
                                </div>
                            </div>

                            {/if}
                            <!-- Puzzles Section -->
                            <PuzzleLinkSection
                                puzzleIds={categories.update[i].data.puzzleIds || []}
                                initialPuzzles={categories.update[i].data.puzzles || []}
                                onUpdate={(ids) => categories.update[i].data.puzzleIds = ids}
                            />
                            <div class="flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    class="btn preset-tonal rounded-lg"
                                    onclick={() => requestRemoveCategory('update', i)}
                                >
                                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                    {$t('competition.create.remove_category')}
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
                {#if categories?.create && (categories?.create as []).length > 0}
                    <div>
                        <p>{$t('competition.create.new_categories')}</p>
                    </div>
                    {#each categories.create as _, i}
                        <div class="p-2 rounded-lg bg-success-50-950" data-testid="category-create-{i}">
                            <!-- Category Header -->
                            <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Category Type -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_type')}</span>
                                    <select
                                        id="category-type-create-{i}"
                                        class="select bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.type}
                                        bind:value={categories.create[i].type}
                                        onchange={(e) => {
                                            autofillCategoryMaxPartySize(i, 'create', (e.target as HTMLInputElement).value);
                                            validateCategoryField('create', i, 'type', (e.target as HTMLInputElement).value);
                                        }}
                                    >
                                        <option value="">{$t('competition.create.select_category_type')}</option>
                                        {#each data.props?.categoryTypes ?? [] as categoryType}
                                            <option value={categoryType}>
                                                {getCategoryTypeName(categoryType as CategoryType)}
                                            </option>
                                        {/each}
                                    </select>
                                    {#if categoryErrors.create[i]?.type}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].type}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Category Details (only show when type is selected) -->
                            {#if categories.create[i].type}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Category Dates (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-start-date-create-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_date')}
                                        value={categories_times_obj_arr.create[i]?.date ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryDateChange('create', i, e)}
                                    />
                                    {#if categoryErrors.create[i]?.date}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].date}</span>
                                    {/if}
                                </div>
                                {/if}
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.start_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.startTime}
                                        data-testid="start-time-create-{i}"
                                        value={categories_times_obj_arr.create[i].startTime}
                                        onchange={(e) => {
                                            buildCategoryDateTime('startTime', 'create', i, (e.target as HTMLInputElement).value); autoComputeCompetitionDates();
                                            validateCategoryField('create', i, 'startTime', (e.target as HTMLInputElement).value);
                                        }}
                                    />
                                    {#if categoryErrors.create[i]?.startTime}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].startTime}</span>
                                    {/if}
                                </div>
                                <!-- Category End Date (multi-day only) -->
                                {#if isMultiDay}
                                <div class="label" data-testid="category-end-date-create-{i}">
                                    <CustomDatePicker
                                        labelText={$t('competition.create.category_end_date')}
                                        value={categories_times_obj_arr.create[i]?.endDate ?? undefined}
                                        locale={data.i18n.locale}
                                        minValue={categories_times_obj_arr.create[i]?.date ?? today(getLocalTimeZone())}
                                        weekStartsOn={1}
                                        pagedNavigation={true}
                                        disableDaysOutsideMonth={true}
                                        onValueChange={(e) => onCategoryEndDateChange('create', i, e)}
                                    />
                                    {#if categoryErrors.create[i]?.endDate}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].endDate}</span>
                                    {/if}
                                </div>
                                {/if}
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.end_time')}</span>
                                    <input
                                        type="time"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.endTime}
                                        data-testid="end-time-create-{i}"
                                        value={categories_times_obj_arr.create[i].endTime}
                                        onchange={(e) => {
                                            buildCategoryDateTime('endTime', 'create', i, (e.target as HTMLInputElement).value); autoComputeCompetitionDates();
                                            validateCategoryField('create', i, 'endTime', (e.target as HTMLInputElement).value);
                                        }}
                                        min={categories_times_obj_arr.create[i].startTime}
                                    />
                                    {#if categoryErrors.create[i]?.endTime}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].endTime}</span>
                                    {/if}
                                </div>

                                <!-- Max Parties -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.max_parties')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.maxParties}
                                        data-testid="max-parties-create-{i}"
                                        bind:value={categories.create[i].maxParties}
                                        min="1"
                                        step="1"
                                        placeholder={$t('competition.create.max_parties_placeholder')}
                                        oninput={(e) => validateCategoryField('create', i, 'maxParties', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if categoryErrors.create[i]?.maxParties}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].maxParties}</span>
                                    {/if}
                                </div>
                                <!-- Participants per Party -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.participants_per_party')}</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.maxPartySize}
                                        data-testid="max-party-size-create-{i}"
                                        bind:value={categories.create[i].maxPartySize}
                                        min="1"
                                        oninput={(e) => validateCategoryField('create', i, 'maxPartySize', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if categoryErrors.create[i]?.maxPartySize}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].maxPartySize}</span>
                                    {/if}
                                </div>
                                <!-- Price -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.price')} *</span>
                                    <input
                                        type="number"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.price}
                                        data-testid="price-create-{i}"
                                        bind:value={categories.create[i].price}
                                        min="0"
                                        step="1"
                                        placeholder={$t('competition.create.price_placeholder')}
                                        oninput={(e) => validateCategoryField('create', i, 'price', parseInt((e.target as HTMLInputElement).value))}
                                    />
                                    {#if categoryErrors.create[i]?.price}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].price}</span>
                                    {/if}
                                </div>
                                <!-- Category Description -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_description')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        class:input-error={categoryErrors.create[i]?.description}
                                        data-testid="description-create-{i}"
                                        bind:value={categories.create[i].description}
                                        placeholder={$t('competition.create.category_description_placeholder')}
                                        minlength="3"
                                        maxlength="60"
                                        oninput={(e) => validateCategoryField('create', i, 'description', (e.target as HTMLInputElement).value)}
                                    />
                                    {#if categoryErrors.create[i]?.description}
                                        <span class="invalid text-error-500 text-sm">{categoryErrors.create[i].description}</span>
                                    {/if}
                                </div>
                                <!-- Category Subname -->
                                <div class="label">
                                    <span class="text-sm font-medium">{$t('competition.create.category_subname')}</span>
                                    <input
                                        type="text"
                                        class="input bg-primary-50-950"
                                        bind:value={categories.create[i].subname}
                                        placeholder={$t('competition.create.category_subname_placeholder')}
                                        maxlength="60"
                                    />
                                </div>
                            </div>
                            {/if}
                            <!-- Puzzles Section -->
                            <PuzzleLinkSection
                                puzzleIds={categories.create[i].puzzleIds || []}
                                onUpdate={(ids) => categories.create[i].puzzleIds = ids}
                            />
                            <div class="flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    class="btn preset-tonal rounded-lg"
                                    onclick={() => requestRemoveCategory('create', i)}
                                >
                                    <Icon icon="mdi:delete" width="1.2rem" height="1.2rem" />
                                    {$t('competition.create.remove_category')}
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
                {#if categories.create && (categories.create as []).length === 0}
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
            <div class="alert preset-filled-error-500 rounded-lg mt-4 p-2 flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width="1.5rem" height="1.5rem" />
                <h4 class="font-semibold">{$t('competition.error')}</h4>
                <p>{$message.message}</p>
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
                disabled={$form.isValid === false || isSubmitting}
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
