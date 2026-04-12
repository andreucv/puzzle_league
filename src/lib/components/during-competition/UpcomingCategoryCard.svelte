<script lang="ts">
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import PlayIcon from '@iconify-svelte/mdi/play';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import DotsVerticalIcon from '@iconify-svelte/mdi/dots-vertical';
    import ClockStartIcon from '@iconify-svelte/mdi/clock-start';
    import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
    import { t } from '$lib/translations';

    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

    interface CategoryData {
        id: number;
        type: CategoryType;
        description: string;
        subname?: string | null;
        startTime: string;
        totalRecords: number;
        competitionId: number;
    }

    let {
        category,
        isOrganizer,
        onStartCategory,
        onCancelCategory
    }: {
        category: CategoryData;
        isOrganizer: boolean;
        onStartCategory: (id: number) => void;
        onCancelCategory: (id: number) => void;
    } = $props();

    let showOverflowMenu = $state(false);

    function formatTime(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' });
    }
</script>

<Card>
    <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            {#if isOrganizer}
                <div class="flex items-center gap-2">
                    <!-- Overflow menu with Cancel option -->
                    <div class="relative">
                        <button
                            type="button"
                            class="btn-icon w-4 h-4 preset-tonal rounded-full"
                            onclick={() => showOverflowMenu = !showOverflowMenu}
                            data-testid="overflow-menu-{category.id}"
                        >
                            <DotsVerticalIcon width="1rem" height="1rem" />
                        </button>
                        {#if showOverflowMenu}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="fixed inset-0 z-40" onclick={() => showOverflowMenu = false}></div>
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="absolute right-0 top-full mt-1 z-50 bg-surface-50-950 border border-surface-300-700 rounded-lg shadow-lg min-w-40">
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="p-1" onclick={() => showOverflowMenu = false}>
                                    <ConfirmActionButton
                                        icon={CancelIcon}
                                        colorClass="preset-filled-warning-500"
                                        confirmTitle={$t('during_competition.cancel_confirm_title')}
                                        confirmMessage={$t('during_competition.cancel_confirm_message')}
                                        onConfirm={() => onCancelCategory(category.id)}
                                        testId="cancel-category-{category.id}"
                                        label={$t('during_competition.cancel_category')}
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>
                    <ConfirmActionButton
                        icon={PlayIcon}
                        colorClass="preset-filled-success-500"
                        confirmTitle={$t('during_competition.start_confirm_title')}
                        confirmMessage={$t('during_competition.start_confirm_message')}
                        onConfirm={() => onStartCategory(category.id)}
                        testId="start-category-{category.id}"
                    />
                </div>
            {/if}
        </div>

        <div class="flex items-center gap-4 text-sm text-surface-600-400">
            <span class="flex items-center gap-1">
                <ClockStartIcon width="1rem" height="1rem" />
                {formatTime(category.startTime)}
            </span>
            <span class="flex items-center gap-1">
                <AccountGroupIcon width="1rem" height="1rem" />
                {category.totalRecords} {$t('during_competition.entries')}
            </span>
        </div>

        {#if isOrganizer}
            <a
                href="/competition/{category.competitionId}/manage_judges"
                class="text-xs text-primary-500 hover:underline"
            >
                {$t('during_competition.manage_judges')}
            </a>
        {/if}
    </div>
</Card>
