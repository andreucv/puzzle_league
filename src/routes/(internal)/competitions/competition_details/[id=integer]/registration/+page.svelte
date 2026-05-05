<script lang="ts">
    import type { User, Category, CategoryType } from '@prisma/client';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import { getCategoryTypeName, getCategoryTypeIcon, getMaxRecordsPerCategory } from '$lib/utils/category_utils';
    import { getRegistrationStatusBorderClass as getStatusBorderClass } from '$lib/utils/registration_utils';
    import RegistrationStatusBadge from '$lib/components/registration/RegistrationStatusBadge.svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { slide } from 'svelte/transition';
    import LoadingOverlay from '$lib/components/common/LoadingOverlay.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import CheckAllIcon from '@iconify-svelte/mdi/check-all';
    import ClipboardCheckOutlineIcon from '@iconify-svelte/mdi/clipboard-check-outline';

    let { data } = $props();

    let currentUser = $derived(data.user);
    let competition = $derived(data.competition);
    let categories = $derived(competition?.categories || []);
    let existingRecords = $derived(data.existingRecords || []);
    let inscribedUserIds = $derived(data.inscribedUserIds as Record<number, string[]> || {});
    let categoriesWithCounts = $derived(data.categoriesWithCounts || []);

    let canRegister = $derived(competition?.registrationOpen);

    function canRegisterForCategory(category: Category): boolean {
        return !!canRegister && category.status === 'NOT_STARTED';
    }

    function getSpotsLeft(category: Category): number | undefined {
        if (category.maxParties == null) return undefined;
        const registered = categoriesWithCounts.find((c: any) => c.id === category.id)?.totalEntries ?? 0;
        return category.maxParties - registered;
    }

    // ---------------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------------

    interface PendingSignup {
        slotId: number;
        users: User[];
        extParticipantNames: string[];
        existingExternalParticipants: { id: string; name: string }[];
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
    let showPaymentPopover = $state(false);
    let submitFormEl = $state<HTMLFormElement | null>(null);
    let showSuccessCard = $state(false);

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
            (r.status === 'PENDING_CONFIRMATION' || r.status === 'CONFIRMED' || r.status === 'WAITLISTED')
        );
    }

    // Check if user can create more records for this category (accounts for queued slots)
    function canCreateMore(category: Category): boolean {
        const records = getExistingRecords(category.id);
        const createdByUser = records.filter((r: any) => r.creatorId === currentUser?.id).length;
        const queuedCount = getSlots(category.id).length;
        const maxEntries = getMaxRecordsPerCategory(category.type);
        return (createdByUser + queuedCount) < maxEntries;
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
        return slot.users.length + slot.extParticipantNames.length + slot.existingExternalParticipants.length === maxSize;
    }

    function getSlotPartySize(slot: PendingSignup): number {
        return slot.users.length + slot.extParticipantNames.length + slot.existingExternalParticipants.length;
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
            extParticipantNames: [],
            existingExternalParticipants: []
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
            extParticipantNames: [],
            existingExternalParticipants: []
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
            extParticipantNames: [],
            existingExternalParticipants: []
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

    function addExternalParticipant(categoryId: number, slotId: number, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        updateSlot(categoryId, slotId, s => ({ ...s, extParticipantNames: [...s.extParticipantNames, trimmed] }));
        clearSlotSearchState(slotId);
    }

    function removeExternalParticipant(categoryId: number, slotId: number, index: number) {
        updateSlot(categoryId, slotId, s => ({ ...s, extParticipantNames: s.extParticipantNames.filter((_, i) => i !== index) }));
    }

    function addExistingIntent(categoryId: number, slotId: number, intent: { id: string; name: string }) {
        updateSlot(categoryId, slotId, s => ({ ...s, existingExternalParticipants: [...s.existingExternalParticipants, intent] }));
        clearSlotSearchState(slotId);
    }

    function removeExistingIntent(categoryId: number, slotId: number, intentId: string) {
        updateSlot(categoryId, slotId, s => ({ ...s, existingExternalParticipants: s.existingExternalParticipants.filter(i => i.id !== intentId) }));
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
                fetch(`/api/external-participants?q=${encodeURIComponent(query)}`)
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
                const alreadySelected = slot?.existingExternalParticipants || [];
                const filtered = (result.externalParticipants || []).filter(
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

    // Payment warning: compute whether to show and the itemized fee breakdown
    let shouldShowPaymentWarning = $derived(() => {
        if (!competition?.showPaymentWarning) return false;
        // Only show if at least one queued category has a price > 0
        for (const [categoryId] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (category && (category as any).price > 0) return true;
        }
        return false;
    });

    let paymentFeeBreakdown = $derived(() => {
        const items: { name: string; count: number; unitPrice: number }[] = [];
        let total = 0;
        for (const [categoryId, slots] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) continue;
            const price = (category as any).price ?? 0;
            if (price > 0) {
                const typeName = getCategoryTypeName(category.type);
                const description = category.description ? `${typeName} (${category.description})` : typeName;
                items.push({ name: description, count: slots.length, unitPrice: price });
                total += price * slots.length;
            }
        }
        return { items, total };
    });

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
        const payload: { categoryId: number; teammateIds: string[]; externalParticipantNames?: string[]; externalParticipantIds?: string[]; registeredBySelf?: boolean }[] = [];
        for (const [categoryId, slots] of pendingSignups) {
            for (const slot of slots) {
                const currentUserInParty = slot.users.some(u => u.id === currentUser?.id);
                const teammateIds = slot.users
                    .filter(u => u.id !== currentUser?.id)
                    .map(u => u.id);
                payload.push({
                    categoryId,
                    teammateIds,
                    ...(slot.extParticipantNames.length > 0 ? { externalParticipantNames: slot.extParticipantNames } : {}),
                    ...(slot.existingExternalParticipants.length > 0 ? { externalParticipantIds: slot.existingExternalParticipants.map(i => i.id) } : {}),
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
    <LoadingOverlay show={isSubmitting} message={$t('registration.submitting') || 'Submitting registrations...'} />

    <!-- Header -->
    <div class="space-y-4 mb-6">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('registration.title')} subtitle={competition.name}/>

        <!-- Competition context -->
        <div class="flex flex-wrap items-center gap-3 text-sm text-surface-500">
            {#if competition.startDate}
                <span class="flex items-center gap-1">
                    <Icon icon="mdi:calendar-clock" width="1rem" height="1rem" class="text-primary-500" />
                    {new Date(competition.startDate).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            {/if}
            {#if competition.location}
                <span class="flex items-center gap-1">
                    <Icon icon="mdi:map-marker" width="1rem" height="1rem" class="text-primary-500" />
                    {competition.location}
                </span>
            {/if}
        </div>

        {#if !canRegister}
            <div class="alert preset-filled-warning-500 p-4 rounded-lg" data-testid="registration-closed-warning">
                <Icon icon="mdi:alert" width="1.5rem" height="1.5rem" />
                <span>{$t('registration.registration_closed')}</span>
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
            {@const maxEntries = getMaxRecordsPerCategory(category.type)}
            {@const slots = getSlots(category.id)}
            {@const totalRegistrations = createdByUserCount + slots.length}
            {@const limitReached = totalRegistrations >= maxEntries}
            {@const maxSize = category.maxPartySize || 1}
            {@const individual = isIndividual(category)}
            {@const spotsLeft = getSpotsLeft(category)}

            <Card>
                <!-- Category header -->
                <div class="flex justify-between items-start">
                    <CategoryCardTitle type={category.type} subname={category.description} />
                    <div class="flex items-center gap-2 flex-wrap justify-end">
                        <span class="badge preset-tonal text-xs flex items-center gap-1 p-2">
                            <Icon icon="mdi:account-multiple" width="1rem" height="1rem" />
                            {maxSize} {maxSize === 1 ? $t('registration.participant') : $t('registration.participants')}
                        </span>
                        {#if spotsLeft !== undefined}
                            {#if spotsLeft <= 0}
                                <span class="badge preset-tonal-error text-xs flex items-center gap-1 p-2">
                                    <Icon icon="mdi:account-off" width="1rem" height="1rem" />
                                    {$t('competition_details.full')}
                                </span>
                            {:else if spotsLeft <= 3}
                                <span class="badge preset-tonal-warning text-xs flex items-center gap-1 p-2">
                                    <Icon icon="mdi:account-plus-outline" width="1rem" height="1rem" />
                                    {spotsLeft} {$t('competition_details.spots_left')}
                                </span>
                            {:else}
                                <span class="badge preset-tonal-success text-xs flex items-center gap-1 p-2">
                                    <Icon icon="mdi:account-plus-outline" width="1rem" height="1rem" />
                                    {spotsLeft} {$t('competition_details.spots_left')}
                                </span>
                            {/if}
                        {/if}
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
                        <!-- TODO: maxEntries is misleading for the user, if there is a category with less available spots than the maxEntries -->
                        <span class="badge {limitReached ? 'preset-filled-surface-200-800' : 'preset-tonal-primary'} text-xs p-2">
                            <Icon icon="mdi:clipboard-list" width="0.9rem" height="0.9rem" />
                            {totalRegistrations}/{maxEntries} {$t('registration.your_registrations')}
                        </span>
                    </div>
                {/if}

                <!-- Existing records list -->
                {#if records.length > 0}
                    <div class="space-y-2">
                        {#each records as record (record.id)}
                            <div class="flex items-center justify-between gap-2 p-3 border rounded-lg {getStatusBorderClass(record.status)}" data-testid="registration-entry-{record.id}">
                                <div class="flex items-center gap-3 flex-wrap min-w-0">
                                    <!-- Status -->
                                    <RegistrationStatusBadge status={record.status} translation={$t} />
                                    <!-- Participants -->
                                    <div class="flex flex-wrap gap-1.5">
                                        {#each record.users as member}
                                            <div class="flex items-center gap-1 badge preset-tonal-primary p-1.5 pr-2">
                                                <Avatar class="w-5 h-5">
                                                    <Avatar.Image src={member.image ?? undefined} alt={member.name ?? 'User'} />
                                                    <Avatar.Fallback>{member.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                                </Avatar>
                                                <span class="text-xs">{member.name}{member.id === currentUser?.id ? ` (${$t('registration.you')})` : ''}</span>
                                            </div>
                                        {/each}
                                        {#each record.externalParticipants || [] as intent}
                                            <div class="flex items-center gap-1 badge preset-tonal-warning p-1.5 pr-2">
                                                <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" />
                                                <span class="text-xs">{intent.name}</span>
                                            </div>
                                        {/each}
                                    </div>
                                    <!-- Created by you indicator -->
                                    {#if record.creatorId === currentUser?.id && !isUserInRecord(record)}
                                        <span class="text-xs text-surface-500 italic">{$t('registration.created_by_you')}</span>
                                    {/if}
                                </div>
                                <!-- Unregister button -->
                                {#if canRegisterForCategory(category)}
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
                                            <span class="text-xs">{member.name}{member.id === currentUser?.id ? ` (${$t('registration.you')})` : ''}</span>
                                        </div>
                                    {/each}
                                    {#each slot.extParticipantNames as intentName}
                                        <div class="flex items-center gap-1 badge preset-tonal-warning p-1.5 pr-2">
                                            <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" />
                                            <span class="text-xs">{intentName}</span>
                                        </div>
                                    {/each}
                                    {#each slot.existingExternalParticipants as existingIntent}
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
                                aria-label={$t('registration.cancel')}
                            >
                                <Icon icon="mdi:close" width="0.85rem" height="0.85rem" />
                            </button>

                            <!-- Party progress -->
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-sm font-medium">
                                    {$t('registration.team_progress')}: {totalPartySize}/{maxSize}
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
                                                    <span class="text-xs text-surface-500">({$t('registration.you')})</span>
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
                                {#each slot.extParticipantNames as intentName, intentIndex}
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
                                            onclick={() => removeExternalParticipant(category.id, slot.slotId, intentIndex)}
                                        >
                                            <Icon icon="mdi:close" width="0.8rem" height="0.8rem" />
                                        </button>
                                    </div>
                                {/each}
                                {#each slot.existingExternalParticipants as existingIntent}
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
                                        placeholder={$t('registration.search_placeholder')}
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
                                                            <div class="text-xs text-surface-500 italic">{$t('registration.already_inscribed')}</div>
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
                                                    {$t('registration.previously_registered')}
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
                                                    onclick={() => addExternalParticipant(category.id, slot.slotId, query)}
                                                    class="w-full p-2 text-left hover:bg-warning-50 dark:hover:bg-warning-900/30 flex items-center gap-2 border-t border-surface-300 dark:border-surface-600"
                                                >
                                                    <div class="w-6 h-6 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center shrink-0">
                                                        <Icon icon="mdi:account-plus-outline" width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
                                                    </div>
                                                    <div class="text-sm">
                                                        <span class="font-medium">{$t('registration.add_non_registered')}</span>
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
                {#if canRegisterForCategory(category)}
                    {#if !limitReached}
                        {#if individual}
                            {@const hasExisting = slots.length > 0 || records.length > 0}
                            <button
                                type="button"
                                class="btn {hasExisting ? 'preset-tonal-success' : 'preset-filled-success-500'} w-full sm:w-auto"
                                onclick={() => isUserInCategory(category.id) ? addIndividualSlotForOther(category.id) : addIndividualSignup(category.id)}
                            >
                                <Icon icon="mdi:account-plus" width="1.2rem" height="1.2rem" />
                                {hasExisting ? $t('registration.add_another') : $t('registration.sign_up')}
                            </button>
                        {:else}
                            {@const hasExisting = slots.length > 0 || records.length > 0}
                            {@const isPairs = category.type === 'PAIRS' || category.type === 'JUNIOR_PAIRS'}
                            <button
                                type="button"
                                class="btn {hasExisting ? 'preset-tonal-success' : 'preset-filled-success-500'} w-full sm:w-auto"
                                onclick={() => addGroupSlot(category.id)}
                            >
                                <Icon icon={isPairs ? "mdi:account-multiple" : "mdi:account-group"} width="1.2rem" height="1.2rem" />
                                {hasExisting
                                    ? (isPairs ? $t('registration.build_another_pair') : $t('registration.build_another_team'))
                                    : (isPairs ? $t('registration.build_pair') : $t('registration.build_team'))}
                            </button>
                        {/if}
                    {:else}
                        <p class="text-sm text-surface-500 italic flex items-center gap-1">
                            <Icon icon="mdi:information-outline" width="1rem" height="1rem" />
                            {$t('registration.limit_reached')}
                        </p>
                    {/if}
                {:else if records.length === 0 && slots.length === 0}
                    <p class="text-sm text-surface-500 italic">{$t('registration.registration_not_available')}</p>
                {/if}
            </Card>
        {/each}
    </div>

    <!-- Success card after registration -->
    {#if showSuccessCard && !hasNewSignups}
        <div class="mt-6" transition:slide={{ duration: 200 }}>
            <Card>
                <div class="flex flex-col items-center gap-4 py-4 text-center">
                    <CheckAllIcon width="2.5rem" height="2.5rem" class="text-success-500" />
                    <div>
                        <h3 class="h4 font-semibold">{$t('registration.success_title')}</h3>
                        <p class="text-sm text-surface-500 mt-1">{$t('registration.success_message')}</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-3">
                        <a href="/competitions/competition_details/{competition?.id}" class="btn preset-filled-primary-500">
                            {$t('registration.back_to_competition')}
                        </a>
                        <a href="/" class="btn preset-tonal">
                            {$t('registration.go_home')}
                        </a>
                    </div>
                </div>
            </Card>
        </div>
    {/if}

    <!-- Submit all signups -->
    {#if hasNewSignups}
        <div class="sticky bottom-4 mt-6 z-30" transition:slide={{ duration: 200 }}>
            <form bind:this={submitFormEl} method="POST" action="?/signup" use:enhance={() => {
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
                            showSuccessCard = true;
                            await invalidateAll();
                        }
                    } else if (result.type === 'failure') {
                        showResultMessage({ success: false, message: 'An error occurred' });
                    }
                    await update({ reset: false });
                };
            }}>
                <input type="hidden" name="signups" value={JSON.stringify(buildSignupPayload())} />
                <div class="bg-surface-50 dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3 relative">
                    <!-- Summary -->
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                        <ClipboardCheckOutlineIcon width="1.1rem" height="1.1rem" class="text-primary-500" />
                        <span class="font-medium">{totalNewSignups()} {$t('registration.new_registrations_summary')}</span>
                        <span class="text-surface-400">—</span>
                        {#each signupSummary() as item}
                            <span class="badge preset-tonal-primary text-xs p-1.5">{item.count}× {item.type}</span>
                        {/each}
                    </div>
                    <button
                        type={shouldShowPaymentWarning() ? 'button' : 'submit'}
                        class="btn preset-filled-primary-500 w-full shadow-lg flex-wrap justify-center"
                        disabled={!canSubmit || isSubmitting}
                        data-testid="submit-all-registrations"
                        onclick={(e) => {
                            if (shouldShowPaymentWarning()) {
                                e.preventDefault();
                                showPaymentPopover = true;
                            }
                        }}
                    >
                        <CheckAllIcon width="1.2rem" height="1.2rem" />
                        {$t('registration.submit_all')}
                        {#if !allPartiesComplete()}
                            <span class="text-xs opacity-75">({$t('registration.incomplete_parties')})</span>
                        {/if}
                    </button>

                    <!-- Payment warning popover -->
                    {#if showPaymentPopover}
                        {@const breakdown = paymentFeeBreakdown()}
                        <div
                            role="dialog"
                            aria-modal="true"
                            class="absolute bottom-full left-0 right-0 mb-2 z-50 card bg-warning-50 dark:bg-warning-950 border-2 border-warning-300 dark:border-warning-700 shadow-xl overflow-hidden"
                            transition:slide={{ duration: 200 }}
                        >
                            <div class="h-1 w-full preset-filled-warning-500"></div>
                            <div class="p-4 space-y-3">
                                <div class="flex items-center gap-2">
                                    <Icon icon="mdi:alert-circle" width="1.3rem" height="1.3rem" class="text-warning-500" />
                                    <p class="text-sm font-semibold">{$t('registration.payment_warning_title')}</p>
                                </div>
                                <p class="text-xs text-warning-600 dark:text-warning-400">
                                    {$t('registration.pending_confirmation_is_not_guaranteed_inscription')}
                                </p>
                                <p class="text-xs text-surface-600 dark:text-surface-400">
                                    {$t('registration.payment_warning_message')}
                                </p>
                                <!-- Itemized fees -->
                                <div class="space-y-1 text-sm">
                                    {#each breakdown.items as item}
                                        <div class="flex justify-between items-center">
                                            <span>{item.count}× {item.name}</span>
                                            <span class="font-medium">{item.unitPrice * item.count}€</span>
                                        </div>
                                    {/each}
                                    <div class="flex justify-between items-center border-t border-surface-300 dark:border-surface-600 pt-1 font-semibold">
                                        <span>{$t('registration.payment_warning_total')}</span>
                                        <span>{breakdown.total}€</span>
                                    </div>
                                </div>
                                <div class="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        class="btn btn-sm preset-tonal"
                                        onclick={() => { showPaymentPopover = false; }}
                                    >
                                        <Icon icon="mdi:close" width="1rem" height="1rem" />
                                        {$t('registration.payment_warning_cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        class="btn btn-sm preset-filled-warning-500"
                                        onclick={() => { showPaymentPopover = false; }}
                                        data-testid="payment-warning-confirm"
                                    >
                                        <Icon icon="mdi:check" width="1rem" height="1rem" />
                                        {$t('registration.payment_warning_confirm')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
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
