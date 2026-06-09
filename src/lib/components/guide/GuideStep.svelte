<script lang="ts">
    import type { Snippet } from 'svelte';
    import Card from '$lib/components/common/card/Card.svelte';

    let {
        number,
        title,
        level = 2,
        children,
    }: { number: number; title: string; level?: 2 | 3; children: Snippet } = $props();
</script>

<Card>
    <div class="space-y-3">
        <svelte:element this={`h${level}`} class="font-semibold font-sans flex items-center gap-3">
            <span
                class="flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm shrink-0"
            >
                {number}
            </span>
            {title}
        </svelte:element>
        <div class="text-sm text-surface-600-300 space-y-3 leading-relaxed">
            {@render children()}
        </div>
    </div>
</Card>
