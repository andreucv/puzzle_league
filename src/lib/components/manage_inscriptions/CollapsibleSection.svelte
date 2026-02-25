<script lang="ts">
    import { Collapsible } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    import type { Snippet } from 'svelte';

    let { icon, label, count, badgeClass, children }: {
        icon: string;
        label: string;
        count: number;
        badgeClass: string;
        children: Snippet;
    } = $props();
</script>

<Collapsible class="items-start w-full">
    <div class="flex justify-between w-full">
        <div class="flex gap-2">
            <Icon icon={icon} width="1rem" height="1rem" />
            <span class="text-sm font-semibold" data-testid="record-status-badge">{label}</span>
            <span class="badge {badgeClass} text-xs">{count}</span>
        </div>
        <Collapsible.Trigger class="btn-icon btn-icon-sm hover:preset-tonal rounded-full">
            <Collapsible.Indicator class="group">
                <Icon icon="mdi:chevron-down" width="1.2rem" height="1.2rem" class="transition-transform group-data-[state=open]:rotate-180" />
            </Collapsible.Indicator>
        </Collapsible.Trigger>
    </div>
    <Collapsible.Content class="w-full">
        {@render children()}
    </Collapsible.Content>
</Collapsible>
