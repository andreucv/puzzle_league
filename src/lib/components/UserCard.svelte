<script lang="ts">
    let { user } = $props();

    let displayName = $state(user.name || "Pending name...");

    // Format date for display
    const formatDate = (date: Date | string) => {
        if (!date) return "N/A";

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return "Invalid Date";
        }

        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(dateObj);
    };

</script>

<div class="card variant-filled-surface-50 p-6 shadow-lg">
    <header class="card-header flex items-center gap-4 pb-4">
        {#if user.image}
            <img
                id="user-avatar"
                src={user.image}
                alt="{user.email}'s profile"
                class="w-16 h-16 rounded-full border-2 border-surface-300"
            />
        {:else}
            <div class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
                <span class="text-2xl font-bold text-white">
                    {user.email.charAt(0).toUpperCase()}
                </span>
            </div>
        {/if}
        <div class="flex-1">
            <h2 class="h3 font-bold">{displayName}</h2>
            <p class="text-surface-600">{user.email}</p>
        </div>
    </header>

    <div class="card-body space-y-3">
        <div class="flex items-center gap-2">
            <span class="pt-2">
                {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
            </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
                <span class="text-sm font-semibold text-surface-500">Member Since</span>
                <p class="text-sm">{formatDate(user.createdAt)}</p>
            </div>
            <div>
                <span class="text-sm font-semibold text-surface-500">Last Updated</span>
                <p class="text-sm">{formatDate(user.updatedAt)}</p>
            </div>
        </div>
    </div>
</div>
