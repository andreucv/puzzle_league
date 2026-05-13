<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        label,
        content,
        action,
        testId,
    }: {
        label: string;
        content: Snippet;
        action?: Snippet;
        testId?: string;
    } = $props();
</script>

<div
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-surface-200-800 py-2 first:border-t-0"
    data-testid={testId}
>
    <div class="min-w-0 space-y-1 {action ? '' : 'col-span-2'}">
        <span class="text-sm font-semibold text-surface-500">{label}</span>
        {@render content()}
    </div>

    {#if action}
        <div class="flex flex-wrap items-center justify-end gap-2">
            {@render action()}
        </div>
    {/if}
</div>
