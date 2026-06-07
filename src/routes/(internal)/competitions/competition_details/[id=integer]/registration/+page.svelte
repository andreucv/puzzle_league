<script lang="ts">
    import type { User, Category, CategoryType } from '@prisma/client';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { enhance } from '$app/forms';
    import { invalidate } from '$app/navigation';
    import { t } from '$lib/translations';
    import { getCategoryTypeName, getCategoryTypeSingularName, getCategoryTypeIcon, getMaxEntriesPerCategory } from '$lib/utils/category_utils';
    import { getRegistrationStatusBorderClass as getStatusBorderClass } from '$lib/utils/registration_utils';
    import RegistrationStatusBadge from '$lib/components/registration/EntryRegistrationStatusBadge.svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { slide } from 'svelte/transition';
    import LoadingOverlay from '$lib/components/common/LoadingOverlay.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import CheckAllIcon from '@iconify-svelte/mdi/check-all';
    import ClipboardCheckOutlineIcon from '@iconify-svelte/mdi/clipboard-check-outline';
    import CalendarClockIcon from '@iconify-svelte/mdi/calendar-clock';
    import MapMarkerIcon from '@iconify-svelte/mdi/map-marker';
    import AlertIcon from '@iconify-svelte/mdi/alert';
    import AccountMultipleIcon from '@iconify-svelte/mdi/account-multiple';
    import AccountOffIcon from '@iconify-svelte/mdi/account-off';
    import AccountPlusOutlineIcon from '@iconify-svelte/mdi/account-plus-outline';
    import ClockStartIcon from '@iconify-svelte/mdi/clock-start';
    import ClockEndIcon from '@iconify-svelte/mdi/clock-end';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import ClipboardListIcon from '@iconify-svelte/mdi/clipboard-list';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import AlertCircleIcon from '@iconify-svelte/mdi/alert-circle';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import AccountCheckIcon from '@iconify-svelte/mdi/account-check';
    import AccountPlusIcon from '@iconify-svelte/mdi/account-plus';
    import InformationOutlineIcon from '@iconify-svelte/mdi/information-outline';
    import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import ShieldAccountIcon from '@iconify-svelte/mdi/shield-account';
    import { showRichSuccessToast, showErrorToast } from '$lib/utils/toast';
    import type { RegistrationSummary } from '$lib/utils/toast';

    let { data } = $props();

    let currentUser = $derived(data.user);
    let competition = $derived(data.competition);
    let categories = $derived(competition?.categories || []);
    let existingEntries = $derived(data.existingEntries || []);
    let registeredUserIds = $derived(data.registeredUserIds as Record<number, string[]> || {});
    let categoriesWithCounts = $derived(data.categoriesWithCounts || []);
    let isOrganizer = $derived(data.isOrganizer || false);
    let availableTagsByCategory = $derived(
        (data.availableTagsByCategory as Record<number, { tag: string; priceOverride: number | null }[]>) || {}
    );

    function getAvailableTags(categoryId: number) {
        return availableTagsByCategory[categoryId] || [];
    }

    let canRegister = $derived(competition?.registrationOpen || isOrganizer);

    function canRegisterForCategory(category: Category): boolean {
        return !!canRegister && category.status === 'NOT_STARTED';
    }

    function getSpotsLeft(category: Category): number | undefined {
        if (category.maxParties == null) return undefined;
        const counts = categoriesWithCounts.find((c: any) => c.id === category.id);
        const registered = counts?.reservedSlots ?? counts?.totalEntries ?? 0;
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
        claimedTag?: string;
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
    let showPaymentPopover = $state(false);
    let submitFormEl = $state<HTMLFormElement | null>(null);

    // Unregister confirmation state — tracks entry id of the popover being shown
    let confirmingUnregisterId = $state<string | null>(null);

    // Debounce timers
    let searchTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

    // Get ALL existing entries for a category (user is participant OR creator)
    function getExistingEntries(categoryId: number) {
        return existingEntries.filter((r: any) =>
            r.categoryId === categoryId &&
            (r.status === 'PENDING_CONFIRMATION' || r.status === 'CONFIRMED' || r.status === 'WAITLISTED')
        );
    }

    // Check if user can create more entries for this category (accounts for queued slots)
    // Organizers/admins bypass per-creator entry limits
    function canCreateMore(category: Category): boolean {
        if (isOrganizer) return true;
        const entries = getExistingEntries(category.id);
        const createdByUser = entries.filter((r: any) => r.creatorId === currentUser?.id).length;
        const queuedCount = getSlots(category.id).length;
        const maxEntries = getMaxEntriesPerCategory(category.type);
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

    // A slot is submittable if it has at least 1 member (user, external name, or existing external)
    function isSlotSubmittable(slot: PendingSignup): boolean {
        return slot.users.length + slot.extParticipantNames.length + slot.existingExternalParticipants.length >= 1;
    }

    function getSlotPartySize(slot: PendingSignup): number {
        return slot.users.length + slot.extParticipantNames.length + slot.existingExternalParticipants.length;
    }

    // Check if current user is already registered or queued in a category
    function isUserInCategory(categoryId: number): boolean {
        const entries = getExistingEntries(categoryId);
        if (entries.some((r: any) => r.users?.some((u: any) => u.id === currentUser?.id))) return true;
        const slots = getSlots(categoryId);
        if (slots.some(s => s.users.some(u => u.id === currentUser?.id))) return true;
        return false;
    }

    // Check if any user is already registered (DB entries or pending slots) in a category
    function isUserAlreadyInCategory(userId: string, categoryId: number, excludeSlotId?: number): boolean {
        // Check existing DB entries via server-loaded registered user IDs
        const categoryRegistered = registeredUserIds[categoryId] || [];
        if (categoryRegistered.includes(userId)) return true;
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

    // Every slot must have at least 1 member to be submittable
    let allPartiesSubmittable = $derived(() => {
        for (const [, slots] of pendingSignups) {
            for (const slot of slots) {
                if (!isSlotSubmittable(slot)) return false;
            }
        }
        return true;
    });

    let canSubmit = $derived(hasNewSignups && allPartiesSubmittable());

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

    // Paid categories from queued signups that will be waitlisted (partially or fully)
    let waitlistedPaidCategories = $derived(() => {
        if (!competition?.showPaymentWarning) return [];
        const result: { name: string; waitlistedCount: number }[] = [];
        for (const [categoryId, slots] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) continue;
            const price = (category as any).price ?? 0;
            if (price <= 0) continue;
            const spotsLeft = getSpotsLeft(category);
            if (spotsLeft === undefined) continue;
            const waitlistedCount = Math.max(0, slots.length - Math.max(0, spotsLeft));
            if (waitlistedCount > 0) {
                const typeName = $t(getCategoryTypeName(category.type));
                const name = category.description ? `${typeName} (${category.description})` : typeName;
                result.push({ name, waitlistedCount });
            }
        }
        return result;
    });

    // Effective per-entry price for a slot: a claimed tag's priceOverride (if any)
    // replaces the base category price. A PENDING claim already drives the price.
    function getSlotUnitPrice(category: Category, slot: PendingSignup): number {
        const base = (category as any).price ?? 0;
        if (!slot.claimedTag) return base;
        const tag = getAvailableTags(category.id).find(t => t.tag === slot.claimedTag);
        return tag && tag.priceOverride != null ? tag.priceOverride : base;
    }

    let paymentFeeBreakdown = $derived(() => {
        const itemsMap = new Map<string, { name: string; count: number; unitPrice: number }>();
        let total = 0;
        for (const [categoryId, slots] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) continue;
            // Only count entries that will get reserved slots, not waitlisted ones
            const spotsLeft = getSpotsLeft(category);
            const payableCount = competition?.showPaymentWarning && spotsLeft !== undefined
                ? Math.min(slots.length, Math.max(0, spotsLeft))
                : slots.length;
            if (payableCount <= 0) continue;

            const typeName = $t(getCategoryTypeName(category.type));
            const description = category.description ? `${typeName} (${category.description})` : typeName;
            // Price per slot (tags can make slots in the same category cost differently)
            for (let i = 0; i < payableCount; i++) {
                const unitPrice = getSlotUnitPrice(category, slots[i]);
                if (unitPrice <= 0) continue;
                const key = `${categoryId}:${unitPrice}`;
                const existing = itemsMap.get(key);
                if (existing) existing.count += 1;
                else itemsMap.set(key, { name: description, count: 1, unitPrice });
                total += unitPrice;
            }
        }
        return { items: [...itemsMap.values()], total };
    });

    // True when any queued slot claims a tag that overrides the price — used to
    // warn that a rejected claim must be reconciled off-platform.
    let hasClaimedPricedTag = $derived(() => {
        for (const [categoryId, slots] of pendingSignups) {
            for (const slot of slots) {
                if (!slot.claimedTag) continue;
                const tag = getAvailableTags(categoryId).find(t => t.tag === slot.claimedTag);
                if (tag && tag.priceOverride != null) return true;
            }
        }
        return false;
    });

    function setSlotTag(categoryId: number, slotId: number, tag: string) {
        updateSlot(categoryId, slotId, s => ({ ...s, claimedTag: tag || undefined }));
    }

    // Build summary for submit bar
    let signupSummary = $derived(() => {
        const summary: { type: string; count: number }[] = [];
        for (const [categoryId, slots] of pendingSignups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) continue;
            const typeName = $t(getCategoryTypeName(category.type));
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
        const payload: { categoryId: number; teammateIds: string[]; externalParticipantNames?: string[]; externalParticipantIds?: string[]; registeredBySelf?: boolean; claimedTag?: string }[] = [];
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
                    ...(!currentUserInParty ? { registeredBySelf: false } : {}),
                    ...(slot.claimedTag ? { claimedTag: slot.claimedTag } : {})
                });
            }
        }
        return payload;
    }

    // Is individual category (maxPartySize === 1)?
    function isIndividual(category: Category): boolean {
        return (category.maxPartySize || 1) === 1;
    }

    // Check if current user is a participant (not just creator) of an entry
    function isUserInEntry(entry: any): boolean {
        return entry.users?.some((u: any) => u.id === currentUser?.id);
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
                    <CalendarClockIcon width="1rem" height="1rem" class="text-primary-500" />
                    {new Date(competition.startDate).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            {/if}
            {#if competition.location}
                <span class="flex items-center gap-1">
                    <MapMarkerIcon width="1rem" height="1rem" class="text-primary-500" />
                    {competition.location}
                </span>
            {/if}
        </div>

        {#if isOrganizer}
            <div class="alert preset-tonal-primary p-3 rounded-lg flex items-center gap-2">
                <ShieldAccountIcon width="1.3rem" height="1.3rem" class="text-primary-500 shrink-0" />
                <span class="text-sm font-medium">{$t('registration.organizer_mode')}</span>
            </div>
        {/if}

        {#if !canRegister}
            <div class="alert preset-filled-warning-500 p-4 rounded-lg" data-testid="registration-closed-warning">
                <AlertIcon width="1.5rem" height="1.5rem" />
                <span>{$t('registration.registration_closed')}</span>
            </div>
        {/if}
    </div>

    <!-- Categories -->
    <div class="space-y-4 pb-20">
        {#each categories as category (category.id)}
            {@const entries = getExistingEntries(category.id)}
            {@const createdByUserCount = entries.filter((r) => r.creatorId === currentUser?.id).length}
            {@const maxEntries = getMaxEntriesPerCategory(category.type)}
            {@const slots = getSlots(category.id)}
            {@const totalRegistrations = createdByUserCount + slots.length}
            {@const limitReached = !isOrganizer && totalRegistrations >= maxEntries}
            {@const maxSize = category.maxPartySize || 1}
            {@const individual = isIndividual(category)}
            {@const spotsLeft = getSpotsLeft(category)}

            <Card>
                <!-- Category header -->
                <div class="flex justify-between items-start">
                    <CategoryCardTitle type={category.type} subname={category.description} />
                    <div class="flex items-center gap-2 flex-wrap justify-end">
                        <span class="badge preset-tonal text-xs flex items-center gap-1 p-2">
                            <AccountMultipleIcon width="1rem" height="1rem" />
                            {maxSize} {maxSize === 1 ? $t('registration.participant') : $t('registration.participants')}
                        </span>
                        {#if spotsLeft !== undefined}
                            {#if spotsLeft <= 0}
                                <span class="badge preset-tonal-error text-xs flex items-center gap-1 p-2">
                                    <AccountOffIcon width="1rem" height="1rem" />
                                    {$t('competition_details.full')}
                                </span>
                            {:else if spotsLeft <= 3}
                                <span class="badge preset-tonal-warning text-xs flex items-center gap-1 p-2">
                                    <AccountPlusOutlineIcon width="1rem" height="1rem" />
                                    {spotsLeft} {$t('competition_details.spots_left')}
                                </span>
                            {:else}
                                <span class="badge preset-tonal-success text-xs flex items-center gap-1 p-2">
                                    <AccountPlusOutlineIcon width="1rem" height="1rem" />
                                    {spotsLeft} {$t('competition_details.spots_left')}
                                </span>
                            {/if}
                        {/if}
                    </div>
                </div>

                <!-- Time & puzzles info -->
                <div class="flex flex-wrap items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
                    <div class="flex items-center gap-1">
                        <ClockStartIcon width="1rem" height="1rem" />
                        <span>{formatTime(new Date(category.startTime))}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <ClockEndIcon width="1rem" height="1rem" />
                        <span>{formatTime(new Date(category.endTime))}</span>
                    </div>
                    {#if category.puzzles && category.puzzles.length > 0}
                        {#each category.puzzles as puzzle}
                            <span class="badge preset-tonal-primary text-xs flex items-center gap-1 p-2">
                                <PuzzleOutlineIcon width="0.8rem" height="0.8rem" />
                                {puzzle.pieces} pcs - {puzzle.brand}
                            </span>
                        {/each}
                    {/if}
                </div>

                <!-- Registration count badge -->
                {#if !isOrganizer}
                    {#if entries.length > 0 || slots.length > 0}
                    <div class="flex items-center gap-2">
                        <span class="badge {limitReached ? 'preset-filled-surface-200-800' : 'preset-tonal-primary'} text-xs p-2">
                            <ClipboardListIcon width="0.9rem" height="0.9rem" />
                            {totalRegistrations}/{maxEntries} {$t('registration.your_registrations')}
                        </span>
                    </div>
                    {/if}
                {/if}

                <!-- Existing entries list -->
                {#if entries.length > 0}
                    <div class="space-y-2">
                        {#each entries as entry (entry.id)}
                            {@const filledCount = entry.users.length + (entry.externalParticipants?.length ?? 0)}
                            {@const emptySpots = maxSize > 1 ? maxSize - filledCount : 0}
                            <div class="p-3 border rounded-lg {getStatusBorderClass(entry.status)}" data-testid="registration-entry-{entry.id}">
                                <!-- Row 1: Status + created by you + unregister -->
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <RegistrationStatusBadge status={entry.status} translation={$t} />
                                        {#if entry.creatorId === currentUser?.id && !isUserInEntry(entry)}
                                            <span class="text-xs text-surface-500 italic">{$t('registration.created_by_you')}</span>
                                        {/if}
                                    </div>
                                    {#if canRegisterForCategory(category)}
                                        <div class="relative shrink-0">
                                            <button
                                                type="button"
                                                class="btn-icon btn-icon-sm preset-filled-error-500 rounded-full"
                                                onclick={() => confirmingUnregisterId = confirmingUnregisterId === entry.id ? null : entry.id}
                                                data-testid="unregister-toggle-{entry.id}"
                                            >
                                                <CloseIcon width="0.9rem" height="0.9rem" />
                                            </button>
                                            {#if confirmingUnregisterId === entry.id}
                                                <div
                                                    role="dialog"
                                                    aria-modal="true"
                                                    class="absolute right-0 top-full mt-2 z-50 w-64 bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg shadow-xl overflow-hidden"
                                                    transition:slide={{ duration: 150 }}
                                                >
                                                    <div class="h-1 w-full preset-filled-error-500"></div>
                                                    <div class="p-3 space-y-3">
                                                        <div class="flex items-center gap-2">
                                                            <AlertCircleIcon width="1.2rem" height="1.2rem" class="text-error-500 shrink-0" />
                                                            <p class="text-sm font-semibold">{$t('registration.confirm_unregister_title')}</p>
                                                        </div>
                                                        <p class="text-xs text-surface-600 dark:text-surface-400">{$t('registration.confirm_unregister_message')}</p>
                                                        <div class="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                class="btn btn-sm preset-tonal"
                                                                onclick={() => confirmingUnregisterId = null}
                                                            >
                                                                {$t('registration.cancel')}
                                                            </button>
                                                            <form method="POST" action="?/unregister" use:enhance={() => {
                                                                confirmingUnregisterId = null;
                                                                return async ({ update }) => {
                                                                    await update();
                                                                    await invalidate('data:registration');
                                                                };
                                                            }}>
                                                                <input type="hidden" name="entry_id" value={entry.id} />
                                                                <button
                                                                    type="submit"
                                                                    class="btn btn-sm preset-filled-error-500"
                                                                    data-testid="confirm-unregister"
                                                                >
                                                                    {$t('registration.unregister')}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <!-- Row 2: Avatar stack + names -->
                                <div class="flex items-center gap-3 mt-2">
                                    <div class="flex items-center shrink-0">
                                        {#each entry.users as member, i}
                                            <Avatar class="w-7 h-7 shrink-0 ring-2 ring-white dark:ring-surface-800 {i > 0 ? '-ml-3' : ''}">
                                                <Avatar.Image src={member.image ?? undefined} alt={member.name ?? 'User'} />
                                                <Avatar.Fallback class="text-[0.6rem]">{member.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                            </Avatar>
                                        {/each}
                                        {#each entry.externalParticipants || [] as intent, i}
                                            <div class="w-7 h-7 shrink-0 ring-2 ring-white dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(entry.users.length + i) > 0 ? '-ml-3' : ''}">
                                                <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
                                            </div>
                                        {/each}
                                        {#each { length: emptySpots } as _, i}
                                            <div class="w-7 h-7 shrink-0 ring-2 ring-white dark:ring-surface-800 rounded-full border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center -ml-3">
                                                <AccountOffIcon width="0.9rem" height="0.9rem" class="text-surface-400 dark:text-surface-500" />
                                            </div>
                                        {/each}
                                    </div>
                                    <div class="text-sm flex flex-wrap gap-x-1">
                                        {#each entry.users as member, i}
                                            <span>{member.name}{member.id === currentUser?.id ? ` (${$t('registration.you')})` : ''}{i < filledCount - 1 ? ',' : ''}</span>
                                        {/each}
                                        {#each entry.externalParticipants || [] as intent, i}
                                            <span class="text-warning-600 dark:text-warning-400">{intent.name}{(entry.users.length + i) < filledCount - 1 ? ',' : ''}</span>
                                        {/each}
                                        {#if emptySpots > 0}
                                            <span class="text-surface-400 dark:text-surface-500 italic">
                                                {emptySpots === 1 ? `+ 1 ${$t('registration.empty_spot')}` : `+ ${emptySpots} ${$t('registration.empty_spots')}`}
                                            </span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Queued signups & in-progress team builders -->
                {#each slots as slot (slot.slotId)}
                    {@const slotComplete = isSlotComplete(slot, category)}
                    {#if slotComplete}
                        <!-- Completed queued slot - dashed border -->
                        {@const allNames = [...slot.users.map(u => ({ name: u.name, isUser: true, id: u.id })), ...slot.extParticipantNames.map(n => ({ name: n, isUser: false, id: null })), ...slot.existingExternalParticipants.map(e => ({ name: e.name, isUser: false, id: null }))]}
                        <div class="flex flex-col gap-2 p-3 border-2 border-dashed border-primary-400 dark:border-primary-500 rounded-lg bg-primary-50/30 dark:bg-primary-900/10" transition:slide={{ duration: 200 }}>
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="flex items-center shrink-0">
                                    {#each slot.users as member, i}
                                        <Avatar class="w-7 h-7 shrink-0 ring-2 ring-white dark:ring-surface-800 {i > 0 ? '-ml-3' : ''}">
                                            <Avatar.Image src={member.image ?? undefined} alt={member.name ?? 'User'} />
                                            <Avatar.Fallback class="text-[0.6rem]">{member.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                        </Avatar>
                                    {/each}
                                    {#each slot.extParticipantNames as _, i}
                                        <div class="w-7 h-7 shrink-0 ring-2 ring-white dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(slot.users.length + i) > 0 ? '-ml-3' : ''}">
                                            <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
                                        </div>
                                    {/each}
                                    {#each slot.existingExternalParticipants as _, i}
                                        <div class="w-7 h-7 shrink-0 ring-2 ring-white dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(slot.users.length + slot.extParticipantNames.length + i) > 0 ? '-ml-3' : ''}">
                                            <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
                                        </div>
                                    {/each}
                                </div>
                                <div class="text-sm flex flex-wrap gap-x-1">
                                    {#each allNames as item, i}
                                        {#if item.isUser}
                                            <span>{item.name}{item.id === currentUser?.id ? ` (${$t('registration.you')})` : ''}{i < allNames.length - 1 ? ',' : ''}</span>
                                        {:else}
                                            <span class="text-warning-600 dark:text-warning-400">{item.name}{i < allNames.length - 1 ? ',' : ''}</span>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                            <button
                                type="button"
                                class="btn-icon btn-icon-sm preset-filled-error-500 rounded-full shrink-0"
                                onclick={() => removeSlot(category.id, slot.slotId)}
                            >
                                <CloseIcon width="1.2rem" height="1.2rem" />
                            </button>
                          </div>
                          {#if getAvailableTags(category.id).length > 0}
                            <label class="flex items-center gap-2 text-sm">
                                <span class="text-surface-600 dark:text-surface-300 shrink-0">{$t('registration.tag_label')}</span>
                                <select
                                    class="select select-sm flex-1"
                                    value={slot.claimedTag ?? ''}
                                    onchange={(e) => setSlotTag(category.id, slot.slotId, e.currentTarget.value)}
                                >
                                    <option value="">{$t('registration.tag_none')}</option>
                                    {#each getAvailableTags(category.id) as tagOption}
                                        <option value={tagOption.tag}>
                                            {$t('participant_tags.' + tagOption.tag)}{tagOption.priceOverride != null ? ` — ${tagOption.priceOverride}€` : ''}
                                        </option>
                                    {/each}
                                </select>
                            </label>
                          {/if}
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
                                <CloseIcon width="0.85rem" height="0.85rem" />
                            </button>

                            <!-- Party progress (hidden for individual categories) -->
                            {#if !individual}
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-sm">
                                        {$t(getCategoryTypeSingularName(category.type))}: {totalPartySize}/{maxSize}
                                    </span>
                                    {#if totalPartySize === maxSize}
                                        <CheckCircleIcon width="1rem" height="1rem" class="text-success-500" />
                                    {/if}
                                </div>
                            {/if}

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
                                        <button
                                            type="button"
                                            class="btn btn-sm preset-filled-error-500"
                                            onclick={() => removeTeammate(category.id, slot.slotId, participant.id)}
                                        >
                                            <CloseIcon width="0.8rem" height="0.8rem" />
                                        </button>
                                    </div>
                                {/each}
                                {#each slot.extParticipantNames as intentName, intentIndex}
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center">
                                                <AccountQuestionIcon width="1rem" height="1rem" class="text-warning-700 dark:text-warning-300" />
                                            </div>
                                            <span class="text-sm">{intentName}</span>
                                        </div>
                                        <button
                                            type="button"
                                            class="btn btn-sm preset-filled-error-500"
                                            onclick={() => removeExternalParticipant(category.id, slot.slotId, intentIndex)}
                                        >
                                            <CloseIcon width="0.8rem" height="0.8rem" />
                                        </button>
                                    </div>
                                {/each}
                                {#each slot.existingExternalParticipants as existingIntent}
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center">
                                                <AccountQuestionIcon width="1rem" height="1rem" class="text-warning-700 dark:text-warning-300" />
                                            </div>
                                            <span class="text-sm">{existingIntent.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            class="btn btn-sm preset-filled-error-500"
                                            onclick={() => removeExistingIntent(category.id, slot.slotId, existingIntent.id)}
                                        >
                                            <CloseIcon width="0.8rem" height="0.8rem" />
                                        </button>
                                    </div>
                                {/each}
                                <!-- Empty spot placeholders -->
                                {#each { length: maxSize - totalPartySize } as _}
                                    <div class="flex items-center gap-2 opacity-50">
                                        <div class="w-8 h-8 rounded-full border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center">
                                            <AccountOffIcon width="1rem" height="1rem" class="text-surface-400 dark:text-surface-500" />
                                        </div>
                                        <span class="text-sm italic text-surface-400 dark:text-surface-500">{$t('registration.empty_spot')}</span>
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
                                                            <div class="text-xs text-surface-500 italic">{$t('registration.already_registered')}</div>
                                                        </div>
                                                        <AccountCheckIcon width="1rem" height="1rem" class="text-surface-400" />
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
                                                            <AccountQuestionIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
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
                                                        <AccountPlusOutlineIcon width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
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
                            {@const hasExisting = slots.length > 0 || entries.length > 0}
                            <button
                                type="button"
                                class="btn {hasExisting ? 'preset-tonal-success' : 'preset-filled-success-500'} w-full sm:w-auto"
                                onclick={() => isUserInCategory(category.id) ? addIndividualSlotForOther(category.id) : addIndividualSignup(category.id)}
                            >
                                <AccountPlusIcon width="1.2rem" height="1.2rem" />
                                {hasExisting ? $t('registration.add_another') : $t('registration.sign_up')}
                            </button>
                        {:else}
                            {@const hasExisting = slots.length > 0 || entries.length > 0}
                            {@const isPairs = category.type === 'PAIRS' || category.type === 'JUNIOR_PAIRS'}
                            <button
                                type="button"
                                class="btn {hasExisting ? 'preset-tonal-success' : 'preset-filled-success-500'} w-full sm:w-auto"
                                onclick={() => addGroupSlot(category.id)}
                            >
                                {#if isPairs}<AccountMultipleIcon width="1.2rem" height="1.2rem" />{:else}<AccountGroupIcon width="1.2rem" height="1.2rem" />{/if}
                                {hasExisting
                                    ? (isPairs ? $t('registration.build_another_pair') : $t('registration.build_another_team'))
                                    : (isPairs ? $t('registration.build_pair') : $t('registration.build_team'))}
                            </button>
                        {/if}
                    {:else}
                        <p class="text-sm text-surface-500 italic flex items-center gap-1">
                            <InformationOutlineIcon width="1rem" height="1rem" />
                            {$t('registration.limit_reached')}
                        </p>
                    {/if}
                {:else if entries.length === 0 && slots.length === 0}
                    <p class="text-sm text-surface-500 italic">{$t('registration.registration_not_available')}</p>
                {/if}
            </Card>
        {/each}
    </div>

    <!-- Submit all signups -->
    {#if hasNewSignups}
        <div class="sticky bottom-4 mt-6 z-30" transition:slide={{ duration: 200 }}>
            <form bind:this={submitFormEl} method="POST" action="?/signup" use:enhance={() => {
                isSubmitting = true;
                const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
                return async ({ result, update }) => {
                    await minLoadingTime;
                    isSubmitting = false;
                    if (result.type === 'success' && result.data) {
                        const data = result.data as { success: boolean; summary?: RegistrationSummary };
                        if (data.success && data.summary) {
                            const s = data.summary;
                            const catHeader = $t('registration.toast_category_header');
                            const entHeader = $t('registration.toast_entries_header');
                            const rows = s.perCategory.map(c =>
                                `<tr><td class="py-0.5">${$t(getCategoryTypeName(c.type))}</td><td class="py-0.5 text-right font-medium">${c.count}</td></tr>`
                            ).join('');
                            const totalRow = s.perCategory.length > 1
                                ? `<tr class="border-t border-surface-300 dark:border-surface-600"><td class="pt-1 font-semibold">Total</td><td class="pt-1 text-right font-semibold">${s.totalEntries}</td></tr>`
                                : '';
                            const html = `<table class="w-full text-left"><thead><tr class="border-b border-surface-300 dark:border-surface-600"><th class="pb-1 font-medium">${catHeader}</th><th class="pb-1 font-medium text-right">${entHeader}</th></tr></thead><tbody>${rows}${totalRow}</tbody></table>`;
                            showRichSuccessToast($t('registration.toast_success_title'), html);
                            clearAllSignupState();
                            await invalidate('data:registration');
                        } else {
                            showErrorToast($t('registration.toast_error_title'), (result.data as any).message || '');
                        }
                    } else if (result.type === 'failure') {
                        showErrorToast($t('registration.toast_error_title'), (result.data as any)?.message || '');
                    }
                    await update({ reset: false });
                };
            }}>
                <input type="hidden" name="signups" value={JSON.stringify(buildSignupPayload())} />
                <div class="bg-surface-50 dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3 relative">
                    <!-- Summary table -->
                    <div class="text-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <ClipboardCheckOutlineIcon width="1.1rem" height="1.1rem" class="text-primary-500" />
                            <span class="font-medium">{totalNewSignups()} {$t('registration.new_registrations_summary')}</span>
                        </div>
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="border-b border-surface-300 dark:border-surface-600">
                                    <th class="pb-1 font-medium">{$t('registration.toast_category_header')}</th>
                                    <th class="pb-1 font-medium text-right">{$t('registration.toast_entries_header')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each signupSummary() as item}
                                    <tr>
                                        <td class="py-0.5">{item.type}</td>
                                        <td class="py-0.5 text-right font-medium">{item.count}</td>
                                    </tr>
                                {/each}
                                {#if signupSummary().length > 1}
                                    <tr class="border-t border-surface-300 dark:border-surface-600">
                                        <td class="pt-1 font-semibold">Total</td>
                                        <td class="pt-1 text-right font-semibold">{totalNewSignups()}</td>
                                    </tr>
                                {/if}
                            </tbody>
                        </table>
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
                        {#if !allPartiesSubmittable()}
                            <span class="text-xs opacity-75">({$t('registration.empty_parties')})</span>
                        {:else if !allPartiesComplete()}
                            <span class="text-xs opacity-75">({$t('registration.incomplete_parties')})</span>
                        {/if}
                    </button>

                    <!-- Payment warning popover -->
                    {#if showPaymentPopover}
                        {@const breakdown = paymentFeeBreakdown()}
                        {@const waitlistedPaid = waitlistedPaidCategories()}
                        {@const hasPaymentItems = breakdown.items.length > 0}
                        <div
                            role="dialog"
                            aria-modal="true"
                            class="absolute bottom-full left-0 right-0 mb-2 z-50 card {waitlistedPaid.length > 0 ? 'bg-error-50 dark:bg-error-950 border-2 border-error-300 dark:border-error-700' : 'bg-warning-50 dark:bg-warning-950 border-2 border-warning-300 dark:border-warning-700'} shadow-xl overflow-hidden"
                            transition:slide={{ duration: 200 }}
                            data-testid="registration-warning-popover"
                        >
                            <div class="h-1 w-full {waitlistedPaid.length > 0 ? 'preset-filled-error-500' : 'preset-filled-warning-500'}"></div>
                            <div class="p-4 space-y-3">
                                <!-- Waitlist warning section -->
                                {#if waitlistedPaid.length > 0}
                                    <div class="flex items-center gap-2">
                                        <AlertCircleIcon width="1.3rem" height="1.3rem" class="text-error-500" />
                                        <p class="text-sm font-semibold">{$t('registration.waitlist_warning_title')}</p>
                                    </div>
                                    <p class="text-xs text-error-600 dark:text-error-400">
                                        {$t('registration.waitlist_warning_message')}
                                    </p>
                                    <ul class="list-disc list-inside text-xs text-error-600 dark:text-error-400">
                                        {#each waitlistedPaid as { name, waitlistedCount }}
                                            <li>{name} — {$t('registration.waitlist_warning_entry_count', { count: waitlistedCount })}</li>
                                        {/each}
                                    </ul>
                                    <p class="text-xs font-semibold text-error-700 dark:text-error-300">
                                        {$t('registration.waitlist_warning_do_not_pay')}
                                    </p>
                                {/if}

                                <!-- Payment warning section (only for non-full paid categories) -->
                                {#if hasPaymentItems}
                                    {#if waitlistedPaid.length > 0}
                                        <hr class="border-surface-300 dark:border-surface-600" />
                                    {/if}
                                    <div class="flex items-center gap-2">
                                        <AlertCircleIcon width="1.3rem" height="1.3rem" class="text-warning-500" />
                                        <p class="text-sm font-semibold">{$t('registration.payment_warning_title')}</p>
                                    </div>
                                    <p class="text-xs text-warning-600 dark:text-warning-400">
                                        {$t('registration.pending_confirmation_not_guaranteed')}
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
                                    {#if hasClaimedPricedTag()}
                                        <p class="text-xs text-warning-700 dark:text-warning-300">
                                            {$t('registration.tag_price_reconcile_warning')}
                                        </p>
                                    {/if}
                                {/if}

                                <div class="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        class="btn btn-sm preset-tonal"
                                        onclick={() => { showPaymentPopover = false; }}
                                    >
                                        <CloseIcon width="1rem" height="1rem" />
                                        {$t('registration.payment_warning_cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        class="btn btn-sm {waitlistedPaid.length > 0 && !hasPaymentItems ? 'preset-filled-error-500' : 'preset-filled-warning-500'}"
                                        onclick={() => { showPaymentPopover = false; }}
                                        data-testid="payment-warning-confirm"
                                    >
                                        <CheckIcon width="1rem" height="1rem" />
                                        {waitlistedPaid.length > 0 && !hasPaymentItems
                                            ? $t('registration.waitlist_warning_confirm')
                                            : $t('registration.payment_warning_confirm')}
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
