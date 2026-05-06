<script lang="ts">
    import { t } from '$lib/translations';
    import LockOpenIcon from '@iconify-svelte/mdi/lock-open-variant-outline';
    import LockIcon from '@iconify-svelte/mdi/lock-outline';
    import PlayCircleIcon from '@iconify-svelte/mdi/play-circle-outline';
    import CategoryRegistrationChip from '$lib/components/category/CategoryRegistrationChip.svelte';
    import { Slider } from '@skeletonlabs/skeleton-svelte';

    interface CategoryEntry {
        type: string;
        entryStatus: string | null;
    }

    interface CompetitionEntry {
        id: number;
        name: string;
        startDate: Date;
        registrationOpen: boolean;
        status: string;
        categories: CategoryEntry[];
    }

    let { registrations }: { registrations: CompetitionEntry[] } = $props();

    function formatDate(date: Date): string {
        return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
</script>

<div class="space-y-2">
    {#each registrations as competition (competition.id)}
        <a href="/competitions/competition_details/{competition.id}" class="block hover:opacity-90 transition-opacity">
            <div class="card p-3 min-w-0">
                <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-medium truncate">{competition.name}</p>
                    <div class="flex items-center gap-2 shrink-0">
                        {#if competition.status === 'STARTED'}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 rounded-full text-xs font-medium">
                                <PlayCircleIcon width="0.85rem" height="0.85rem" />
                                Live
                            </span>
                        {:else}
                            <span class="text-xs opacity-50">{formatDate(competition.startDate)}</span>
                        {/if}
                        {#if competition.registrationOpen}
                            <span class="text-success-500" title={$t('landing_page.registration_status.registration_open')}>
                                <LockOpenIcon width="1rem" height="1rem" />
                            </span>
                        {:else}
                            <span class="text-error-500" title={$t('landing_page.registration_status.registration_closed')}>
                                <LockIcon width="1rem" height="1rem" />
                            </span>
                        {/if}
                    </div>
                </div>
                <div class="flex flex-wrap gap-1 mt-1.5">
                    {#each competition.categories as category}
                        <CategoryRegistrationChip categoryType={category.type} registrationStatus={category.entryStatus} />
                    {/each}
                </div>
            </div>
        </a>
    {/each}
</div>
