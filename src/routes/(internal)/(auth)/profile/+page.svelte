<script lang="ts">
    import type { PageData } from "./$types";
    import type { RoleAssignment } from '$lib/.prisma/generated/prisma/browser';
    import { authClient } from "$lib/auth_client";
    import { goto } from "$app/navigation";
    import UserCard from "$lib/components/UserCard.svelte";

    import {t} from '$lib/translations';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';

    let { data }: { data: PageData } = $props();

    // user and account come from page load (includes DB fields like country, postalCode)
    const user = $derived(data.user);
    const account = $derived(data.account);
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

<GenericTitle text={$t('profile.my_profile')} />
<div class="container">
    <div class="space-y-6">
        <UserCard {user} {account}/>
        <div class="flex justify-start gap-4">
            {#if !user.roleAssignments?.some((role: RoleAssignment) => role.role === "ORGANIZER")}
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
