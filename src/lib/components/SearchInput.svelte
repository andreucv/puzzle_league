<script lang="ts">
    import MagnifyIcon from '@iconify-svelte/mdi/magnify';

    let { filter = $bindable(), placeholder } = $props()
</script>

<div class="card">
    <div class="pt-1 pb-1 flex vertical-center">
        <div class="p-2">
            <MagnifyIcon width="1.2rem" height="1.2rem" class="text-surface-500" />
        </div>
        <input class="input-full-width" placeholder={placeholder} bind:value={filter}/>
    </div>
</div>

<style>
    .input-full-width {
        width: 100%;
        border: none;
        background-color: transparent;
    }
</style>
