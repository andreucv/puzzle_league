<script lang="ts">
    import Avatar from "./Avatar.svelte";
    let { users } = $props();
</script>

<div>
    {#each users as user}
        <Avatar user={user} size=0 />
    {/each}
</div>
