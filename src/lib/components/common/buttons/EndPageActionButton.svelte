<script lang="ts">
    let { icon: Icon, href, text, colorClass = 'preset-filled-primary-500', disabled = false, testId = undefined }: {
        icon: any;
        href: string;
        text: string;
        colorClass?: string;
        disabled?: boolean;
        testId?: string;
    } = $props();
</script>

{#if disabled}
    <button class="btn {colorClass}" disabled data-testid={testId}>
        <Icon width="1.2rem" height="1.2rem" />
        {text}
    </button>
{:else}
    <a {href} class="btn {colorClass}" data-testid={testId}>
        <Icon width="1.2rem" height="1.2rem" />
        {text}
    </a>
{/if}
