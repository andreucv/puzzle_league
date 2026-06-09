<script lang="ts">
    import type { Snippet } from 'svelte';

    // A labelled frame that showcases real product components in a non-interactive
    // demo state. The slot wrapper disables pointer events so embedded buttons/links
    // can't be clicked — the guide mirrors the UI, it isn't the UI.
    let { caption = '', children }: { caption?: string; children: Snippet } = $props();
</script>

<div class="rounded-lg border border-surface-300-700 bg-surface-50-950 p-4 space-y-2">
    <div class="flex flex-wrap items-center gap-2 pointer-events-none">
        {@render children()}
    </div>
    {#if caption}
        <p class="text-xs text-surface-500">{caption}</p>
    {/if}
</div>
