<script lang="ts">
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import { authClient } from "$lib/auth_client";
    import { goto } from "$app/navigation";
    import UserCard from "$lib/components/UserCard.svelte";

    const { user, roleAssignments } = $derived($page.data) as PageData;

    // Handle logout
    async function signOut() {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    goto("/login");
                },
            },
        });
    }
</script>

<div class="container">
    <div class="space-y-6">
        <h1 class="h1 font-bold">Profile</h1>

        <UserCard {user} />

        <div class="flex justify-start gap-4">
            {#if !roleAssignments.some((role) => role.role === "organizer")}
                <button
                    type="button"
                    class="btn variant-filled-primary"
                    onclick={() => goto("/request_permissions")}
                >
                    Request Organizer Role
                </button>
            {/if}
            <button
                id="sign-out"
                type="button"
                class="btn variant-filled-error"
                onclick={signOut}
            >
                Sign out
            </button>
        </div>
    </div>
</div>
