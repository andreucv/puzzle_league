<script lang="ts">
    /**
     * "Notify me when registration opens" bell for a closed Category. The parent decides whether
     * it is actionable (`canFollowCategory`); this only renders the logged-out / not-following /
     * following states and calls the follow API. State is kept locally (no page reload).
     */
    import { t } from '$lib/translations';
    import { showErrorToast } from '$lib/utils/toast';
    import BellOutlineIcon from '@iconify-svelte/mdi/bell-outline';
    import BellCheckIcon from '@iconify-svelte/mdi/bell-check';

    let {
        categoryId,
        following: initialFollowing = false,
        loggedIn,
        loginHref,
    }: {
        categoryId: number;
        following?: boolean;
        loggedIn: boolean;
        loginHref?: string;
    } = $props();

    // svelte-ignore state_referenced_locally
    let following = $state(initialFollowing);
    let saving = $state(false);

    async function toggle() {
        const next = !following;
        saving = true;
        following = next;
        try {
            const response = await fetch(`/api/categories/${categoryId}/follow`, { method: next ? 'POST' : 'DELETE' });
            if (!response.ok) {
                following = !next;
                const result = await response.json().catch(() => ({}));
                showErrorToast($t('category_follow.follow_error'), result.error);
            }
        } catch {
            following = !next;
            showErrorToast($t('category_follow.follow_error'));
        } finally {
            saving = false;
        }
    }
</script>

{#if !loggedIn}
    <div class="flex flex-col items-center gap-1">
        <button type="button" class="btn btn-sm preset-tonal-surface gap-1.5 w-full" disabled data-testid="follow-category-{categoryId}" data-following="false">
            <BellOutlineIcon width="1rem" height="1rem" />
            {$t('category_follow.notify_me')}
        </button>
        {#if loginHref}
            <a href={loginHref} class="text-xs anchor" data-testid="follow-category-login-{categoryId}">{$t('category_follow.login_to_notify')}</a>
        {/if}
    </div>
{:else if following}
    <button
        type="button"
        class="btn btn-sm preset-tonal-success gap-1.5 w-full"
        disabled={saving}
        onclick={toggle}
        title={$t('category_follow.stop')}
        data-testid="follow-category-{categoryId}"
        data-following="true"
    >
        <BellCheckIcon width="1rem" height="1rem" />
        {$t('category_follow.following')}
        <span class="text-xs opacity-75">· {$t('category_follow.stop')}</span>
    </button>
{:else}
    <button
        type="button"
        class="btn btn-sm preset-outlined-primary-500 gap-1.5 w-full"
        disabled={saving}
        onclick={toggle}
        data-testid="follow-category-{categoryId}"
        data-following="false"
    >
        <BellOutlineIcon width="1rem" height="1rem" />
        {$t('category_follow.notify_me')}
    </button>
{/if}
