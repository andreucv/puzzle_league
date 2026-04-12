<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import RestartIcon from '@iconify-svelte/mdi/restart';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import TimerCheckIcon from '@iconify-svelte/mdi/timer-check';
    import FlagCheckeredIcon from '@iconify-svelte/mdi/flag-checkered';
    import FormatListBulletedIcon from '@iconify-svelte/mdi/format-list-bulleted';
    import { t } from '$lib/translations';

    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

    interface CategoryData {
        id: number;
        type: CategoryType;
        description: string;
        subname?: string | null;
        status: string;
        realStartTime: string | null;
        realEndTime: string | null;
        totalRecords: number;
        finishedRecords: number;
        competitionId: number;
    }

    let {
        category,
        isOrganizer,
        onRestartCategory
    }: {
        category: CategoryData;
        isOrganizer: boolean;
        onRestartCategory: (id: number) => void;
    } = $props();

    let isCanceled = $derived(category.status === 'CANCELED');
</script>

<Card>
    <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            <div class="flex items-center gap-2">
                {#if isCanceled}
                    <div class="badge preset-tonal-error gap-1 text-xs">
                        <CancelIcon width="0.8rem" height="0.8rem" />
                        {$t('during_competition.canceled')}
                    </div>
                {:else}
                    <div class="badge preset-tonal-success gap-1 text-xs">
                        <CheckIcon width="0.8rem" height="0.8rem" />
                        {$t('during_competition.completed')}
                    </div>
                {/if}
                {#if isOrganizer}
                    <ConfirmActionButton
                        icon={RestartIcon}
                        colorClass="preset-filled-warning-500"
                        confirmTitle={$t('during_competition.restart_confirm_title')}
                        confirmMessage={$t('during_competition.restart_confirm_message')}
                        onConfirm={() => onRestartCategory(category.id)}
                        testId="restart-category-{category.id}"
                    />
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-4 text-sm text-surface-600-400">
            {#if category.realStartTime && category.realEndTime}
                <span class="flex items-center gap-1">
                    <TimerCheckIcon width="1rem" height="1rem" />
                    {calculateDuration(new Date(category.realStartTime), new Date(category.realEndTime))}
                </span>
            {/if}
            <span class="flex items-center gap-1">
                <FlagCheckeredIcon width="1rem" height="1rem" />
                {category.finishedRecords}/{category.totalRecords}
            </span>
        </div>

        {#if !isCanceled}
            <a
                href="/competitions/competition_details/{category.competitionId}/results#category-{category.id}"
                class="btn btn-sm preset-tonal-primary gap-1 w-fit"
            >
                <FormatListBulletedIcon width="1rem" height="1rem" />
                {$t('during_competition.view_results')}
            </a>
        {/if}
    </div>
</Card>
