<script lang="ts">
    import { t } from '$lib/translations';
    import ChevronDownIcon from '@iconify-svelte/mdi/chevron-down';

    // `items` holds translation keys, resolved here so guide pages stay declarative.
    let { items }: { items: { q: string; a: string }[] } = $props();
</script>

<div class="space-y-2">
    {#each items as item}
        <details class="card p-0 group">
            <summary
                class="flex items-center justify-between gap-2 cursor-pointer p-4 text-sm font-medium list-none"
            >
                {$t(item.q)}
                <ChevronDownIcon
                    width="1.2rem"
                    height="1.2rem"
                    class="text-surface-500 shrink-0 transition-transform group-open:rotate-180"
                />
            </summary>
            <p class="px-4 pb-4 text-sm text-surface-600-300 leading-relaxed">{$t(item.a)}</p>
        </details>
    {/each}
</div>
