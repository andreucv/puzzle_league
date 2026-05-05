<script lang="ts">
    let { href, text, icon: Icon, colorClass = 'primary', testId }: { href: string; text: string; icon: any; colorClass?: string; testId?: string } = $props();
</script>

<a {href} class="btn {colorClass}" data-testid={testId}>
    <Icon width="1.2rem" height="1.2rem" />
    {text}
</a>