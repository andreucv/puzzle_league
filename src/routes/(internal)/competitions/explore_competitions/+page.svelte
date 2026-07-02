<script lang="ts">
    import Icon from "@iconify/svelte";
    import FilterToggleIcon from '@iconify-svelte/mdi/filter-variant';
    import PlusIcon from '@iconify-svelte/mdi/plus';
    import { t } from '$lib/translations';
    import SearchInput from "$lib/components/common/SearchInput.svelte";
    import FilterTabs from "./components/FilterTabs.svelte";
    import SmartPresetChips from "./components/SmartPresetChips.svelte";
    import CompetitionCard from "$lib/components/competition/CompetitionCard.svelte";
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import type { RoleAssignment } from '$prisma/browser';

    let { data } = $props();

    const competitions = $derived(data.competitions);
    const user = $derived(data.user);
    const registeredCategoryIds = $derived(data.registeredCategoryIds as number[]);

    // User has location set if both country and postal code are present
    const hasUserLocation = $derived(Boolean(user?.country && user?.postalCode));
    // Set of registered category IDs for quick lookup
    const registeredCategorySet = $derived(new Set(registeredCategoryIds));
    const hasRegistrations = $derived(registeredCategoryIds.length > 0);
    // Search filter
    let filter = $state('');

    // A NOT_STARTED competition whose start date has already passed is stale and
    // must not be shown as upcoming (matches the homepage "Other Upcoming" feed).
    const isUpcoming = (c: { status: string; startDate: string | Date }) =>
        c.status === 'NOT_STARTED' && new Date(c.startDate) >= new Date();

    // Tab state - default to Upcoming, but fall back to All when there are no
    // upcoming competitions so arrival never shows an empty "No competitions found".
    // svelte-ignore state_referenced_locally -- initial default only; tab is user-driven afterwards
    let activeTab = $state<string>(
        competitions.filter(isUpcoming).length > 0 ? 'NOT_STARTED' : 'ALL'
    );

    // Smart preset filters
    let activePresets = $state<string[]>([]);
    let showPresets = $state(false);
    const activePresetCount = $derived(activePresets.length);

    // Tab definitions with counts — labels match CompetitionStatusChip
    const tabs = $derived([
        { id: 'ALL', label: $t('manage_registrations.all'), count: competitions.length },
        { id: 'NOT_STARTED', label: $t('competition_status.upcoming'), count: competitions.filter(isUpcoming).length },
        { id: 'STARTED', label: $t('competition_status.live'), count: competitions.filter(c => c.status === 'STARTED').length },
        { id: 'FINISHED', label: $t('competition_status.finished'), count: competitions.filter(c => c.status === 'FINISHED').length },
        { id: 'CANCELLED', label: $t('competition_status.cancelled'), count: competitions.filter(c => c.status === 'CANCELLED').length },
    ]);

    // Smart preset definitions
    const presets = $derived([
        { id: 'this-week', label: $t('manage_registrations.7-days'), icon: 'mdi:calendar-week' },
        { id: 'this-month', label: $t('manage_registrations.30-days'), icon: 'mdi:calendar-week' },
        { id: 'registered', label: $t('registration.registered'), icon: 'mdi:account-check', disabled: !hasRegistrations },
        { id: 'near-me', label: $t('manage_registrations.near-me'), icon: 'mdi:map-marker-radius', disabled: !hasUserLocation },
        { id: 'open-registration', label: $t('manage_registrations.open'), icon: 'mdi:door-open' },
    ]);

    // Filtered competitions based on all filters
    const filteredCompetitions = $derived.by(() => {
        let result = [...competitions];
        const searchQuery = filter.trim().toLowerCase();

        // Tab filter (status). The Upcoming tab additionally excludes past-dated
        // NOT_STARTED competitions so stale entries are not advertised as upcoming.
        // Skipped while searching so a known name is found regardless of status.
        if (!searchQuery) {
            if (activeTab === 'NOT_STARTED') {
                result = result.filter(isUpcoming);
            } else if (activeTab !== 'ALL') {
                result = result.filter(c => c.status === activeTab);
            }
        }

        // Search filter (across all statuses)
        if (searchQuery) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(searchQuery) ||
                c.location?.toLowerCase().includes(searchQuery)
            );
        }

        // Smart preset filters
        if (activePresets.includes('this-week')) {
            const today = new Date();
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            result = result.filter(c => {
                const startDate = new Date(c.startDate);
                return startDate >= today && startDate <= weekFromNow;
            });
        }

        if (activePresets.includes('this-month')) {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            result = result.filter(c => {
                const startDate = new Date(c.startDate);
                return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
            });
        }

        if (activePresets.includes('near-me') && user?.country && user?.postalCode) {
            result = result.filter(c =>
                c.country === user.country &&
                c.postalCode?.substring(0, 2) === user.postalCode!.substring(0, 2)
            );
        }

        if (activePresets.includes('registered')) {
            result = result.filter(c =>
                c.categories?.some(cat => registeredCategorySet.has(cat.id))
            );
        }

        if (activePresets.includes('open-registration')) {
            result = result.filter(c => c.registrationOpen && c.status === 'NOT_STARTED');
        }

        return result;
    });

    // Computed counts
    const filteredCount = $derived(filteredCompetitions.length);
    const totalCount = $derived(competitions.length);
</script>

<GenericTitle text={$t('competitions.explore_competitions')} />

<div class="space-y-4">
    <!-- Search + filter toggle -->
    <div class="flex items-stretch gap-2">
        <div class="flex-1">
            <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter testId="competition-search-input" />
        </div>
        <button
            type="button"
            data-testid="filter-toggle"
            class="relative shrink-0 px-3 rounded-lg transition-all duration-200 flex items-center
                {showPresets || activePresetCount > 0
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                    : 'preset-filled-surface-200-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'}"
            onclick={() => showPresets = !showPresets}
        >
            <FilterToggleIcon width="1.25rem" height="1.25rem" />
            {#if activePresetCount > 0}
                <span class="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary-500 text-white">
                    {activePresetCount}
                </span>
            {/if}
        </button>
    </div>

    <!-- Status tabs (single scrollable row) -->
    <FilterTabs {tabs} bind:activeTab />

    <!-- Smart preset chips (collapsible) -->
    {#if showPresets}
        <SmartPresetChips {presets} bind:activePresets />
    {/if}

    <!-- Results count & Create button -->
    <div class="flex items-center justify-between">
        <span class="text-sm text-surface-600 dark:text-surface-400" data-testid="results-count">
            {filteredCount} {filteredCount === 1 ? $t('explore_competitions.competition_singular') : $t('explore_competitions.competition_plural')}
            {#if filter || activePresets.length > 0}
                <span class="text-surface-500"> of {totalCount}</span>
            {/if}
        </span>
        {#if user?.roleAssignments?.some((role: RoleAssignment) => role.role === 'ORGANIZER')}
            <a class="btn btn-sm preset-filled-primary-500" href="/competition/edit">
                <PlusIcon width="1rem" height="1rem" class="mr-1" />
                {$t('competitions.create_competition')}
            </a>
        {/if}
    </div>

    <!-- User location hint if not set -->
    {#if !hasUserLocation}
        <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Icon icon="mdi:information-outline" class="w-4 h-4 text-primary-500" />
                <span>
                    {$t('explore_competitions.near_me_goto_profile_1')} <a href="/profile" class="text-primary-600 dark:text-primary-400 hover:underline">{$t('explore_competitions.near_me_goto_profile_2')}</a> {$t('explore_competitions.near_me_goto_profile_3')}.
                </span>
            </div>
        </div>
    {/if}

    <!-- Competition cards -->
    <div class="space-y-2" data-testid="competition-list">
        {#each filteredCompetitions as competition (competition.id)}
            <CompetitionCard {competition} currentUserId={user?.id} userCountry={user?.country ?? null} userPostalCode={user?.postalCode ?? null} />
        {:else}
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Icon icon="mdi:magnify-remove-outline" class="w-16 h-16 text-surface-300 dark:text-surface-600 mb-4" />
                <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">
                    {$t('explore_competitions.no_competitions_found')}
                </h3>
                <p class="text-sm text-surface-500 dark:text-surface-400 max-w-xs">
                    {#if filter || activePresets.length > 0}
                        {$t('explore_competitions.no_competitions_found_for_filters')}
                    {:else}
                        {$t('explore_competitions.no_competitions_found')}
                    {/if}
                </p>
                {#if filter || activePresets.length > 0}
                    <button
                        type="button"
                        class="btn btn-sm preset-outlined-primary-500 mt-4"
                        onclick={() => { filter = ''; activePresets = []; activeTab = 'ALL'; }}
                        data-testid="clear-filters"
                    >
                        {$t('explore_competitions.clear_all_filters')}
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>
