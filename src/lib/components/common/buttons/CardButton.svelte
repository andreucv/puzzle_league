<script lang="ts">
    import { t } from '$lib/translations';
    let { href, translationKey, icon: Icon, colorClass = 'primary', testId }: { href: string; translationKey: string; icon: any; colorClass?: string; testId?: string } = $props();
</script>

<a {href} class="btn {colorClass}" data-testid={testId}>
    <Icon width="1.2rem" height="1.2rem" />
    {$t(translationKey)}
</a>