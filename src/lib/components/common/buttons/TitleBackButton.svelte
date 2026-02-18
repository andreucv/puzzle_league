<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';
    let { href, text } = $props();
</script>

<div class="flex items-center gap-2">
    <a href={href} class="btn btn-sm preset-tonal">
        <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
    </a>
    <h4 class="h4 font-sans font-medium">{text}</h4>
</div>
