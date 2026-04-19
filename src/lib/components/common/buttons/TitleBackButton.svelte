<script lang="ts">
    import ArrowLeftIcon from '@iconify-svelte/mdi/arrow-left';
    import type { Snippet } from 'svelte';
    let { href, text, trailing }: { href: string; text: string; trailing?: Snippet } = $props();
</script>

<div class="flex items-center gap-2">
    <a href={href} class="btn btn-sm preset-tonal shrink-0">
        <ArrowLeftIcon width="1.2rem" height="1.2rem" />
    </a>
    <h4 class="h4 font-sans font-medium flex-1 min-w-0 truncate">{text}</h4>
    {#if trailing}
        <div class="ml-auto shrink-0">{@render trailing()}</div>
    {/if}
</div>
