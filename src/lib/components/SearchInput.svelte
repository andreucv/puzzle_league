<script lang="ts">
    import MagnifyIcon from '@iconify-svelte/mdi/magnify';

    let { filter = $bindable(), placeholder } = $props()
</script>

<div class="search-container rounded-lg">
    <div class="pt-1 pb-1 flex vertical-center">
        <div class="p-2">
            <MagnifyIcon width="1.2rem" height="1.2rem" class="text-surface-500" />
        </div>
        <input class="input-full-width" placeholder={placeholder} bind:value={filter}/>
    </div>
</div>

<style>
    @reference "../../app.css";

    .search-container {
        /* Outside a card: use card-like background */
        @apply preset-filled-surface-200-800;
    }

    :global(.card) .search-container {
        /* Inside a card: white (light) / darker surface (dark) */
        @apply bg-white dark:bg-surface-900;
    }

    .input-full-width {
        width: 100%;
        border: none;
        background-color: transparent;
    }
</style>
