<script lang="ts">
    import { getCategoryStatusVisual } from '$lib/utils/category_utils';
    import { t } from '$lib/translations';

    let {category_status}: {category_status: string} = $props();

    const visual = $derived(getCategoryStatusVisual(category_status));
    const chipClasses = $derived(
        visual.color === 'surface'
            ? 'preset-filled-surface-400-600'
            : `preset-filled-${visual.color}-500`
    );
</script>

<span class="badge text-xs flex items-center gap-1 shrink-0 {chipClasses}">
    <visual.icon width="0.85rem" height="0.85rem" />
    {$t(visual.labelKey)}
</span>
