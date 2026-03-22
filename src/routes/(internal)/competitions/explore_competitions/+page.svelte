<script lang="ts">
    import Icon from "@iconify/svelte";
    import PlusIcon from '@iconify-svelte/mdi/plus';
    import { t } from '$lib/translations';
    import SearchInput from "$lib/components/SearchInput.svelte";
    import FilterTabs from "$lib/components/FilterTabs.svelte";
    import SmartPresetChips from "$lib/components/SmartPresetChips.svelte";
    import CompetitionCard from "$lib/components/competition/CompetitionCard.svelte";
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import type { RoleAssignment } from '$lib/.prisma/generated/prisma/browser';

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

    // Tab state - default to NOT_STARTED
    let activeTab = $state<string>('NOT_STARTED');

    // Smart preset filters
    let activePresets = $state<string[]>([]);

    // Tab definitions with counts
    const tabs = $derived([
        { id: 'ALL', label: $t('manage_inscriptions.all'), count: competitions.length },
        { id: 'NOT_STARTED', label: $t('manage_inscriptions.soon'), count: competitions.filter(c => c.status === 'NOT_STARTED').length },
        { id: 'STARTED', label: $t('manage_inscriptions.live'), count: competitions.filter(c => c.status === 'STARTED').length },
        { id: 'FINISHED', label: $t('manage_inscriptions.past'), count: competitions.filter(c => c.status === 'FINISHED' || c.status === 'CANCELLED').length },
    ]);

    // Smart preset definitions
    const presets = $derived([
        { id: 'this-week', label: $t('manage_inscriptions.7-days'), icon: 'mdi:calendar-week' },
        { id: 'this-month', label: $t('manage_inscriptions.30-days'), icon: 'mdi:calendar-week' },
        { id: 'registered', label: $t('inscription.registered'), icon: 'mdi:account-check', disabled: !hasRegistrations },
        { id: 'near-me', label: $t('manage_inscriptions.near-me'), icon: 'mdi:map-marker-radius', disabled: !hasUserLocation },
        { id: 'open-registration', label: $t('manage_inscriptions.open'), icon: 'mdi:door-open' },
    ]);

    // Filtered competitions based on all filters
    const filteredCompetitions = $derived.by(() => {
        let result = [...competitions];

        // Tab filter (status)
        if (activeTab !== 'ALL') {
            if (activeTab === 'FINISHED') {
                result = result.filter(c => c.status === 'FINISHED' || c.status === 'CANCELLED');
            } else {
                result = result.filter(c => c.status === activeTab);
            }
        }

        // Search filter
        if (filter.trim()) {
            const searchLower = filter.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(searchLower) ||
                c.location?.toLowerCase().includes(searchLower)
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
    <!-- Search -->
    <SearchInput placeholder={$t('list_competitions.look_for_competition')} bind:filter />

    <!-- Status tabs -->
    <FilterTabs {tabs} bind:activeTab />

    <!-- Smart preset chips -->
    <SmartPresetChips {presets} bind:activePresets />

    <!-- Results count & Create button -->
    <div class="flex items-center justify-between">
        <span class="text-sm text-surface-600 dark:text-surface-400">
            {filteredCount} {filteredCount === 1 ? 'competition' : 'competitions'}
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
    <div class="space-y-2">
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
                    >
                        {$t('explore_competitions.clear_all_filters')}
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>
