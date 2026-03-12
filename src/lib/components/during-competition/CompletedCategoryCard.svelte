<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';

    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

    interface CategoryData {
        id: number;
        type: CategoryType;
        description: string;
        subname?: string | null;
        realStartTime: string | null;
        realEndTime: string | null;
        totalRecords: number;
        finishedRecords: number;
        competitionId: number;
    }

    let {
        category
    }: {
        category: CategoryData;
    } = $props();
</script>

<Card>
    <div class="space-y-2 opacity-80">
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            <div class="badge preset-filled-success-500 gap-1 text-xs">
                <Icon icon="mdi:check" width="0.8rem" />
                {$t('during_competition.completed')}
            </div>
        </div>

        <div class="flex items-center gap-4 text-sm text-surface-600-400">
            {#if category.realStartTime && category.realEndTime}
                <span class="flex items-center gap-1">
                    <Icon icon="mdi:timer-check" width="1rem" />
                    {calculateDuration(new Date(category.realStartTime), new Date(category.realEndTime))}
                </span>
            {/if}
            <span class="flex items-center gap-1">
                <Icon icon="mdi:flag-checkered" width="1rem" />
                {category.finishedRecords}/{category.totalRecords}
            </span>
        </div>

        <a
            href="/competitions/competition_details/{category.competitionId}/results#category-{category.id}"
            class="btn btn-sm preset-tonal-primary gap-1 w-fit"
        >
            <Icon icon="mdi:format-list-bulleted" width="1rem" />
            {$t('during_competition.view_results')}
        </a>
    </div>
</Card>
