<script lang="ts">
    import LoadingIcon from '@iconify-svelte/mdi/loading';

    let {
        icon: Icon,
        colorClass,
        submitting = false,
        disabled = false,
        onclick,
        "data-testid": dataTestId
    }: {
        icon: any;
        colorClass: string;
        submitting?: boolean;
        disabled?: boolean;
        onclick: (e: MouseEvent) => void;
        "data-testid"?: string;
    } = $props();
</script>

<button
    type="button"
    class="btn-icon w-5 h-5 {colorClass} rounded-full"
    disabled={disabled || submitting}
    {onclick}
    data-testid={dataTestId}
>
    {#if submitting}
        <LoadingIcon class="animate-spin" width="1rem" height="1rem" />
    {:else}
        <Icon width="1rem" height="1rem" />
    {/if}
</button>
