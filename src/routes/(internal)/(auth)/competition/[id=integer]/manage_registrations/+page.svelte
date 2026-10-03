<script lang="ts">
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import AlertCircleIcon from '@iconify-svelte/mdi/alert-circle';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import SeatOutlineIcon from '@iconify-svelte/mdi/seat-outline';
    import InboxOutlineIcon from '@iconify-svelte/mdi/inbox-outline';
    import TableFurnitureIcon from '@iconify-svelte/mdi/table-furniture';
    import LoadingIcon from '@iconify-svelte/mdi/loading';
    import HistoryIcon from '@iconify-svelte/mdi/history';
    import { invalidate } from '$app/navigation';
    import { t, locale } from '$lib/translations';
    import DownloadIcon from '@iconify-svelte/mdi/download';
    import PrinterIcon from '@iconify-svelte/mdi/printer';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import OverflowMenu from '$lib/components/during-competition/OverflowMenu.svelte';
    import type { OverflowAction } from '$lib/components/during-competition/types';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import SearchInput from '$lib/components/common/SearchInput.svelte';
    import RegistrationList from '$lib/components/manage_registrations/RegistrationList.svelte';
    import CollapsibleSection from '$lib/components/manage_registrations/CollapsibleSection.svelte';
    import ConfirmPopover from '$lib/components/common/ConfirmPopover.svelte';
    import BellRingOutlineIcon from '@iconify-svelte/mdi/bell-ring-outline';
    import LockOpenVariantIcon from '@iconify-svelte/mdi/lock-open-variant';
    import LockIcon from '@iconify-svelte/mdi/lock';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import ClockRemoveOutlineIcon from '@iconify-svelte/mdi/clock-remove-outline';
    import { PAYMENT_REMINDER_COOLDOWN_MS } from '$lib/constants/registration';
    import BullhornOutlineIcon from '@iconify-svelte/mdi/bullhorn-outline';

    let { data } = $props();

    let competition = $derived(data.competition);
    let categoriesWithRegistrations = $derived(data.categoriesWithRegistrations || []);
    // Only NOT_STARTED categories in the main view; started/completed ones go in a collapsed section
    let activeCategories = $derived(
        categoriesWithRegistrations.filter((c: any) => c.status === 'NOT_STARTED')
    );
    let startedCategories = $derived(
        categoriesWithRegistrations.filter((c: any) => c.status !== 'NOT_STARTED')
    );
    // Registration state is per category; the competition is "open" when any active category is.
    let openCategoryCount = $derived(activeCategories.filter((c: any) => c.registrationOpen).length);
    let scheduledCategories = $derived(activeCategories.filter((c: any) => !c.registrationOpen && c.registrationOpensAt));
    let nextOpening = $derived(
        scheduledCategories.map((c: any) => new Date(c.registrationOpensAt)).sort((a: Date, b: Date) => a.getTime() - b.getTime())[0]
    );
    let searchFilter = $state('');

    // Inline "schedule opening" form: a category id, 'all' (every closed category), or null when hidden.
    let schedulingFor: number | 'all' | null = $state(null);
    let scheduleValue = $state('');

    function formatOpensAt(value: string | Date): string {
        return new Date(value).toLocaleString($locale, { dateStyle: 'medium', timeStyle: 'short' });
    }
    // `datetime-local` works in the organizer's local time as 'YYYY-MM-DDTHH:mm'.
    function toLocalInput(date: Date): string {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    function openScheduleForm(target: number | 'all', current?: string | Date | null) {
        schedulingFor = target;
        scheduleValue = current ? toLocalInput(new Date(current)) : '';
    }

    // Loading state for individual actions
    let processingEntryId: string | null = $state(null);
    let remindingCategoryId: number | null = $state(null);
    // Inline announcement form: 'all' (whole competition), a category id, or null when hidden.
    let announceTarget: 'all' | number | null = $state(null);
    let announceMessage = $state('');
    let announcing = $state(false);

    function openAnnounceForm(target: 'all' | number) {
        announceTarget = target;
        announceMessage = '';
    }
    let resultMessage = $state<{ success: boolean; message: string } | null>(null);
    let messageDismissTimer: ReturnType<typeof setTimeout> | null = null;
    let messageProgressKey = $state(0);

    function printableCount(category: any): number {
        return category.entries.filter((r: any) => r.status === 'CONFIRMED' && r.tableNumber != null).length;
    }
    function confirmedCount(category: any): number {
        return category.entries.filter((r: any) => r.status === 'CONFIRMED').length;
    }
    let anyPrintable = $derived(categoriesWithRegistrations.some((c: any) => printableCount(c) > 0));
    let tableEligibleCategories = $derived(activeCategories.filter((c: any) => confirmedCount(c) > 0));

    async function handlePrintEntryCards(category?: any) {
        const { downloadEntryCardsPdf } = await import('$lib/utils/pdf_entry_cards');
        await downloadEntryCardsPdf({
            competitionName: competition.name,
            categories: category ? [category] : categoriesWithRegistrations,
            origin: window.location.origin,
            translate: $t
        });
    }

    async function handleDownloadPdf() {
        const { downloadRegistrationsPdf } = await import('$lib/utils/pdf_registrations');
        downloadRegistrationsPdf({
            competitionName: competition.name,
            categories: categoriesWithRegistrations,
            translate: $t,
            locale: $locale
        });
    }

    async function handleCloseAllRegistrations() {
        try {
            const response = await fetch(`/api/competitions/${competition.id}/close_registration`, { method: 'POST' });
            if (response.ok) {
                await invalidate('data:manage-registrations');
            } else {
                const result = await response.json();
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.toggle_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.toggle_error') });
        }
    }

    async function handleSaveSchedule() {
        const url = schedulingFor === 'all'
            ? `/api/competitions/${competition.id}/schedule_registration`
            : `/api/categories/${schedulingFor}/schedule_registration`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opensAt: new Date(scheduleValue).toISOString() }),
            });
            if (response.ok) {
                schedulingFor = null;
                await invalidate('data:manage-registrations');
            } else {
                const result = await response.json();
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.schedule_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.schedule_error') });
        }
    }

    async function handleCancelSchedule(categoryId: number) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/schedule_registration`, { method: 'DELETE' });
            if (response.ok) {
                await invalidate('data:manage-registrations');
            } else {
                const result = await response.json();
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.schedule_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.schedule_error') });
        }
    }

    // ponytail: one request per category, sequential; a batch endpoint if competitions grow large.
    async function handlePublishAllTables() {
        let total = 0;
        let failed = false;
        for (const category of tableEligibleCategories) {
            try {
                const response = await fetch(`/api/categories/${category.id}/publish-tables`, { method: 'POST' });
                const result = await response.json();
                if (response.ok && result.success) total += result.assignedCount;
                else failed = true;
            } catch {
                failed = true;
            }
        }
        showResultMessage(failed
            ? { success: false, message: $t('manage_registrations.publish_tables_error') }
            : { success: true, message: $t('manage_registrations.publish_tables_success', { count: total }) });
        await invalidate('data:manage-registrations');
    }

    function buildGeneralActions(): OverflowAction[] {
        const hasCategories = categoriesWithRegistrations.length > 0;
        const actions: OverflowAction[] = [];
        // No "open all now": opening is a per-category decision, or a scheduled one.
        if (activeCategories.length > openCategoryCount) {
            actions.push({
                kind: 'button',
                icon: ClockOutlineIcon,
                label: $t('manage_registrations.schedule_all_registration'),
                hint: data.registrationScheduleAvailable ? undefined : $t('manage_registrations.schedule_unavailable'),
                disabled: !data.registrationScheduleAvailable,
                onClick: () => openScheduleForm('all'),
                testId: 'schedule-all-registration'
            });
        }
        if (openCategoryCount > 0 || scheduledCategories.length > 0) {
            actions.push({
                kind: 'confirm',
                icon: LockIcon,
                label: $t('manage_registrations.close_all_registration'),
                colorClass: 'preset-filled-error-500',
                confirmTitle: $t('manage_registrations.close_all_registration'),
                confirmMessage: $t('manage_registrations.close_all_confirm_message'),
                onConfirm: handleCloseAllRegistrations,
                testId: 'close-all-registration'
            });
        }
        if (tableEligibleCategories.length > 0) {
            actions.push({
                kind: 'confirm',
                icon: TableFurnitureIcon,
                label: $t('manage_registrations.publish_all_tables'),
                colorClass: 'preset-filled-primary-500',
                confirmTitle: $t('manage_registrations.publish_tables_confirm_title'),
                confirmMessage: $t('manage_registrations.publish_tables_confirm_message'),
                onConfirm: handlePublishAllTables,
                testId: 'publish-all-tables'
            });
        }
        if (hasCategories) {
            actions.push({ kind: 'button', icon: DownloadIcon, label: $t('manage_registrations.download_pdf'), onClick: handleDownloadPdf, testId: 'download-pdf' });
            actions.push({
                kind: 'button',
                icon: PrinterIcon,
                label: $t('manage_registrations.print_all_entry_cards'),
                hint: anyPrintable ? undefined : $t('manage_registrations.print_entry_cards_hint'),
                disabled: !anyPrintable,
                onClick: () => handlePrintEntryCards(),
                testId: 'print-all-entry-cards'
            });
            actions.push({
                kind: 'button',
                icon: BullhornOutlineIcon,
                label: $t('manage_registrations.announce_all'),
                onClick: () => openAnnounceForm('all'),
                testId: 'announce-all'
            });
        }
        return actions;
    }

    function buildCategoryActions(category: any): OverflowAction[] {
        const actions: OverflowAction[] = [{
            kind: 'button',
            icon: category.registrationOpen ? LockIcon : LockOpenVariantIcon,
            label: category.registrationOpen ? $t('manage_registrations.close_registration') : $t('manage_registrations.open_registration'),
            onClick: () => handleToggleCategoryRegistration(category.id),
            testId: `toggle-category-registration-${category.id}`
        }];
        if (!category.registrationOpen) {
            actions.push({
                kind: 'button',
                icon: ClockOutlineIcon,
                label: category.registrationOpensAt ? $t('manage_registrations.change_schedule') : $t('manage_registrations.schedule_registration'),
                hint: data.registrationScheduleAvailable ? undefined : $t('manage_registrations.schedule_unavailable'),
                disabled: !data.registrationScheduleAvailable,
                onClick: () => openScheduleForm(category.id, category.registrationOpensAt),
                testId: `schedule-category-registration-${category.id}`
            });
            if (category.registrationOpensAt) {
                actions.push({
                    kind: 'button',
                    icon: ClockRemoveOutlineIcon,
                    label: $t('manage_registrations.cancel_schedule'),
                    onClick: () => handleCancelSchedule(category.id),
                    testId: `cancel-schedule-${category.id}`
                });
            }
        }
        if (confirmedCount(category) > 0) {
            actions.push({
                kind: 'confirm',
                icon: TableFurnitureIcon,
                label: $t('manage_registrations.publish_tables'),
                colorClass: 'preset-filled-primary-500',
                confirmTitle: $t('manage_registrations.publish_tables_confirm_title'),
                confirmMessage: $t('manage_registrations.publish_tables_confirm_message'),
                onConfirm: () => handlePublishTables(category.id),
                testId: `publish-tables-${category.id}`
            });
            actions.push({
                kind: 'button',
                icon: PrinterIcon,
                label: $t('manage_registrations.print_entry_cards'),
                hint: printableCount(category) > 0 ? undefined : $t('manage_registrations.print_entry_cards_hint'),
                disabled: printableCount(category) === 0,
                onClick: () => handlePrintEntryCards(category),
                testId: `print-entry-cards-${category.id}`
            });
        }
        if (category.entries.length > 0) {
            actions.push({
                kind: 'button',
                icon: BullhornOutlineIcon,
                label: $t('manage_registrations.announce_category'),
                onClick: () => openAnnounceForm(category.id),
                testId: `announce-category-${category.id}`
            });
        }
        return actions;
    }

    function showResultMessage(msg: { success: boolean; message: string }) {
        if (messageDismissTimer) clearTimeout(messageDismissTimer);
        resultMessage = msg;
        messageProgressKey++;
        messageDismissTimer = setTimeout(() => {
            resultMessage = null;
            messageDismissTimer = null;
        }, 5000);
    }

    async function handleConfirm(entryId: string) {
        processingEntryId = entryId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
        try {
            const response = await fetch(`/api/registrations/${entryId}/confirm`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.confirmed_success') });
                await invalidate('data:manage-registrations');
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.confirm_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.confirm_error') });
        } finally {
            processingEntryId = null;
        }
    }

    async function handleRefuse(entryId: string) {
        processingEntryId = entryId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

        try {
            const response = await fetch(`/api/registrations/${entryId}/refuse`, {
                method: 'POST'
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.refused_success') });
                await invalidate('data:manage-registrations');
            } else if (response.status === 404) {
                // Entry was already removed (e.g. stale/duplicate refusal)
                showResultMessage({ success: true, message: $t('manage_registrations.already_removed') });
                await invalidate('data:manage-registrations');
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.refuse_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.refuse_error') });
        } finally {
            processingEntryId = null;
        }
    }

    async function handleToggleCategoryRegistration(categoryId: number) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/toggle_registration`, {
                method: 'POST'
            });

            if (response.ok) {
                await invalidate('data:manage-registrations');
            } else {
                const result = await response.json();
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.toggle_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.toggle_error') });
        }
    }

    async function handlePublishTables(categoryId: number) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/publish-tables`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.publish_tables_success', { count: result.assignedCount }) });
                await invalidate('data:manage-registrations');
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.publish_tables_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.publish_tables_error') });
        }
    }

    async function handleRemind(entryId: string, note?: string) {
        processingEntryId = entryId;
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
        try {
            const response = await fetch(`/api/registrations/${entryId}/remind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note }),
            });
            const result = await response.json();
            await minLoadingTime;

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.remind_success', { count: result.remindedCount }) });
                await invalidate('data:manage-registrations');
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.remind_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.remind_error') });
        } finally {
            processingEntryId = null;
        }
    }

    async function handleBulkRemind(categoryId: number, note?: string) {
        remindingCategoryId = categoryId;
        try {
            const response = await fetch(`/api/categories/${categoryId}/remind-pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showResultMessage({ success: true, message: $t('manage_registrations.remind_bulk_success', { reminded: result.remindedCount, skipped: result.skippedCount }) });
                await invalidate('data:manage-registrations');
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.remind_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.remind_error') });
        } finally {
            remindingCategoryId = null;
        }
    }

    async function handleAnnounce() {
        const target = announceTarget;
        const message = announceMessage.trim();
        if (target === null || !message) return;
        announcing = true;
        try {
            const response = await fetch(`/api/competitions/${competition.id}/announce`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, categoryId: target === 'all' ? undefined : target }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                announceTarget = null;
                showResultMessage({ success: true, message: $t('manage_registrations.announce_success', { count: result.recipientCount }) });
            } else {
                showResultMessage({ success: false, message: result.error || $t('manage_registrations.announce_error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_registrations.announce_error') });
        } finally {
            announcing = false;
        }
    }
</script>

<!-- Inline announcement form (e.g. reschedule/cancel notice to entry creators) -->
{#snippet announceForm(target: 'all' | number)}
    <form
        class="space-y-2 mt-3"
        onsubmit={(e) => { e.preventDefault(); handleAnnounce(); }}
        data-testid="announce-form"
    >
        <p class="text-sm font-semibold">{$t('manage_registrations.announce_confirm_title')}</p>
        <p class="text-xs text-surface-600 dark:text-surface-400">
            {$t(target === 'all' ? 'manage_registrations.announce_all_confirm_message' : 'manage_registrations.announce_category_confirm_message')}
        </p>
        <textarea
            class="textarea w-full text-sm"
            rows="5"
            maxlength="1000"
            required
            placeholder={$t('manage_registrations.announce_placeholder')}
            bind:value={announceMessage}
            disabled={announcing}
            data-testid="announce-input"
        ></textarea>
        <div class="flex justify-end gap-2">
            <button type="button" class="btn btn-sm preset-tonal-surface" disabled={announcing} onclick={() => announceTarget = null}>
                {$t('manage_registrations.cancel_button')}
            </button>
            <button type="submit" class="btn btn-sm preset-filled-primary-500 gap-1" disabled={announcing || !announceMessage.trim()} data-testid="announce-send">
                {#if announcing}
                    <LoadingIcon width="1rem" height="1rem" class="animate-spin" />
                {:else}
                    <BullhornOutlineIcon width="1rem" height="1rem" />
                {/if}
                {$t('manage_registrations.confirm_button')}
            </button>
        </div>
    </form>
{/snippet}

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <div class="space-y-4">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('manage_registrations.title')} subtitle={competition.name}/>
    </div>

    <!-- Competition registration status + general Manage menu -->
    <Card>
        <div class="flex items-center justify-between gap-4">
            <p class="flex items-center gap-2 text-sm">
                {#if openCategoryCount > 0}
                    <LockOpenVariantIcon width="1.2rem" height="1.2rem" class="text-success-500 shrink-0" />
                    <span class="font-semibold text-success-500" data-testid="registration-status" data-open="true">
                        {$t('manage_registrations.registration_open_count', { open: openCategoryCount, total: activeCategories.length })}
                    </span>
                {:else if nextOpening}
                    <ClockOutlineIcon width="1.2rem" height="1.2rem" class="text-warning-600 dark:text-warning-400 shrink-0" />
                    <span class="font-semibold text-warning-600 dark:text-warning-400" data-testid="registration-status" data-open="false" data-scheduled="true">
                        {$t('manage_registrations.registration_opens_at', { date: formatOpensAt(nextOpening) })}
                    </span>
                {:else}
                    <LockIcon width="1.2rem" height="1.2rem" class="text-error-500 shrink-0" />
                    <span>
                        {$t('manage_registrations.registration_label')}
                        <span class="font-semibold text-error-500" data-testid="registration-status" data-open="false">{$t('manage_registrations.status_closed')}</span>
                    </span>
                {/if}
            </p>
            <OverflowMenu actions={buildGeneralActions()} label={$t('competition_details.manage')} testId="manage-registrations-menu" />
        </div>
        {#if schedulingFor === 'all'}
            {@render scheduleForm($t('manage_registrations.schedule_all_label'))}
        {/if}
        {#if announceTarget === 'all'}
            {@render announceForm('all')}
        {/if}
    </Card>

    <!-- Inline scheduled-opening form (organizer's local time) -->
    {#snippet scheduleForm(label: string)}
        <form
            class="flex flex-wrap items-end gap-2 mt-3"
            onsubmit={(e) => { e.preventDefault(); handleSaveSchedule(); }}
            data-testid="schedule-form"
        >
            <label class="label flex-1 min-w-48">
                <span class="text-sm">{label}</span>
                <input class="input" type="datetime-local" required min={toLocalInput(new Date())} bind:value={scheduleValue} data-testid="schedule-input" />
            </label>
            <button type="submit" class="btn btn-sm preset-filled-primary-500" disabled={!scheduleValue} data-testid="schedule-save">
                {$t('manage_registrations.schedule_save')}
            </button>
            <button type="button" class="btn btn-sm preset-tonal-surface" onclick={() => schedulingFor = null}>
                {$t('manage_registrations.cancel_button')}
            </button>
        </form>
    {/snippet}

    <!-- User Search -->
    <SearchInput bind:filter={searchFilter} placeholder={$t('manage_registrations.search_placeholder')} />

    <!-- Result message -->
    {#if resultMessage}
        <div class="rounded-lg overflow-hidden {resultMessage.success ? 'preset-filled-success-500' : 'preset-filled-error-500'}"
            data-testid={resultMessage.success ? 'action-result-success' : 'action-result-error'}>
            <div class="p-4 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    {#if resultMessage.success}
                        <CheckCircleIcon width="1.2rem" height="1.2rem" />
                    {:else}
                        <AlertCircleIcon width="1.2rem" height="1.2rem" />
                    {/if}
                    <span>{resultMessage.message}</span>
                </div>
                <button type="button" class="opacity-70 hover:opacity-100" onclick={() => { resultMessage = null; if (messageDismissTimer) { clearTimeout(messageDismissTimer); messageDismissTimer = null; } }}>
                    <CloseIcon width="1rem" height="1rem" />
                </button>
            </div>
            {#key messageProgressKey}
                <div class="h-1 w-full {resultMessage.success ? 'bg-success-900/30' : 'bg-error-900/30'}">
                    <div class="h-full {resultMessage.success ? 'bg-success-200' : 'bg-error-200'} animate-shrink"></div>
                </div>
            {/key}
        </div>
    {/if}

    <!-- Categories with registrations -->
    {#snippet categoryCard(category: any, showActions: boolean)}
        <Card>
            <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
                <CategoryCardTitle type={category.type} subname={category.subname ?? ''}/>
                <div class="flex items-center gap-3 flex-wrap">
                    {#if category.maxParties}
                        {@const reservedCount = category.entries.filter((r: any) => r.status === 'CONFIRMED' || r.status === 'PENDING_CONFIRMATION').length}
                        {@const remaining = category.maxParties - reservedCount}
                        <span class="text-sm {remaining > 0 ? 'text-surface-600 dark:text-surface-400' : 'text-error-600 dark:text-error-400'}">
                            <SeatOutlineIcon width="1rem" height="1rem" class="inline-block align-text-bottom mr-1" />
                            {$t('manage_registrations.seats_available', { accepted: reservedCount, max: category.maxParties })}
                        </span>
                    {/if}
                    {#if showActions}
                        {@const scheduled = !category.registrationOpen && category.registrationOpensAt}
                        <span
                            class="badge gap-1 {category.registrationOpen ? 'preset-tonal-success' : scheduled ? 'preset-tonal-warning' : 'preset-tonal-error'}"
                            data-testid="category-registration-status-{category.id}"
                            data-open={category.registrationOpen}
                            data-scheduled={!!scheduled}
                        >
                            {#if category.registrationOpen}
                                <LockOpenVariantIcon width="1rem" height="1rem" />
                                {$t('manage_registrations.category_registration_open')}
                            {:else if scheduled}
                                <ClockOutlineIcon width="1rem" height="1rem" />
                                {$t('manage_registrations.opens_at', { date: formatOpensAt(category.registrationOpensAt) })}
                            {:else}
                                <LockIcon width="1rem" height="1rem" />
                                {$t('manage_registrations.category_registration_closed')}
                            {/if}
                        </span>
                        {#if category._count?.follows > 0}
                            <span
                                class="badge gap-1 preset-tonal-primary"
                                title={$t('manage_registrations.followers_waiting_hint', { count: category._count.follows })}
                                data-testid="category-followers-{category.id}"
                                data-count={category._count.follows}
                            >
                                <BellRingOutlineIcon width="1rem" height="1rem" />
                                {$t('manage_registrations.followers_waiting', { count: category._count.follows })}
                            </span>
                        {/if}
                        <OverflowMenu actions={buildCategoryActions(category)} label={$t('competition_details.manage')} testId="category-menu-{category.id}" />
                    {/if}
                </div>
            </div>
            {#if schedulingFor === category.id}
                <div class="mb-4">{@render scheduleForm($t('manage_registrations.schedule_label'))}</div>
            {/if}
            {#if announceTarget === category.id}
                <div class="mb-4">{@render announceForm(category.id)}</div>
            {/if}

            <RegistrationList
                entries={category.entries}
                availableTags={(category.tagCategories ?? []).map((tc: any) => tc.tag)}
                processingEntryId={processingEntryId}
                {searchFilter}
                onConfirm={handleConfirm}
                onRefuse={handleRefuse}
                onRemind={handleRemind}
            />

            <!-- Action buttons only for active (NOT_STARTED) categories -->
            {#if showActions}
            <!-- Bulk remind pending button -->
            {@const pendingEntries = category.entries.filter((r: any) => r.status === 'PENDING_CONFIRMATION')}
            {@const eligiblePendingCount = pendingEntries.filter((r: any) => {
                if (!r.lastRemindedAt) return true;
                return Date.now() - new Date(r.lastRemindedAt).getTime() >= PAYMENT_REMINDER_COOLDOWN_MS;
            }).length}
            {#if pendingEntries.length > 0}
                <div class="border-t border-surface-200 dark:border-surface-700">
                    <div class="relative w-full">
                        <button
                            type="button"
                            class="btn preset-filled-warning-500 gap-2 w-full"
                            disabled={remindingCategoryId === category.id || eligiblePendingCount === 0}
                            onclick={() => remindingCategoryId = remindingCategoryId === category.id ? null : category.id}
                            data-testid="bulk-remind-pending"
                        >
                            {#if remindingCategoryId === category.id}
                                <LoadingIcon width="1.1rem" height="1.1rem" class="animate-spin" />
                            {:else}
                                <BellRingOutlineIcon width="1.1rem" height="1.1rem" />
                            {/if}
                            {$t('manage_registrations.remind_all_pending', { count: eligiblePendingCount })}
                        </button>
                        {#if remindingCategoryId === category.id && eligiblePendingCount > 0}
                            <ConfirmPopover
                                title={$t('manage_registrations.remind_confirm_title')}
                                message={$t('manage_registrations.remind_bulk_confirm_message')}
                                colorClass="preset-filled-warning-500"
                                onConfirm={async (note) => {
                                    const catId = category.id;
                                    remindingCategoryId = null;
                                    await handleBulkRemind(catId, note);
                                }}
                                onCancel={() => remindingCategoryId = null}
                                isProcessing={false}
                                inputConfig={{ placeholder: $t('manage_registrations.remind_note_placeholder'), maxLength: 200 }}
                            />
                        {/if}
                    </div>
                </div>
            {/if}
            {/if}
        </Card>
    {/snippet}

    <div class="space-y-6">
        {#each activeCategories as category (category.id)}
            {@render categoryCard(category, true)}
        {/each}
    </div>

    <!-- Started / completed categories (collapsed by default) -->
    {#if startedCategories.length > 0}
        <CollapsibleSection
            icon={HistoryIcon}
            label={$t('manage_registrations.started_categories')}
            count={startedCategories.length}
            badgeClass="preset-tonal-secondary"
            testId="toggle-section-started-categories"
        >
            <div class="space-y-6">
                {#each startedCategories as category (category.id)}
                    {@render categoryCard(category, false)}
                {/each}
            </div>
        </CollapsibleSection>
    {/if}

    {#if categoriesWithRegistrations.length === 0}
        <div class="card p-8 text-center">
            <InboxOutlineIcon class="text-6xl text-surface-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">{$t('manage_registrations.no_categories')}</h3>
        </div>
    {/if}
</div>

<style>
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
    .animate-shrink {
        animation: shrink 5s linear forwards;
    }
</style>
