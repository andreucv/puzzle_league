<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { t } from '$lib/translations';
    import Card from '$lib/components/common/card/Card.svelte';
    import ArrowLeftIcon from '@iconify-svelte/mdi/arrow-left';
    import AccountIcon from '@iconify-svelte/mdi/account';
    import EmailOutlineIcon from '@iconify-svelte/mdi/email-outline';
    import MapMarkerOutlineIcon from '@iconify-svelte/mdi/map-marker-outline';
    import CalendarIcon from '@iconify-svelte/mdi/calendar';
    import { getCountryNameFromCode, getCountryFlag } from '$lib/utils/country_utils';

    let { data } = $props();
    let profile = $derived(data.profile);

    const formatDate = (date: Date | string) => {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(dateObj);
    };
</script>

<div class="container mx-auto max-w-2xl space-y-4">
    <div class="flex items-center gap-2">
        <button type="button" class="btn btn-sm preset-tonal" onclick={() => history.back()}>
            <ArrowLeftIcon width="1.2rem" height="1.2rem" />
        </button>
        <h4 class="h4 font-sans font-medium">{$t('public_profile.title')}</h4>
    </div>

    <Card>
        <!-- Avatar + Name -->
        <div class="flex flex-col items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-700">
            {#if profile.image}
                <Avatar class="w-20 h-20 ring-2 ring-surface-300 dark:ring-surface-600">
                    <Avatar.Image src={profile.image} alt={profile.name} />
                    <Avatar.Fallback class="text-xl">{profile.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
                </Avatar>
            {:else}
                <div class="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center ring-2 ring-surface-300 dark:ring-surface-600">
                    <span class="text-2xl font-bold text-white">
                        {profile.name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
                    </span>
                </div>
            {/if}
            <h3 class="h3 font-semibold">{profile.name}</h3>
        </div>

        <!-- Contact Information -->
        <div class="space-y-3 pt-2">
            <h4 class="h4 flex items-center gap-2">
                <AccountIcon width="1.2rem" height="1.2rem" />
                {$t('public_profile.contact_info')}
            </h4>

            <!-- Email -->
            <div class="flex items-center gap-3 text-surface-700 dark:text-surface-300">
                <EmailOutlineIcon width="1.1rem" height="1.1rem" class="shrink-0 text-surface-500" />
                <a href="mailto:{profile.email}" class="hover:text-primary-500 hover:underline transition-colors">
                    {profile.email}
                </a>
            </div>

            <!-- Country -->
            {#if profile.country}
                <div class="flex items-center gap-3 text-surface-700 dark:text-surface-300">
                    <MapMarkerOutlineIcon width="1.1rem" height="1.1rem" class="shrink-0 text-surface-500" />
                    <span>{getCountryFlag(profile.country)} {getCountryNameFromCode(profile.country)}</span>
                </div>
            {/if}

            <!-- Member since -->
            <div class="flex items-center gap-3 text-surface-700 dark:text-surface-300">
                <CalendarIcon width="1.1rem" height="1.1rem" class="shrink-0 text-surface-500" />
                <span>{$t('public_profile.member_since')} {formatDate(profile.createdAt)}</span>
            </div>
        </div>
    </Card>
</div>
