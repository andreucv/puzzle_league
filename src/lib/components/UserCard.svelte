<script lang="ts">
    import { Avatar } from "@skeletonlabs/skeleton-svelte";
    import { t } from '$lib/translations';
    import ThemeLightSwitch from './ThemeLightSwitch.svelte';

    let { user, roleAssignments, account } = $props();

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

<div class="card p-4 shadow-lg">
    <!-- Avatar Section - Centered -->
    <h3 class="text-lg font-semibold text-surface-700-300">{$t('profile.data')}</h3>
    <div class="flex justify-center pb-6">
        {#if user.image}
            <Avatar
                name={user.name}
                src={user.image}
                classes="w-20 h-20 rounded-full border-2 border-surface-300"
            ></Avatar>
            {#if account.provider === "credential"}
                <button class="btn btn-sm preset-outlined-surface-500">Change</button>
            {/if}
        {:else}
            <div class="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center">
                <span class="text-2xl font-bold text-white">
                    {user.email.charAt(0).toUpperCase()}
                </span>
            </div>
        {/if}
    </div>

    <!-- Settings Section -->
    <div class="space-y-4 pb-6">
        <!-- Name Setting -->
        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Name</span>
                <p class="text-sm">{displayName}</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500">Change</button>
            </div>
        </div>

        <!-- Password Setting -->
        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Password</span>
                <p class="text-sm">••••••••</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500">Change</button>
            </div>
        </div>

        <!-- Email/Verification Setting -->
        <span class="text-sm font-semibold text-surface-500">Email</span>
        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 items-center">
            <div>
            <p class="text-sm">{user.email}</p>
            <span class="text-xs {user.emailVerified ? 'text-success-500' : 'text-warning-500'}">
                {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
            </span>
            </div>
            <div class="flex flex-col items-end gap-1">
            <span class="badge preset-filled-surface-500">{account.provider}</span>
            <span class="text-xs text-surface-400">Cannot be changed</span>
            </div>
        </div>
    </div>

    <!-- Role Badges - Centered -->
    <div class="grid grid-cols-2 gap-2 pb-4">
        <div>{$t('profile.roles')}</div>
        <div class="flex justify-end gap-2">
        {#if roleAssignments?.some((role) => role.role === "MEMBER")}
            <span class="badge preset-filled-surface-500">Member</span>
        {/if}
        {#if roleAssignments?.some((role) => role.role === "ORGANIZER")}
            <span class="badge preset-filled-primary-500">Organizer</span>
        {/if}
        {#if roleAssignments?.some((role) => role.role === "ADMIN")}
            <span class="badge preset-filled-secondary-500">Admin</span>
        {/if}
        </div>
    </div>

    <!-- Member Info Section -->
    <div class="grid grid-cols-2 md:grid-cols-2 gap-4 pt-4 border-t border-surface-300">
        <div>
            <span class="text-sm font-semibold text-surface-500">Member Since</span>
            <p class="text-sm">{formatDate(user.createdAt)}</p>
        </div>
        <div class="flex flex-col items-end">
            <span class="text-sm font-semibold text-surface-500">Last Updated</span>
            <p class="text-sm">{formatDate(user.updatedAt)}</p>
        </div>
    </div>
</div>

<div class="card p-4 shadow-lg">
    <!-- Settings Section -->
    <div class="space-y-4">
        <h3 class="text-lg font-semibold text-surface-700-300">{$t('profile.preferences')}</h3>

        <!-- Language Setting -->
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Language</span>
                <p class="text-sm">English</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500">Change</button>
            </div>
        </div>

        <!-- Theme Setting -->
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Theme</span>
                <p class="text-sm">Light Mode</p>
            </div>
            <div class="flex justify-end">
                <ThemeLightSwitch />
            </div>
        </div>

        <!-- Profile Visibility Setting -->
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Profile Visibility</span>
                <p class="text-sm">Disabled</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500" disabled>Change</button>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Time format</span>
                <p class="text-sm">24-hour</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500">Change</button>
            </div>
        </div>
    </div>
</div>
