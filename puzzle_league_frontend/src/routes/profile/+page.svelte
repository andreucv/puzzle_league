<script lang="ts">
    import { Avatar, SlideToggle } from '@skeletonlabs/skeleton';
    import type { PageData } from '../$types';
    let { data }: {data : PageData} = $props();
    const participant = $derived(data.participant);
    const user        = $derived(data.user);
    const groups      = $derived(data.participant.user.groups);

    export async function signOut() {
        try {
            await fetch("/login", {
                method: "DELETE",
            });
            await invalidateAll();
            await goto("/login");
        } catch (err) {
            console.error(err);
        }
    }
</script>

<main class="container">
    <h1 class="h1">Profile</h1>

    <!-- This is user data space -->
    <div class="card mt-2">
        <div class="card-body">
            <div class="flex items-center">
                <div class="flex-none m-4">
                    <Avatar referrerPolicy="no-referrer" src={user.picture} alt={user.name} />
                </div>
                <div class="flex-auto">
                    <h2 class="h2">{user.name}</h2>
                    <p class="text-gray">{user.email}</p>
                </div>
            </div>
        </div>
    </div>

    <div>
    <div class="card mt-2">
        <div class="card-body p-4">
            <h2 class="h2">Groups</h2>
            <div class="form-group px-2">
                {#each groups as group}
                    <div class="mt-1 flex">
                        <p class="text-gray">{group.name}</p>
                    </div>
                {/each}
            </div>
        </div>
    </div>
    <!-- This is participant data space -->
    <!-- participant data model is:
            public_country, boolean (checkbox)
            public_ranking, boolean (checkbox)
            public_points, boolean (checkbox)
            public_puzzles, boolean (checkbox)
            public_awards, boolean (checkbox)
            country, choices (dropdown)
        This space will be a form that the user can modify any of their data. -->
    <form class="card mt-2">
        <div class="card-body p-4">
            <h2 class="h2">Your settings</h2>
            
            <div class="form-group px-2">
                <label class="mt-2 py-2 flex">
                    <SlideToggle name="slider-label" bind:value={participant.public_ranking}>Make ranking public</SlideToggle>
                </label>
                <p class="text-gray-500">
                    Enabling this will make public your ranking in the leaderboard for others.
                </p>
                <label class="mt-2 py-2 flex">
                    <SlideToggle name="slider-label" bind:value={participant.public_points}>Make points public</SlideToggle>
                </label>
                <p class="text-gray-500">
                    Enabling this will show your ranking points to others in the leaderboards.
                </p>
            </div>
            
            <button type="submit" class="btn btn-primary mt-2">Save</button>
        </div>
    </form>

    <button id="sign-out" type="button" class="btn btn-sm variant-filled" onclick={() => signOut()}>
        Sign out
    </button>
</main>