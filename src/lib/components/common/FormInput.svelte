<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';
    import type { Component } from 'svelte';

    // Mirrors SearchInput's background_class pattern while supporting full input attribute forwarding.
    interface Props extends Omit<HTMLInputAttributes, 'value' | 'class'> {
        value?: string;
        icon?: Component;
        background_class?: string;
    }

    let {
        value = $bindable(''),
        icon: IconComponent = undefined,
        background_class = 'preset-outlined-surface-200-800',
        ...rest
    }: Props = $props();
</script>

<div class="form-input-container rounded-lg {background_class}">
    <div class="pt-1 pb-1 flex items-center">
        {#if IconComponent}
            <div class="p-2">
                <IconComponent width="1.2rem" height="1.2rem" class="text-surface-500" />
            </div>
        {/if}
        <input class="form-input-field" bind:value {...rest} />
    </div>
</div>

<style>
    .form-input-field {
        width: 100%;
        border: none;
        background-color: transparent;
        padding: 0.25rem 0.5rem;
        outline: none;
    }
</style>
