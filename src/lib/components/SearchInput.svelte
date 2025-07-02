<script lang="ts">
    import Icon from '@iconify/svelte';

    let { filter = $bindable(), placeholder } = $props()
</script>

<div class="card">
    <div class="pt-1 pb-1 flex vertical-center">
        <div class="p-2">
            <Icon icon="simple-line-icons:magnifier"/>
        </div>
        <input class="input-full-width" placeholder={placeholder} bind:value={filter}/>
    </div>
</div>
