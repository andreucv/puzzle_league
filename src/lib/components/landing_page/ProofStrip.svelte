<script lang="ts">
    import { t } from '$lib/translations';

    interface Stats {
        upcomingCount: number;
        cityCount: number;
        participantCount: number;
    }

    interface Props {
        stats: Stats | null;
    }

    let { stats }: Props = $props();
</script>

{#if stats}
    <div class="w-full bg-surface-100-800 py-4 px-6">
        <div class="container mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-center">
            <div class="flex items-center gap-2">
                <span class="text-2xl font-bold text-primary-500">{stats.upcomingCount}</span>
                <span class="text-sm text-surface-600-300">{$t('landing_page.proof_strip.upcoming_label')}</span>
            </div>
            <span class="text-surface-400-500 hidden sm:block" aria-hidden="true">·</span>
            <div class="flex items-center gap-2">
                <span class="text-2xl font-bold text-primary-500">{stats.cityCount}</span>
                <span class="text-sm text-surface-600-300">{$t('landing_page.proof_strip.cities_label')}</span>
            </div>
            <span class="text-surface-400-500 hidden sm:block" aria-hidden="true">·</span>
            <div class="flex items-center gap-2">
                <span class="text-2xl font-bold text-primary-500">{stats.participantCount}</span>
                <span class="text-sm text-surface-600-300">{$t('landing_page.proof_strip.puzzlers_label')}</span>
            </div>
        </div>
    </div>
{/if}
