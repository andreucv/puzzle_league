<script lang="ts">
    import type { User, Category, CategoryType } from '@prisma/client';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import { getCategoryTypeName, getCategoryTypeIcon } from '$lib/utils/category_utils';
    import { formatTime } from '$lib/utils/datetime_utils';
    import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';

    let { data } = $props();

    let currentUser = $derived(data.user);
    let competition = $derived(data.competition);
    let categories = $derived(competition?.categories || []);
    let existingRecords = $derived(data.existingRecords || []);

    let canRegister = $derived(competition?.registrationOpen && competition?.status === 'NOT_STARTED');

    // Signups state: categoryId -> User[] (including current user)
    let signups: Map<number, User[]> = $state(new Map());

    // Search state per category
    let searchQueries: Map<number, string> = $state(new Map());
    let searchResults: Map<number, User[]> = $state(new Map());

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

    // Check if user is already registered for a category (PENDING or ACCEPTED)
    function getExistingRecord(categoryId: number) {
        return existingRecords.find((r: any) => r.categoryId === categoryId && (r.status === 'PENDING' || r.status === 'ACCEPTED'));
    }

    // Check if user has a REFUSED record (can re-register)
    function getRefusedRecord(categoryId: number) {
        return existingRecords.find((r: any) => r.categoryId === categoryId && r.status === 'REFUSED');
    }

    // Get status badge classes
    function getStatusBadgeClasses(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'preset-filled-success-500';
            case 'PENDING': return 'preset-filled-warning-500';
            case 'REFUSED': return 'preset-filled-error-500';
            default: return 'preset-tonal';
        }
    }

    function getStatusIcon(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'mdi:check-circle';
            case 'PENDING': return 'mdi:clock-outline';
            case 'REFUSED': return 'mdi:close-circle';
            default: return 'mdi:help-circle';
        }
    }

    // Check if a signup has been started for a category
    function getSignup(categoryId: number): User[] {
        return signups.get(categoryId) || [];
    }

    function isSignupStarted(categoryId: number): boolean {
        return signups.has(categoryId);
    }

    // Toggle individual signup
    function toggleIndividualSignup(categoryId: number) {
        if (signups.has(categoryId)) {
            const next = new Map(signups);
            next.delete(categoryId);
            signups = next;
        } else {
            const next = new Map(signups);
            next.set(categoryId, [currentUser as User]);
            signups = next;
        }
    }

    // Start group signup (auto-adds current user)
    function startGroupSignup(categoryId: number) {
        const next = new Map(signups);
        next.set(categoryId, [currentUser as User]);
        signups = next;
    }

    // Cancel signup for a category
    function cancelSignup(categoryId: number) {
        const next = new Map(signups);
        next.delete(categoryId);
        signups = next;
        // Clear search state
        const nextQueries = new Map(searchQueries);
        nextQueries.delete(categoryId);
        searchQueries = nextQueries;
        const nextResults = new Map(searchResults);
        nextResults.delete(categoryId);
        searchResults = nextResults;
    }

    // Add a teammate to a category signup
    function addTeammate(categoryId: number, user: User) {
        const current = signups.get(categoryId) || [];
        const next = new Map(signups);
        next.set(categoryId, [...current, user]);
        signups = next;
        // Clear search
        const nextQueries = new Map(searchQueries);
        nextQueries.delete(categoryId);
        searchQueries = nextQueries;
        const nextResults = new Map(searchResults);
        nextResults.delete(categoryId);
        searchResults = nextResults;
    }

    // Remove a teammate from signup
    function removeTeammate(categoryId: number, userId: string) {
        const current = signups.get(categoryId) || [];
        const next = new Map(signups);
        next.set(categoryId, current.filter(u => u.id !== userId));
        signups = next;
    }

    // Search users for a category
    async function searchUsers(categoryId: number, query: string) {
        if (query.length < 2) {
            const nextResults = new Map(searchResults);
            nextResults.delete(categoryId);
            searchResults = nextResults;
            return;
        }

        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) return;
            const result = await response.json();

            const currentTeam = signups.get(categoryId) || [];
            const filtered = result.users?.filter((user: User) =>
                user.id !== currentUser?.id &&
                !currentTeam.find(t => t.id === user.id)
            ).slice(0, 5) || [];

            const nextResults = new Map(searchResults);
            nextResults.set(categoryId, filtered);
            searchResults = nextResults;
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }

    function handleSearchInput(categoryId: number, value: string) {
        const nextQueries = new Map(searchQueries);
        nextQueries.set(categoryId, value);
        searchQueries = nextQueries;

        // Debounce search
        if (searchTimers.has(categoryId)) {
            clearTimeout(searchTimers.get(categoryId));
        }
        searchTimers.set(categoryId, setTimeout(() => {
            searchUsers(categoryId, value);
        }, 300));
    }

    // Derived: are all started signups complete?
    let hasNewSignups = $derived(signups.size > 0);
    let allPartiesComplete = $derived(() => {
        for (const [categoryId, users] of signups) {
            const category = categories.find((c: Category) => c.id === categoryId);
            if (!category) return false;
            const maxSize = category.maxPartySize || 1;
            if (users.length !== maxSize) return false;
        }
        return true;
    });
    let canSubmit = $derived(hasNewSignups && allPartiesComplete());

    // Build the signup payload
    function buildSignupPayload() {
        const payload: { categoryId: number; teammateIds: string[] }[] = [];
        for (const [categoryId, users] of signups) {
            // teammateIds includes ALL party members (current user + teammates)
            // signUpUsersToCompetition expects teammateIds to NOT include currentUser
            // since it adds currentUserId separately — let's check the DB function...
            // Actually looking at the code: allPartyUserIds = [currentUserId, ...signup.teammateIds]
            // So teammateIds should NOT include the current user
            const teammateIds = users
                .filter(u => u.id !== currentUser?.id)
                .map(u => u.id);
            payload.push({ categoryId, teammateIds });
        }
        return payload;
    }



    // Is individual category (maxPartySize === 1)?
    function isIndividual(category: Category): boolean {
        return (category.maxPartySize || 1) === 1;
    }
</script>

<div class="container mx-auto max-w-4xl relative">
    <LoadingOverlay show={isSubmitting} message={$t('inscription.submitting') || 'Submitting registrations...'} />

    <!-- Header -->
    <div class="space-y-4 mb-6">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('inscription.title')}/>
        <CompetitionTitle title={competition.name} />

        {#if !canRegister}
            <div class="alert preset-filled-warning-500 p-4 rounded-lg">
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
            {@const existingRecord = getExistingRecord(category.id)}
            {@const refusedRecord = getRefusedRecord(category.id)}
            {@const signup = getSignup(category.id)}
            {@const signupActive = isSignupStarted(category.id)}
            {@const maxSize = category.maxPartySize || 1}
            {@const individual = isIndividual(category)}
            {@const query = searchQueries.get(category.id) || ''}
            {@const results = searchResults.get(category.id) || []}

            <div class="card preset-outlined-surface-200-800 p-4">
                <!-- Category header -->
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="h4 font-semibold flex items-center gap-2">
                            <Icon icon={getCategoryTypeIcon(category.type)} width="1.5rem" height="1.5rem" class="text-primary-800" />
                            {getCategoryTypeName(category.type)}
                        </h3>
                        {#if category.description && category.description !== getCategoryTypeName(category.type).toUpperCase()}
                            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">{category.description}</p>
                        {/if}
                    </div>
                    <div class="text-sm text-surface-500 flex items-center gap-1">
                        <Icon icon="mdi:account-multiple" width="1rem" height="1rem" />
                        <span>{maxSize} {maxSize === 1 ? $t('inscription.participant') : $t('inscription.participants')}</span>
                    </div>
                </div>

                <!-- Time info -->
                <div class="text-sm text-surface-600 dark:text-surface-400 flex gap-4 mb-4">
                    <div class="flex items-center gap-1">
                        <Icon icon="mdi:clock-start" width="1rem" height="1rem" />
                        <span>{formatTime(new Date(category.startTime))}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <Icon icon="mdi:clock-end" width="1rem" height="1rem" />
                        <span>{formatTime(new Date(category.endTime))}</span>
                    </div>
                </div>

                <!-- Puzzles -->
                {#if category.puzzles && category.puzzles.length > 0}
                    <div class="flex flex-wrap gap-2 mb-4">
                        {#each category.puzzles as puzzle}
                            <span class="badge preset-tonal-primary text-xs flex items-center gap-1 p-2">
                                <Icon icon="mdi:puzzle-outline" width="0.8rem" height="0.8rem" />
                                <span>{puzzle.pieces} pcs - {puzzle.brand}</span>
                            </span>
                        {/each}
                    </div>
                {/if}

                <!-- Already registered (PENDING or ACCEPTED) -->
                {#if existingRecord}
                    <div class="p-3 {existingRecord.status === 'ACCEPTED' ? 'bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700' : 'bg-warning-50 dark:bg-warning-900/20 border-warning-300 dark:border-warning-700'} border rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <Icon icon={getStatusIcon(existingRecord.status)} width="1.2rem" height="1.2rem" class={existingRecord.status === 'ACCEPTED' ? 'text-success-600' : 'text-warning-600'} />
                                <span class="font-semibold {existingRecord.status === 'ACCEPTED' ? 'text-success-700 dark:text-success-400' : 'text-warning-700 dark:text-warning-400'}">
                                    {$t('inscription.registered')}
                                </span>
                                <span class="badge {getStatusBadgeClasses(existingRecord.status)} text-xs">
                                    {$t(`inscription.status_${existingRecord.status.toLowerCase()}`)}
                                </span>
                            </div>
                            {#if canRegister}
                                <form method="POST" action="?/unregister" use:enhance={() => {
                                    return async ({ update }) => {
                                        await update();
                                        await invalidateAll();
                                    };
                                }}>
                                    <input type="hidden" name="category_id" value={category.id} />
                                    <button type="submit" class="btn btn-sm preset-filled-error-500">
                                        <Icon icon="mdi:account-minus" width="1rem" height="1rem" />
                                        {$t('inscription.unregister')}
                                    </button>
                                </form>
                            {/if}
                        </div>
                        <!-- Show team members -->
                        <div class="flex flex-wrap gap-2">
                            {#each existingRecord.users as member}
                                <div class="flex items-center gap-1 badge preset-tonal-primary p-2">
                                    <Avatar class="w-6 h-6">
                                        <Avatar.Image src={member.image ?? undefined} alt={member.name ?? 'User'} />
                                        <Avatar.Fallback>{member.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                    </Avatar>
                                    <span class="text-sm">{member.name}</span>
                                </div>
                            {/each}
                        </div>
                    </div>

                <!-- Previously refused — allow re-registration -->
                {:else if refusedRecord && canRegister}
                    <div class="p-3 bg-error-50 dark:bg-error-900/20 border border-error-300 dark:border-error-700 rounded-lg mb-3">
                        <div class="flex items-center gap-2">
                            <Icon icon="mdi:close-circle" width="1.2rem" height="1.2rem" class="text-error-600" />
                            <span class="text-sm text-error-700 dark:text-error-400">{$t('inscription.previously_refused')}</span>
                        </div>
                    </div>
                    {#if !signupActive}
                        {#if individual}
                            <button
                                type="button"
                                class="btn preset-filled-success-500 w-full sm:w-auto"
                                onclick={() => toggleIndividualSignup(category.id)}
                            >
                                <Icon icon="mdi:account-plus" width="1.2rem" height="1.2rem" />
                                {$t('inscription.sign_up_again')}
                            </button>
                        {:else}
                            <button
                                type="button"
                                class="btn preset-filled-success-500 w-full sm:w-auto"
                                onclick={() => startGroupSignup(category.id)}
                            >
                                <Icon icon="mdi:account-group" width="1.2rem" height="1.2rem" />
                                {$t('inscription.sign_up_again')}
                            </button>
                        {/if}
                    {/if}

                <!-- Signup form -->
                {:else if canRegister}
                    {#if !signupActive}
                        <!-- Not started: show signup button -->
                        {#if individual}
                            <button
                                type="button"
                                class="btn preset-filled-success-500 w-full sm:w-auto"
                                onclick={() => toggleIndividualSignup(category.id)}
                            >
                                <Icon icon="mdi:account-plus" width="1.2rem" height="1.2rem" />
                                {$t('inscription.sign_up')}
                            </button>
                        {:else}
                            <button
                                type="button"
                                class="btn preset-filled-success-500 w-full sm:w-auto"
                                onclick={() => startGroupSignup(category.id)}
                            >
                                <Icon icon="mdi:account-group" width="1.2rem" height="1.2rem" />
                                {$t('inscription.build_team')}
                            </button>
                        {/if}
                    {:else}
                        <!-- Signup in progress -->
                        <div class="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-300 dark:border-warning-700 rounded-lg relative">
                            <!-- Cancel button -->
                            <button
                                type="button"
                                class="absolute -top-2 -right-2 w-6 h-6 bg-error-500 hover:bg-error-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
                                onclick={() => cancelSignup(category.id)}
                                title={$t('inscription.cancel')}
                            >
                                ✕
                            </button>

                            <!-- Party progress -->
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-sm font-medium">
                                    {$t('inscription.team_progress')}: {signup.length}/{maxSize}
                                </span>
                                {#if signup.length === maxSize}
                                    <Icon icon="mdi:check-circle" width="1rem" height="1rem" class="text-success-500" />
                                {/if}
                            </div>

                            <!-- Selected participants -->
                            <div class="space-y-2 mb-3">
                                {#each signup as participant, index}
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
                                                onclick={() => removeTeammate(category.id, participant.id)}
                                            >
                                                <Icon icon="mdi:close" width="0.8rem" height="0.8rem" />
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>

                            <!-- Search for teammates (only for group categories when not full) -->
                            {#if !individual && signup.length < maxSize}
                                <div class="relative">
                                    <input
                                        type="text"
                                        value={query}
                                        oninput={(e) => handleSearchInput(category.id, (e.target as HTMLInputElement).value)}
                                        placeholder={$t('inscription.search_placeholder')}
                                        class="input w-full text-sm"
                                    />

                                    {#if results.length > 0}
                                        <div class="absolute z-20 w-full bottom-full mb-1 bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {#each results as user}
                                                <button
                                                    type="button"
                                                    onclick={() => addTeammate(category.id, user)}
                                                    class="w-full p-2 text-left hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center gap-2 border-b border-surface-200 dark:border-surface-700 last:border-b-0"
                                                >
                                                    <Avatar class="w-6 h-6">
                                                        <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                                                        <Avatar.Fallback>{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                                                    </Avatar>
                                                    <div class="text-sm">
                                                        <div class="font-medium">{user.name}</div>
                                                    </div>
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}

                <!-- Registration not available -->
                {:else}
                    <p class="text-sm text-surface-500 italic">{$t('inscription.registration_not_available')}</p>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Submit all signups -->
    {#if hasNewSignups}
        <div class="sticky bottom-4 mt-6 z-30">
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
                            signups = new Map();
                            searchQueries = new Map();
                            searchResults = new Map();
                            await invalidateAll();
                        }
                    } else if (result.type === 'failure') {
                        showResultMessage({ success: false, message: 'An error occurred' });
                    }
                    await update({ reset: false });
                };
            }}>
                <input type="hidden" name="signups" value={JSON.stringify(buildSignupPayload())} />
                <button
                    type="submit"
                    class="btn preset-filled-primary-500 w-full shadow-lg"
                    disabled={!canSubmit || isSubmitting}
                >
                    <Icon icon="mdi:check-all" width="1.2rem" height="1.2rem" />
                    {$t('inscription.submit_all')}
                    {#if !allPartiesComplete()}
                        <span class="text-xs opacity-75">({$t('inscription.incomplete_parties')})</span>
                    {/if}
                </button>
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
