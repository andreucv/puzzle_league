<script lang="ts">
    import Icon from '@iconify/svelte';

    let { icon, href, text, colorClass = 'preset-filled-primary-500', disabled = false }: {
        icon: string;
        href: string;
        text: string;
        colorClass?: string;
        disabled?: boolean;
    } = $props();
</script>

{#if disabled}
    <button class="btn {colorClass}" disabled>
        <Icon {icon} width="1.2rem" height="1.2rem" />
        {text}
    </button>
{:else}
    <a {href} class="btn {colorClass}">
        <Icon {icon} width="1.2rem" height="1.2rem" />
        {text}
    </a>
{/if}
