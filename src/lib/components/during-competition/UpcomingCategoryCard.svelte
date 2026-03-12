<script lang="ts">
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
        startTime: string;
        totalRecords: number;
        competitionId: number;
    }

    let {
        category,
        isOrganizer,
        onStartCategory
    }: {
        category: CategoryData;
        isOrganizer: boolean;
        onStartCategory: (id: number) => void;
    } = $props();

    let showConfirm = $state(false);

    function formatTime(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    async function handleStart() {
        showConfirm = false;
        onStartCategory(category.id);
    }
</script>

<Card>
    <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            {#if isOrganizer}
                {#if showConfirm}
                    <div class="flex gap-1">
                        <button class="btn btn-sm preset-filled-success-500" onclick={handleStart}>
                            {$t('during_competition.confirm')}
                        </button>
                        <button class="btn btn-sm preset-tonal" onclick={() => showConfirm = false}>
                            {$t('during_competition.cancel')}
                        </button>
                    </div>
                {:else}
                    <button
                        class="btn btn-sm preset-filled-success-500 gap-1"
                        onclick={() => showConfirm = true}
                    >
                        <Icon icon="mdi:play" width="1rem" />
                        {$t('during_competition.start')}
                    </button>
                {/if}
            {/if}
        </div>

        <div class="flex items-center gap-4 text-sm text-surface-600-400">
            <span class="flex items-center gap-1">
                <Icon icon="mdi:clock-start" width="1rem" />
                {formatTime(category.startTime)}
            </span>
            <span class="flex items-center gap-1">
                <Icon icon="mdi:account-group" width="1rem" />
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
