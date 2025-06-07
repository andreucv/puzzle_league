<script lang="ts">
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import { authClient } from "$lib/auth_client";
    import { goto } from "$app/navigation";
    import UserCard from "$lib/components/UserCard.svelte";

    const { user } = $derived($page.data) as PageData;

    // TODO: Get account info from authClient
    // this info will be used to enable or disable the form fields

    // Handle logout
    async function signOut() {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    goto("/login"); // redirect to login page
                },
            },
        });
    }
</script>

<div class="container">
    {#if user}
        <div class="space-y-6">
            <h1 class="h1 font-bold">Profile</h1>

            <UserCard {user} />

            <div class="flex justify-end">
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
    {/if}
</div>
