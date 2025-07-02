<script lang="ts">
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import { authClient } from "$lib/auth_client";
    import { goto } from "$app/navigation";
    import UserCard from "$lib/components/UserCard.svelte";

    import {t} from '$lib/translations';

    const { user, roleAssignments, account} = $derived($page.data) as PageData;
    console.log(roleAssignments);
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

<h4>{$t('profile.my_profile')}</h4>
<div class="container">
    <div class="space-y-6">
        <UserCard {user} {roleAssignments} {account}/>
        <div class="flex justify-start gap-4">
            {#if !roleAssignments?.some((role) => role.role === "ORGANIZER")}
                <button
                    type="button"
                    class="btn preset-filled-primary-500"
                    onclick={() => goto("/request_permissions")}
                >
                    Request Organizer Role
                </button>
            {/if}
            <button
                id="sign-out"
                type="button"
                class="btn preset-filled-error-500"
                onclick={signOut}
            >
                Sign out
            </button>
        </div>
    </div>
</div>
