<script lang="ts">
    import { Avatar, SlideToggle } from '@skeletonlabs/skeleton';
    import { invalidateAll, goto } from '$app/navigation';
    import { getCountries, formatCountryName } from '$lib/country_utils';
    import { onMount } from 'svelte';

    // Get data from page props
    export let data;
    const { profile, user } = data;

    // Form data
    let displayName = profile?.displayName || user?.displayName || '';
    let bio = profile?.bio || '';
    let country = profile?.country || null;
    let publicProfile = profile?.publicProfile !== false; // default to true
    let publicRanking = profile?.publicRanking !== false; // default to true
    let publicPoints = profile?.publicPoints !== false; // default to true

    // States for form feedback
    let successMessage = '';
    let errorMessage = '';

    // Countries for select dropdown
    let countries: { code: string; name: string }[] = [];

    // Form action results
    export let form;

    onMount(async () => {
        countries = await getCountries();

        // Show feedback if form action was just processed
        if (form?.success) {
            successMessage = 'Profile updated successfully';
            setTimeout(() => {
                successMessage = '';
            }, 3000);
        } else if (form?.error) {
            errorMessage = form.error;
            setTimeout(() => {
                errorMessage = '';
            }, 3000);
        }
    });

    // Handle logout
    async function signOut() {
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

<main class="container mx-auto px-4 py-8">
    <h1 class="text-2xl md:text-3xl font-bold mb-6">Your Profile</h1>

    <!-- User basic info card -->
    <div class="card p-4 mb-6 bg-surface-100-800-token">
        <div class="flex items-center">
            <div class="flex-none mr-4">
                {#if user.photoURL}
                    <Avatar
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        width="w-16"
                        referrerPolicy="no-referrer" />
                {:else}
                    <Avatar
                        initials={user.displayName ? user.displayName.substring(0, 2) : 'U'}
                        width="w-16" />
                {/if}
            </div>
            <div class="flex-auto">
                <h2 class="text-xl font-semibold">{user.displayName || 'User'}</h2>
                <p class="text-sm opacity-80">{user.email}</p>
                <p class="text-xs opacity-60">Account type: {user.authProvider || 'Email'}</p>
            </div>
        </div>
    </div>

    <!-- Profile settings form -->
    <form method="POST" action="?/updateProfile" class="card p-6 bg-surface-100-800-token mb-6">
        <h2 class="text-xl font-semibold mb-4">Profile Settings</h2>

        {#if successMessage}
            <div class="alert alert-success mb-4 p-4 rounded bg-green-700/30">
                {successMessage}
            </div>
        {/if}

        {#if errorMessage}
            <div class="alert alert-error mb-4 p-4 rounded bg-red-700/30">
                {errorMessage}
            </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
                <label for="displayName" class="label">
                    <span>Display Name</span>
                </label>
                <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    bind:value={displayName}
                    class="input w-full"
                    placeholder="How others will see you" />
            </div>

            <div class="form-group">
                <label for="country" class="label">
                    <span>Country</span>
                </label>
                <select
                    id="country"
                    name="country"
                    bind:value={country}
                    class="select w-full">
                    <option value="">Select your country</option>
                    {#each countries as countryOption}
                        <option value={countryOption.code}>{formatCountryName(countryOption.name)}</option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="form-group mt-4">
            <label for="bio" class="label">
                <span>Biography</span>
            </label>
            <textarea
                id="bio"
                name="bio"
                bind:value={bio}
                class="textarea w-full"
                rows="3"
                placeholder="Tell others about yourself..."></textarea>
        </div>

        <hr class="my-4 opacity-30">

        <h3 class="text-lg font-semibold mb-2">Privacy Settings</h3>

        <div class="form-group mt-2">
            <label class="flex items-center space-x-2">
                <input type="checkbox" name="publicProfile" checked={publicProfile} class="checkbox" />
                <span>Make profile public</span>
            </label>
            <p class="text-xs opacity-70 mt-1">
                Other users can see your profile details
            </p>
        </div>

        <div class="form-group mt-3">
            <label class="flex items-center space-x-2">
                <input type="checkbox" name="publicRanking" checked={publicRanking} class="checkbox" />
                <span>Show ranking publicly</span>
            </label>
            <p class="text-xs opacity-70 mt-1">
                Your ranking will be visible on leaderboards
            </p>
        </div>

        <div class="form-group mt-3">
            <label class="flex items-center space-x-2">
                <input type="checkbox" name="publicPoints" checked={publicPoints} class="checkbox" />
                <span>Show points publicly</span>
            </label>
            <p class="text-xs opacity-70 mt-1">
                Others can see your point totals on leaderboards
            </p>
        </div>

        <div class="form-group mt-6">
            <button type="submit" class="btn variant-filled-primary w-full md:w-auto">Save Changes</button>
        </div>
    </form>

    <div class="flex justify-between items-center mt-8">
        <button id="sign-out" type="button" class="btn variant-filled-error" on:click={signOut}>
            Sign out
        </button>

        <a href="/" class="btn variant-ghost">Back to Home</a>
    </div>
</main>
