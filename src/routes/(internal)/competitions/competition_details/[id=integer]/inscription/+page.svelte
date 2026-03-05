<script lang="ts">
    import type { User, Category, CategoryType } from '@prisma/client';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import { getCategoryTypeName, getCategoryTypeIcon, getMaxRecordsPerCategory } from '$lib/utils/category_utils';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { slide } from 'svelte/transition';
    import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';

    let { data } = $props();

    let currentUser = $derived(data.user);
    let competition = $derived(data.competition);
    let categories = $derived(competition?.categories || []);
    let existingRecords = $derived(data.existingRecords || []);
    let inscribedUserIds = $derived(data.inscribedUserIds as Record<number, string[]> || {});

    let canRegister = $derived(competition?.registrationOpen && competition?.status === 'NOT_STARTED');

    // ---------------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------------

    interface PendingSignup {
        slotId: number;
        users: User[];
        intentNames: string[];
        existingIntents: { id: string; name: string }[];
    }

    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------

    let slotCounter = $state(0);
    let pendingSignups: Map<number, PendingSignup[]> = $state(new Map());

    // Search state keyed by slotId
    let searchQueries: Map<number, string> = $state(new Map());
    let searchResults: Map<number, User[]> = $state(new Map());
    let intentSearchResults: Map<number, { id: string; name: string }[]> = $state(new Map());

    // Submission state
    let isSubmitting = $state(false);
    let resultMessage = $state<{ success: boolean; message: string } | null>(null);
    let messageDismissTimer: ReturnType<typeof setTimeout> | null = null;
    let messageProgressKey = $state(0);

    function showResultMessage(msg: { success: boolean; message: string }) {
        if (messageDismissTimer) clearTimeout(messageDismissTimer);
        resultMessage = msg;
        messageProgressKey++;
        messageDismissTimer = setTimeout(() => {
            resultMessage = null;
            messageDismissTimer = null;
        }, 5000);
    }

    // Debounce timers
    let searchTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

    // Get ALL existing records for a category (user is participant OR creator)
    function getExistingRecords(categoryId: number) {
        return existingRecords.filter((r: any) =>
            r.categoryId === categoryId &&
            (r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'WAITLISTED')
        );
    }

    // Check if user can create more records for this category (accounts for queued slots)
    function canCreateMore(category: Category): boolean {
        const records = getExistingRecords(category.id);
        const createdByUser = records.filter((r: any) => r.creatorId === currentUser?.id).length;
        const queuedCount = getSlots(category.id).length;
        const maxRecords = getMaxRecordsPerCategory(category.type);
        return (createdByUser + queuedCount) < maxRecords;
    }

    // Get status badge classes
    function getStatusBadgeClasses(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'preset-filled-success-500';
            case 'PENDING': return 'preset-filled-warning-500';
            case 'WAITLISTED': return 'preset-filled-secondary-500';
            default: return 'preset-tonal';
        }
    }

    function getStatusIcon(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'mdi:check-circle';
            case 'PENDING': return 'mdi:clock-outline';
            case 'WAITLISTED': return 'mdi:clock-alert-outline';
            default: return 'mdi:help-circle';
        }
    }

    function getStatusBorderClass(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'border-success-300 dark:border-success-700 bg-success-50/50 dark:bg-success-900/10';
            case 'PENDING': return 'border-warning-300 dark:border-warning-700 bg-warning-50/50 dark:bg-warning-900/10';
            case 'WAITLISTED': return 'border-secondary-300 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-900/10';
            default: return 'border-surface-300 dark:border-surface-700';
        }
    }

    // ---------------------------------------------------------------------------
    // Multi-signup slot helpers
    // ---------------------------------------------------------------------------

    function nextSlotId(): number {
        return ++slotCounter;
    }

    function getSlots(categoryId: number): PendingSignup[] {
        return pendingSignups.get(categoryId) || [];
    }

    function isSlotComplete(slot: PendingSignup, category: Category): boolean {
        const maxSize = category.maxPartySize || 1;
        return slot.users.length + slot.intentNames.length + slot.existingIntents.length === maxSize;
    }

    function getSlotPartySize(slot: PendingSignup): number {
        return slot.users.length + slot.intentNames.length + slot.existingIntents.length;
    }

    // Check if current user is already inscribed or queued in a category
    function isUserInCategory(categoryId: number): boolean {
        const records = getExistingRecords(categoryId);
        if (records.some((r: any) => r.users?.some((u: any) => u.id === currentUser?.id))) return true;
        const slots = getSlots(categoryId);
        if (slots.some(s => s.users.some(u => u.id === currentUser?.id))) return true;
        return false;
    }

    // Check if any user is already inscribed (DB records or pending slots) in a category
    function isUserAlreadyInCategory(userId: string, categoryId: number, excludeSlotId?: number): boolean {
        // Check existing DB records via server-loaded inscribed user IDs
        const categoryInscribed = inscribedUserIds[categoryId] || [];
        if (categoryInscribed.includes(userId)) return true;
        // Check pending slots in the same category
        const slots = getSlots(categoryId);
        return slots.some(s => s.slotId !== excludeSlotId && s.users.some(u => u.id === userId));
    }

    // Add an individual signup (one-click, immediately complete)
    function addIndividualSignup(categoryId: number) {
        const id = nextSlotId();
        const slot: PendingSignup = {
            slotId: id,
            users: [currentUser as User],
            intentNames: [],
            existingIntents: []
        };
        const current = getSlots(categoryId);
        const next = new Map(pendingSignups);
        next.set(categoryId, [...current, slot]);
        pendingSignups = next;
    }

    // Add an individual slot for another user (opens search)
    function addIndividualSlotForOther(categoryId: number) {
        const id = nextSlotId();
        const slot: PendingSignup = {
            slotId: id,
            users: [],
            intentNames: [],
            existingIntents: []
        };
        const current = getSlots(categoryId);
        const next = new Map(pendingSignups);
        next.set(categoryId, [...current, slot]);
        pendingSignups = next;
    }

    // Start a group signup slot (adds current user unless already in category)
    function addGroupSlot(categoryId: number) {
        const id = nextSlotId();
        const alreadyIn = isUserInCategory(categoryId);
        const slot: PendingSignup = {
            slotId: id,
            users: alreadyIn ? [] : [currentUser as User],
            intentNames: [],
            existingIntents: []
        };
        const current = getSlots(categoryId);
        const next = new Map(pendingSignups);
        next.set(categoryId, [...current, slot]);
        pendingSignups = next;
    }

    // Remove a specific slot
    function removeSlot(categoryId: number, slotId: number) {
        const current = getSlots(categoryId);
        const next = new Map(pendingSignups);
        const filtered = current.filter(s => s.slotId !== slotId);
        if (filtered.length > 0) {
            next.set(categoryId, filtered);
        } else {
            next.delete(categoryId);
        }
        pendingSignups = next;
        clearSlotSearchState(slotId);
    }

    function clearSlotSearchState(slotId: number) {
        const nextQ = new Map(searchQueries);
        nextQ.delete(slotId);
        searchQueries = nextQ;
        const nextR = new Map(searchResults);
        nextR.delete(slotId);
        searchResults = nextR;
        const nextI = new Map(intentSearchResults);
        nextI.delete(slotId);
        intentSearchResults = nextI;
        if (searchTimers.has(slotId)) {
            clearTimeout(searchTimers.get(slotId));
            searchTimers.delete(slotId);
        }
    }

    // Update a slot's data in the map
    function updateSlot(categoryId: number, slotId: number, updater: (slot: PendingSignup) => PendingSignup) {
        const current = getSlots(categoryId);
        const next = new Map(pendingSignups);
        next.set(categoryId, current.map(s => s.slotId === slotId ? updater(s) : s));
        pendingSignups = next;
    }

    function addTeammate(categoryId: number, slotId: number, user: User) {
        if (isUserAlreadyInCategory(user.id, categoryId, slotId)) return;
        updateSlot(categoryId, slotId, s => ({ ...s, users: [...s.users, user] }));
        clearSlotSearchState(slotId);
    }

    function removeTeammate(categoryId: number, slotId: number, userId: string) {
        updateSlot(categoryId, slotId, s => ({ ...s, users: s.users.filter(u => u.id !== userId) }));
    }

    function addUserIntent(categoryId: number, slotId: number, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        updateSlot(categoryId, slotId, s => ({ ...s, intentNames: [...s.intentNames, trimmed] }));
        clearSlotSearchState(slotId);
    }

    function removeUserIntent(categoryId: number, slotId: number, index: number) {
        updateSlot(categoryId, slotId, s => ({ ...s, intentNames: s.intentNames.filter((_, i) => i !== index) }));
    }

    function addExistingIntent(categoryId: number, slotId: number, intent: { id: string; name: string }) {
        updateSlot(categoryId, slotId, s => ({ ...s, existingIntents: [...s.existingIntents, intent] }));
        clearSlotSearchState(slotId);
    }

    function removeExistingIntent(categoryId: number, slotId: number, intentId: string) {
        updateSlot(categoryId, slotId, s => ({ ...s, existingIntents: s.existingIntents.filter(i => i.id !== intentId) }));
    }

    // ---------------------------------------------------------------------------
    // Search (keyed by slotId)
    // ---------------------------------------------------------------------------

    async function searchUsers(slotId: number, categoryId: number, query: string) {
        if (query.length < 2) {
            const nextResults = new Map(searchResults);
            nextResults.delete(slotId);
            searchResults = nextResults;
            const nextIntentResults = new Map(intentSearchResults);
            nextIntentResults.delete(slotId);
            intentSearchResults = nextIntentResults;
            return;
        }

        try {
            const [usersResponse, intentsResponse] = await Promise.all([
                fetch(`/api/users/search?q=${encodeURIComponent(query)}`),
                fetch(`/api/user-intents?q=${encodeURIComponent(query)}`)
            ]);

            if (usersResponse.ok) {
                const result = await usersResponse.json();
                const slot = getSlots(categoryId).find(s => s.slotId === slotId);
                const currentTeam = slot?.users || [];
                const filtered = result.users?.filter((user: User) =>
                    user.id !== currentUser?.id &&
                    !currentTeam.find(t => t.id === user.id)
                ).slice(0, 5) || [];
                const nextResults = new Map(searchResults);
                nextResults.set(slotId, filtered);
                searchResults = nextResults;
            }

            if (intentsResponse.ok) {
                const result = await intentsResponse.json();
                const slot = getSlots(categoryId).find(s => s.slotId === slotId);
                const alreadySelected = slot?.existingIntents || [];
                const filtered = (result.userIntents || []).filter(
                    (ui: { id: string; name: string }) => !alreadySelected.find(s => s.id === ui.id)
                );
                const nextIntentResults = new Map(intentSearchResults);
                nextIntentResults.set(slotId, filtered);
                intentSearchResults = nextIntentResults;
            }
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    function handleSearchInput(slotId: number, categoryId: number, value: string) {
        const nextQueries = new Map(searchQueries);
        nextQueries.set(slotId, value);
        searchQueries = nextQueries;

        if (searchTimers.has(slotId)) {
            clearTimeout(searchTimers.get(slotId));
        }
        searchTimers.set(slotId, setTimeout(() => {
            searchUsers(slotId, categoryId, value);
        }, 300));
    }

    // ---------------------------------------------------------------------------
    // Derived computations
    // ---------------------------------------------------------------------------

    let totalNewSignups = $derived(() => {
        let count = 0;
        for (const [, slots] of pendingSignups) {
            count += slots.length;
        }
        return count;
    });

    let hasNewSignups = $derived(totalNewSignups() > 0);

    let allPartiesComplete = $derived(() => {
        for (const [categoryId, slots] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) return false;
            for (const slot of slots) {
                if (!isSlotComplete(slot, category)) return false;
            }
        }
        return true;
    });

    let canSubmit = $derived(hasNewSignups && allPartiesComplete());

    // Build summary for submit bar
    let signupSummary = $derived(() => {
        const summary: { type: string; count: number }[] = [];
        for (const [categoryId, slots] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) continue;
            const typeName = getCategoryTypeName(category.type);
            const existing = summary.find(s => s.type === typeName);
            if (existing) {
                existing.count += slots.length;
            } else {
                summary.push({ type: typeName, count: slots.length });
            }
        }
        return summary;
    });

    // ---------------------------------------------------------------------------
    // Payload
    // ---------------------------------------------------------------------------

    function buildSignupPayload() {
        const payload: { categoryId: number; teammateIds: string[]; userIntentNames?: string[]; userIntentIds?: string[]; registeredBySelf?: boolean }[] = [];
        for (const [categoryId, slots] of pendingSignups) {
            for (const slot of slots) {
                const currentUserInParty = slot.users.some(u => u.id === currentUser?.id);
                const teammateIds = slot.users
                    .filter(u => u.id !== currentUser?.id)
                    .map(u => u.id);
                payload.push({
                    categoryId,
                    teammateIds,
                    ...(slot.intentNames.length > 0 ? { userIntentNames: slot.intentNames } : {}),
                    ...(slot.existingIntents.length > 0 ? { userIntentIds: slot.existingIntents.map(i => i.id) } : {}),
                    ...(!currentUserInParty ? { registeredBySelf: false } : {})
                });
            }
        }
        return payload;
    }

    // Is individual category (maxPartySize === 1)?
    function isIndividual(category: Category): boolean {
        return (category.maxPartySize || 1) === 1;
    }

    // Check if current user is a participant (not just creator) of a record
    function isUserInRecord(record: any): boolean {
        return record.users?.some((u: any) => u.id === currentUser?.id);
    }

    function clearAllSignupState() {
        pendingSignups = new Map();
        searchQueries = new Map();
        searchResults = new Map();
        intentSearchResults = new Map();
        searchTimers.forEach(timer => clearTimeout(timer));
        searchTimers = new Map();
    }
</script>

<div class="container mx-auto max-w-4xl relative">
    <LoadingOverlay show={isSubmitting} message={$t('inscription.submitting') || 'Submitting registrations...'} />

    <!-- Header -->
    <div class="space-y-4 mb-6">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('inscription.title')}/>
        <CompetitionTitle title={competition.name} />

        {#if !canRegister}
            <div class="alert preset-filled-warning-500 p-4 rounded-lg" data-testid="registration-closed-warning">
                <Icon icon="mdi:alert" width="1.5rem" height="1.5rem" />
                <span>
                    {#if !competition?.registrationOpen}
                        {$t('inscription.registration_closed')}
                    {:else}
                        {$t('inscription.competition_not_open')}
                    {/if}
                </span>
            </div>
        {/if}
    </div>

    <!-- Result message -->
    {#if resultMessage}
        <div class="mb-4 rounded-lg overflow-hidden {resultMessage.success ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
            <div class="p-4 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <Icon icon={resultMessage.success ? 'mdi:check-circle' : 'mdi:alert-circle'} width="1.2rem" height="1.2rem" />
                    <span>{resultMessage.message}</span>
                </div>
                <button type="button" class="opacity-70 hover:opacity-100" onclick={() => { resultMessage = null; if (messageDismissTimer) { clearTimeout(messageDismissTimer); messageDismissTimer = null; } }}>
                    <Icon icon="mdi:close" width="1rem" height="1rem" />
                </button>
            </div>
            {#key messageProgressKey}
                <div class="h-1 w-full {resultMessage.success ? 'bg-success-900/30' : 'bg-error-900/30'}">
                    <div class="h-full {resultMessage.success ? 'bg-success-200' : 'bg-error-200'} animate-shrink"></div>
                </div>
            {/key}
        </div>
    {/if}

    <!-- Categories -->
    <div class="space-y-4 pb-20">
        {#each categories as category (category.id)}
            {@const records = getExistingRecords(category.id)}
            {@const createdByUserCount = records.filter((r) => r.creatorId === currentUser?.id).length}
            {@const maxRecords = getMaxRecordsPerCategory(category.type)}
            {@const slots = getSlots(category.id)}
            {@const totalRegistrations = createdByUserCount + slots.length}
            {@const limitReached = totalRegistrations >= maxRecords}
            {@const maxSize = category.maxPartySize || 1}
            {@const individual = isIndividual(category)}

            <Card>
                <!-- Category header -->
                <div class="flex justify-between items-start">
                    <CategoryCardTitle type={category.type} subname={category.description} />
                    <div class="flex items-center gap-3">
                        <span class="badge preset-tonal text-xs flex items-center gap-1 p-2">
                            <Icon icon="mdi:account-multiple" width="1rem" height="1rem" />
                            {maxSize} {maxSize === 1 ? $t('inscription.participant') : $t('inscription.participants')}
                        </span>
                    </div>
                </div>

                <!-- Time & puzzles info -->
                <div class="flex flex-wrap items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
                    <div class="flex items-center gap-1">
                        <Icon icon="mdi:clock-start" width="1rem" height="1rem" />
                        <span>{formatTime(new Date(category.startTime))}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <Icon icon="mdi:clock-end" width="1rem" height="1rem" />
                        <span>{formatTime(new Date(category.endTime))}</span>
                    </div>
                    {#if category.puzzles && category.puzzles.length > 0}
                        {#each category.puzzles as puzzle}
                            <span class="badge preset-tonal-primary text-xs flex items-center gap-1 p-2">
                                <Icon icon="mdi:puzzle-outline" width="0.8rem" height="0.8rem" />
                                {puzzle.pieces} pcs - {puzzle.brand}
                            </span>
                        {/each}
                    {/if}
                </div>

                <!-- Registration count badge -->
                {#if records.length > 0 || slots.length > 0}
                    <div class="flex items-center gap-2">
                        <!-- TODO: maxRecords is misleading for the user, if there is a category with less available spots than the maxRecords -->
                        <span class="badge {limitReached ? 'preset-filled-surface-200-800' : 'preset-tonal-primary'} text-xs p-2">
                            <Icon icon="mdi:clipboard-list" width="0.9rem" height="0.9rem" />
                            {totalRegistrations}/{maxRecords} {$t('inscription.your_registrations')}
                        </span>
                    </div>
                {/if}

                <!-- Existing records list -->
                {#if records.length > 0}
                    <div class="space-y-2">
                        {#each records as record (record.id)}
                            <div class="flex items-center justify-between gap-2 p-3 border rounded-lg {getStatusBorderClass(record.status)}" data-testid="inscription-record-{record.id}">
                                <div class="flex items-center gap-3 flex-wrap min-w-0">
                                    <!-- Status -->
                                    <div class="flex items-center gap-1.5 shrink-0">
                                        <Icon icon={getStatusIcon(record.status)} width="1.1rem" height="1.1rem" class={record.status === 'ACCEPTED' ? 'text-success-600' : record.status === 'WAITLISTED' ? 'text-secondary-600' : 'text-warning-600'} />
                                        <span class="badge {getStatusBadgeClasses(record.status)} text-xs" data-testid="inscription-status-badge">
                                            {$t(`inscription.status_${record.status.toLowerCase()}`)}
                                        </span>
                                    </div>
                                    <!-- Participants -->
                                    <div class="flex flex-wrap gap-1.5">
                                        {#each record.users as member}
                                            <div class="flex items-center gap-1 badge preset-tonal-primary p-1.5 pr-2">
                                                <Avatar class="w-5 h-5">
                                                    <Avatar.Image src={member.image ?? undefined} alt={member.name ?? 'User'} />
                                                    <Avatar.Fallback>{member.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                                </Avatar>
                                                <span class="text-xs">{member.name}{member.id === currentUser?.id ? ` (${$t('inscription.you')})` : ''}</span>
                                            </div>
                                        {/each}
                                        {#each record.userIntents || [] as intent}
                                            <div class="flex items-center gap-1 badge preset-tonal-warning p-1.5 pr-2">
                                                <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" />
                                                <span class="text-xs">{intent.name}</span>
                                            </div>
                                        {/each}
                                    </div>
                                    <!-- Created by you indicator -->
                                    {#if record.creatorId === currentUser?.id && !isUserInRecord(record)}
                                        <span class="text-xs text-surface-500 italic">{$t('inscription.created_by_you')}</span>
                                    {/if}
                                </div>
                                <!-- Unregister button -->
                                {#if canRegister}
                                    <form method="POST" action="?/unregister" class="shrink-0" use:enhance={() => {
                                        return async ({ update }) => {
                                            await update();
                                            await invalidateAll();
                                        };
                                    }}>
                                        <input type="hidden" name="record_id" value={record.id} />
                                        <button
                                            type="submit"
                                            class="btn-icon btn-icon-sm preset-filled-error-500 rounded-full shrink-0"
                                        >
                                            <Icon icon="mdi:close" width="0.9rem" height="0.9rem" />
                                        </button>
                                    </form>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Queued signups & in-progress team builders -->
                {#each slots as slot (slot.slotId)}
                    {@const slotComplete = isSlotComplete(slot, category)}
                    {#if slotComplete}
                        <!-- Completed queued slot - dashed border -->
                        <div class="flex items-center justify-between gap-2 p-3 border-2 border-dashed border-primary-400 dark:border-primary-500 rounded-lg bg-primary-50/30 dark:bg-primary-900/10" transition:slide={{ duration: 200 }}>
                            <div class="flex items-center gap-3 flex-wrap min-w-0">
                                <div class="flex flex-wrap gap-1.5">
                                    {#each slot.users as member}
                                        <div class="flex items-center gap-1 badge preset-tonal-primary p-1.5 pr-2">
                                            <Avatar class="w-5 h-5">
                                                <Avatar.Image src={member.image ?? undefined} alt={member.name ?? 'User'} />
                                                <Avatar.Fallback>{member.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                            </Avatar>
                                            <span class="text-xs">{member.name}{member.id === currentUser?.id ? ` (${$t('inscription.you')})` : ''}</span>
                                        </div>
                                    {/each}
                                    {#each slot.intentNames as intentName}
                                        <div class="flex items-center gap-1 badge preset-tonal-warning p-1.5 pr-2">
                                            <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" />
                                            <span class="text-xs">{intentName}</span>
                                        </div>
                                    {/each}
                                    {#each slot.existingIntents as existingIntent}
                                        <div class="flex items-center gap-1 badge preset-tonal-warning p-1.5 pr-2">
                                            <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" />
                                            <span class="text-xs">{existingIntent.name}</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                            <button
                                type="button"
                                class="btn-icon btn-icon-sm preset-filled-error-500 rounded-full shrink-0"
                                onclick={() => removeSlot(category.id, slot.slotId)}
                            >
                                <Icon icon="mdi:close" width="1.2rem" height="1.2rem" />
                            </button>
                        </div>
                    {:else}
                        <!-- In-progress team builder -->
                        {@const totalPartySize = getSlotPartySize(slot)}
                        <div class="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-300 dark:border-warning-700 rounded-lg relative" transition:slide={{ duration: 200 }}>
                            <!-- Cancel button -->
                            <button
                                type="button"
                                class="absolute -top-2 -right-2 w-6 h-6 bg-error-500 hover:bg-error-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
                                onclick={() => removeSlot(category.id, slot.slotId)}
                                title={$t('inscription.cancel')}
                            >
                                ✕
                            </button>

                            <!-- Party progress -->
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-sm font-medium">
                                    {$t('inscription.team_progress')}: {totalPartySize}/{maxSize}
                                </span>
                                {#if totalPartySize === maxSize}
                                    <Icon icon="mdi:check-circle" width="1rem" height="1rem" class="text-success-500" />
                                {/if}
                            </div>

                            <!-- Selected participants -->
                            <div class="space-y-2 mb-3">
                                {#each slot.users as participant}
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <Avatar class="w-8 h-8">
                                                <Avatar.Image src={participant.image ?? undefined} alt={participant.name ?? 'User'} />
                                                <Avatar.Fallback>{participant.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                            </Avatar>
                                            <span class="text-sm">
                                                {participant.name}
                                                {#if participant.id === currentUser?.id}
                                                    <span class="text-xs text-surface-500">({$t('inscription.you')})</span>
                                                {/if}
                                            </span>
                                        </div>
                                        {#if participant.id !== currentUser?.id}
                                            <button
                                                type="button"
                                                class="btn btn-sm preset-filled-error-500"
                                                onclick={() => removeTeammate(category.id, slot.slotId, participant.id)}
                                            >
                                                <Icon icon="mdi:close" width="0.8rem" height="0.8rem" />
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                                {#each slot.intentNames as intentName, intentIndex}
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center">
                                                <Icon icon="mdi:account-question" width="1rem" height="1rem" class="text-warning-700 dark:text-warning-300" />
                                            </div>
                                            <span class="text-sm">{intentName}</span>
                                        </div>
                                        <button
                                            type="button"
                                            class="btn btn-sm preset-filled-error-500"
                                            onclick={() => removeUserIntent(category.id, slot.slotId, intentIndex)}
                                        >
                                            <Icon icon="mdi:close" width="0.8rem" height="0.8rem" />
                                        </button>
                                    </div>
                                {/each}
                                {#each slot.existingIntents as existingIntent}
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center">
                                                <Icon icon="mdi:account-question" width="1rem" height="1rem" class="text-warning-700 dark:text-warning-300" />
                                            </div>
                                            <span class="text-sm">{existingIntent.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            class="btn btn-sm preset-filled-error-500"
                                            onclick={() => removeExistingIntent(category.id, slot.slotId, existingIntent.id)}
                                        >
                                            <Icon icon="mdi:close" width="0.8rem" height="0.8rem" />
                                        </button>
                                    </div>
                                {/each}
                            </div>

                            <!-- Search for participants (only when party is not full) -->
                            {#if totalPartySize < maxSize}
                                {@const query = searchQueries.get(slot.slotId) || ''}
                                {@const results = searchResults.get(slot.slotId) || []}
                                {@const intentResults = intentSearchResults.get(slot.slotId) || []}
                                <div class="relative">
                                    <input
                                        type="text"
                                        value={query}
                                        oninput={(e) => handleSearchInput(slot.slotId, category.id, (e.target as HTMLInputElement).value)}
                                        placeholder={$t('inscription.search_placeholder')}
                                        class="input w-full text-sm"
                                    />

                                    {#if results.length > 0 || intentResults.length > 0 || (query.length >= 2)}
                                        <div class="absolute z-20 w-full bottom-full mb-1 bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {#each results as user}
                                                {@const alreadyInscribed = isUserAlreadyInCategory(user.id, category.id, slot.slotId)}
                                                {#if alreadyInscribed}
                                                    <div
                                                        class="w-full p-2 text-left flex items-center gap-2 border-b border-surface-200 dark:border-surface-700 opacity-50 cursor-not-allowed"
                                                    >
                                                        <Avatar class="w-6 h-6">
                                                            <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                                                            <Avatar.Fallback>{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                                        </Avatar>
                                                        <div class="text-sm flex-1">
                                                            <div class="font-medium">{user.name}</div>
                                                            <div class="text-xs text-surface-500 italic">{$t('inscription.already_inscribed')}</div>
                                                        </div>
                                                        <Icon icon="mdi:account-check" width="1rem" height="1rem" class="text-surface-400" />
                                                    </div>
                                                {:else}
                                                    <button
                                                        type="button"
                                                        onclick={() => addTeammate(category.id, slot.slotId, user)}
                                                        class="w-full p-2 text-left hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center gap-2 border-b border-surface-200 dark:border-surface-700"
                                                    >
                                                        <Avatar class="w-6 h-6">
                                                            <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                                                            <Avatar.Fallback>{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                                        </Avatar>
                                                        <div class="text-sm">
                                                            <div class="font-medium">{user.name}</div>
                                                        </div>
                                                    </button>
                                                {/if}
                                            {/each}
                                            {#if intentResults.length > 0}
                                                <div class="px-2 py-1 text-xs font-semibold text-surface-500 dark:text-surface-400 border-t border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800">
                                                    {$t('inscription.previously_registered')}
                                                </div>
                                                {#each intentResults as intent}
                                                    <button
                                                        type="button"
                                                        onclick={() => addExistingIntent(category.id, slot.slotId, intent)}
                                                        class="w-full p-2 text-left hover:bg-warning-50 dark:hover:bg-warning-900/30 flex items-center gap-2 border-b border-surface-200 dark:border-surface-700"
                                                    >
                                                        <div class="w-6 h-6 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center shrink-0">
                                                            <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
                                                        </div>
                                                        <div class="text-sm font-medium">{intent.name}</div>
                                                    </button>
                                                {/each}
                                            {/if}
                                            {#if query.trim().length >= 2}
                                                <button
                                                    type="button"
                                                    onclick={() => addUserIntent(category.id, slot.slotId, query)}
                                                    class="w-full p-2 text-left hover:bg-warning-50 dark:hover:bg-warning-900/30 flex items-center gap-2 border-t border-surface-300 dark:border-surface-600"
                                                >
                                                    <div class="w-6 h-6 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center shrink-0">
                                                        <Icon icon="mdi:account-plus-outline" width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
                                                    </div>
                                                    <div class="text-sm">
                                                        <span class="font-medium">{$t('inscription.add_non_registered')}</span>
                                                        <span class="text-warning-600 dark:text-warning-400"> "{query.trim()}"</span>
                                                    </div>
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}

                <!-- Add another / Initial signup button -->
                {#if canRegister}
                    {#if !limitReached}
                        {#if individual}
                            {@const hasExisting = slots.length > 0 || records.length > 0}
                            <button
                                type="button"
                                class="btn {hasExisting ? 'preset-tonal-success' : 'preset-filled-success-500'} w-full sm:w-auto"
                                onclick={() => isUserInCategory(category.id) ? addIndividualSlotForOther(category.id) : addIndividualSignup(category.id)}
                                data-testid="signup-category-{category.id}"
                            >
                                <Icon icon="mdi:account-plus" width="1.2rem" height="1.2rem" />
                                {hasExisting ? $t('inscription.add_another') : $t('inscription.sign_up')}
                            </button>
                        {:else}
                            {@const hasExisting = slots.length > 0 || records.length > 0}
                            <button
                                type="button"
                                class="btn {hasExisting ? 'preset-tonal-success' : 'preset-filled-success-500'} w-full sm:w-auto"
                                onclick={() => addGroupSlot(category.id)}
                            >
                                <Icon icon="mdi:account-group" width="1.2rem" height="1.2rem" />
                                {hasExisting ? $t('inscription.build_another_team') : $t('inscription.build_team')}
                            </button>
                        {/if}
                    {:else}
                        <p class="text-sm text-surface-500 italic flex items-center gap-1">
                            <Icon icon="mdi:information-outline" width="1rem" height="1rem" />
                            {$t('inscription.limit_reached')}
                        </p>
                    {/if}
                {:else if records.length === 0 && slots.length === 0}
                    <p class="text-sm text-surface-500 italic">{$t('inscription.registration_not_available')}</p>
                {/if}
            </Card>
        {/each}
    </div>

    <!-- Submit all signups -->
    {#if hasNewSignups}
        <div class="sticky bottom-4 mt-6 z-30" transition:slide={{ duration: 200 }}>
            <form method="POST" action="?/signup" use:enhance={() => {
                isSubmitting = true;
                resultMessage = null;
                const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
                return async ({ result, update }) => {
                    await minLoadingTime;
                    isSubmitting = false;
                    if (result.type === 'success' && result.data) {
                        const data = result.data as { success: boolean; message?: string };
                        showResultMessage({ success: data.success, message: data.message || '' });
                        if (result.data.success) {
                            clearAllSignupState();
                            await invalidateAll();
                        }
                    } else if (result.type === 'failure') {
                        showResultMessage({ success: false, message: 'An error occurred' });
                    }
                    await update({ reset: false });
                };
            }}>
                <input type="hidden" name="signups" value={JSON.stringify(buildSignupPayload())} />
                <div class="bg-surface-50 dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3">
                    <!-- Summary -->
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                        <Icon icon="mdi:clipboard-check-outline" width="1.1rem" height="1.1rem" class="text-primary-500" />
                        <span class="font-medium">{totalNewSignups()} {$t('inscription.new_registrations_summary')}</span>
                        <span class="text-surface-400">—</span>
                        {#each signupSummary() as item}
                            <span class="badge preset-tonal-primary text-xs p-1.5">{item.count}× {item.type}</span>
                        {/each}
                    </div>
                    <button
                        type="submit"
                        class="btn preset-filled-primary-500 w-full shadow-lg"
                        disabled={!canSubmit || isSubmitting}
                        data-testid="submit-all-registrations"
                    >
                        <Icon icon="mdi:check-all" width="1.2rem" height="1.2rem" />
                        {$t('inscription.submit_all')}
                        {#if !allPartiesComplete()}
                            <span class="text-xs opacity-75">({$t('inscription.incomplete_parties')})</span>
                        {/if}
                    </button>
                </div>
            </form>
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
