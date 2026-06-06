<script lang="ts">
    import { Collapsible } from '@skeletonlabs/skeleton-svelte';
    import ChevronDownIcon from '@iconify-svelte/mdi/chevron-down';
    import type { Snippet } from 'svelte';

    let { icon: Icon, label, count, badgeClass, testId, children, open: initialOpen = false }: {
        icon: typeof ChevronDownIcon;
        label: string;
        count: number;
        badgeClass: string;
        testId?: string;
        children: Snippet;
        open?: boolean;
    } = $props();

    // svelte-ignore state_referenced_locally
    let isOpen = $state(initialOpen);
</script>

<Collapsible open={isOpen} onOpenChange={(details) => isOpen = details.open} class="items-start w-full">
    <div class="flex justify-between w-full">
        <div class="flex gap-2">
            <Icon width="1rem" height="1rem" />
            <span class="text-sm font-semibold" data-testid="entry-status-badge">{label}</span>
            <span class="badge {badgeClass} text-xs">{count}</span>
        </div>
        <Collapsible.Trigger class="btn-icon btn-icon-sm hover:preset-tonal rounded-full" data-testid={testId}>
            <Collapsible.Indicator class="group">
                <ChevronDownIcon width="1.2rem" height="1.2rem" class="transition-transform group-data-[state=open]:rotate-180" />
            </Collapsible.Indicator>
        </Collapsible.Trigger>
    </div>
    <Collapsible.Content class="w-full">
        {@render children()}
    </Collapsible.Content>
</Collapsible>
