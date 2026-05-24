<script lang="ts">
    import CalendarClockIcon from '@iconify-svelte/mdi/calendar-clock';
    import PlayCircleIcon from '@iconify-svelte/mdi/play-circle';
    import CheckAllIcon from '@iconify-svelte/mdi/check-all';
    import CancelIcon from '@iconify-svelte/mdi/cancel';

    import { t } from '$lib/translations';

    let { competition_status }: { competition_status: string } = $props();

    function getCompetitionStatusBadge(status: string): { label: string; classes: string; icon: typeof CheckAllIcon } {
        if (status === 'STARTED') return { label: $t('competition_status.live'), classes: 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300', icon: PlayCircleIcon };
        if (status === 'FINISHED') return { label: $t('competition_status.finished'), classes: 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400', icon: CheckAllIcon };
        if (status === 'CANCELLED') return { label: $t('competition_status.cancelled'), classes: 'bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-300', icon: CancelIcon };
        return { label: $t('competition_status.upcoming'), classes: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300', icon: CalendarClockIcon };
    }

    const badge = $derived(getCompetitionStatusBadge(competition_status));
</script>

<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {badge.classes}">
    <badge.icon width="1rem" height="1rem" />
    {badge.label}
</span>
