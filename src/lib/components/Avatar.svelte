<script>
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    let { user, size } = $props();
    let classes = `w-${size} h-${size} ring-2 ring-surface-50-950 hover:scale-110 transition-transform duration-200`;
</script>

<Avatar
    name={user.name}
    src={user?.image ?? undefined}
    classes={classes}
/>
