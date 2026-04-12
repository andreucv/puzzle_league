<script lang="ts">
    import TimerSandIcon from '@iconify-svelte/mdi/timer-sand';
    import PlayCircleOutlineIcon from '@iconify-svelte/mdi/play-circle-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import CancelIcon from '@iconify-svelte/mdi/cancel';

    import { t } from '$lib/translations';

    let {category_status}: {category_status: string} = $props();

    function getCategoryStatusBadge(status: string): { label: string; classes: string; icon: typeof CheckCircleIcon } {
        if (status === 'LIVE') return { label: $t('category_status.in_progress'), classes: 'preset-filled-warning-500', icon: PlayCircleOutlineIcon };
        if (status === 'COMPLETE') return { label: $t('category_status.completed'), classes: 'preset-filled-success-500', icon: CheckCircleIcon };
        if (status === 'CANCELED') return { label: $t('category_status.canceled'), classes: 'preset-filled-error-500', icon: CancelIcon };
        return { label: $t('category_status.not_started'), classes: 'preset-filled-surface-400-600', icon: TimerSandIcon };
    }

    const categoryStatusBadge = $derived(getCategoryStatusBadge(category_status));
</script>

<span class="badge text-xs flex items-center gap-1 shrink-0 {categoryStatusBadge.classes}">
    <categoryStatusBadge.icon width="0.85rem" height="0.85rem" />
    {categoryStatusBadge.label}
</span>
