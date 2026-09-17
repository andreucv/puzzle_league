<script lang="ts">
    import TimerSandIcon from '@iconify-svelte/mdi/timer-sand';
    import PlayCircleOutlineIcon from '@iconify-svelte/mdi/play-circle-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import CancelIcon from '@iconify-svelte/mdi/cancel';

    import { t } from '$lib/translations';
    import type { CompetitionStatus } from '$prisma/browser';

    // Map competition status to display data, mirroring CategoryStatusChip.svelte style.
    function getCompetitionStatusBadge(status: CompetitionStatus): { label: string; classes: string; icon: typeof CheckCircleIcon } {
        switch (status) {
            case 'STARTED':
                return { label: $t('competition_status.live'), classes: 'preset-filled-warning-500', icon: PlayCircleOutlineIcon };
            case 'FINISHED':
                return { label: $t('competition_status.finished'), classes: 'preset-filled-success-500', icon: CheckCircleIcon };
            case 'CANCELLED':
                return { label: $t('competition_status.cancelled'), classes: 'preset-filled-error-500', icon: CancelIcon };
            case 'NOT_STARTED':
            default:
                return { label: $t('competition_status.upcoming'), classes: 'preset-filled-surface-400-600', icon: TimerSandIcon };
        }
    }

    // We need the competition status passed as a prop, which comes from data.props.competition.status
    let { competitionStatus }: { competitionStatus: CompetitionStatus } = $props();

    const competitionStatusBadge = $derived(getCompetitionStatusBadge(competitionStatus));
</script>

<span class="badge text-xs flex items-center gap-1 shrink-0 {competitionStatusBadge.classes}">
    <competitionStatusBadge.icon width="0.85rem" height="0.85rem" />
    {competitionStatusBadge.label}
</span>
