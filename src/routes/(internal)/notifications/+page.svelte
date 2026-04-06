<script lang="ts">
    import type { Notification as DbNotification } from '$lib/.prisma/generated/prisma/browser';
    import Icon from '@iconify/svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import { t } from '$lib/translations';
    import { notificationState } from '../../../shareds/notifications.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';

    let notifications = $state<DbNotification[]>([]);
    let loading = $state(true);
    let error = $state('');

    const typeIcons: Record<string, string> = {
        INSCRIPTION_CREATED: 'mdi:account-plus-outline',
        INSCRIPTION_CONFIRMED: 'mdi:check-circle-outline',
        INSCRIPTION_REFUSED: 'mdi:close-circle-outline',
        INSCRIPTION_WAITLISTED: 'mdi:clock-alert-outline',
        COMPETITION_STARTED: 'mdi:play-circle-outline',
        COMPETITION_CANCELLED: 'mdi:cancel',
        ROLE_REQUEST_APPROVED: 'mdi:shield-check-outline',
        ROLE_REQUEST_REJECTED: 'mdi:shield-off-outline',
        USER_INTENT_CLAIMED: 'mdi:account-check-outline',
        GENERAL: 'mdi:bell-outline',
    };

    const typeColors: Record<string, string> = {
        INSCRIPTION_CREATED: 'text-primary-500',
        INSCRIPTION_CONFIRMED: 'text-success-500',
        INSCRIPTION_REFUSED: 'text-error-500',
        INSCRIPTION_WAITLISTED: 'text-secondary-500',
        COMPETITION_STARTED: 'text-primary-500',
        COMPETITION_CANCELLED: 'text-warning-500',
        ROLE_REQUEST_APPROVED: 'text-success-500',
        ROLE_REQUEST_REJECTED: 'text-error-500',
        USER_INTENT_CLAIMED: 'text-primary-500',
        GENERAL: 'text-surface-500',
    };

    async function fetchNotifications() {
        loading = true;
        error = '';
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            notifications = data.notifications;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            loading = false;
        }
    }

    async function markAllAsRead() {
        try {
            const res = await fetch('/api/notifications', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to mark as read');
            notifications = notifications.map((n) => ({ ...n, read: true }));
            notificationState.hasUnread = false;
        } catch (err) {
            console.error(err);
        }
    }

    async function markOneAsRead(id: string) {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to mark as read');
            notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
            notificationState.hasUnread = notifications.some((n) => !n.read);
        } catch (err) {
            console.error(err);
        }
    }

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);

        if (diffMin < 1) return $t('notifications.just_now');
        if (diffMin < 60) return `${diffMin}m`;
        if (diffH < 24) return `${diffH}h`;
        if (diffD < 7) return `${diffD}d`;
        return date.toLocaleDateString();
    }

    $effect(() => {
        fetchNotifications();
    });

    let unreadCount = $derived(notifications.filter((n) => !n.read).length);
    let hasUnread = $derived(unreadCount > 0);
</script>

<div class="container mx-auto max-w-2xl">
    <div class="flex items-center justify-between mb-4">
        <GenericTitle text={$t('notifications.title')}/>
        {#if hasUnread}
            <button
                type="button"
                class="btn btn-sm preset-tonal"
                onclick={markAllAsRead}
            >
                <Icon icon="mdi:check-all" width="1.1rem" height="1.1rem" />
                <span>{$t('notifications.mark_all_read')}</span>
            </button>
        {/if}
    </div>

    {#if loading}
        <div class="flex justify-center py-12">
            <Icon icon="mdi:loading" width="2rem" height="2rem" class="animate-spin text-surface-400" />
        </div>
    {:else if error}
        <Card>
            <div class="text-center py-8 text-error-500">
                <Icon icon="mdi:alert-circle-outline" width="2.5rem" height="2.5rem" class="mx-auto mb-2" />
                <p>{error}</p>
            </div>
        </Card>
    {:else if notifications.length === 0}
        <Card>
            <div class="text-center py-12 space-y-3">
                <Icon icon="mdi:bell-off-outline" width="3rem" height="3rem" class="mx-auto text-surface-400" />
                <p class="text-surface-500 font-medium">{$t('notifications.empty')}</p>
                <p class="text-surface-400 text-sm">{$t('notifications.empty_detail')}</p>
            </div>
        </Card>
    {:else}
        <div class="space-y-2">
            {#each notifications as notification (notification.id)}
                <Card>
                    <button
                        type="button"
                        class="w-full text-left transition-all duration-150
                            {notification.read ? 'opacity-70' : ''}"
                        onclick={() => {
                            if (!notification.read) markOneAsRead(notification.id);
                            if (notification.link) window.location.href = notification.link;
                        }}
                    >
                        <div class="flex items-start gap-3">
                            <!-- Type icon -->
                            <div class="flex-shrink-0 mt-0.5">
                                <Icon
                                    icon={typeIcons[notification.type] ?? 'mdi:bell-outline'}
                                    width="1.5rem"
                                    height="1.5rem"
                                    class={typeColors[notification.type] ?? 'text-surface-500'}
                                />
                            </div>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="font-semibold text-sm truncate {notification.read ? '' : 'text-surface-900 dark:text-surface-50'}">
                                        {notification.title}
                                    </span>
                                    {#if !notification.read}
                                        <span class="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500"></span>
                                    {/if}
                                </div>
                                <p class="text-sm text-surface-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                </p>
                                <div class="flex items-center gap-2 mt-1.5">
                                    <span class="text-xs text-surface-400">
                                        {formatDate(notification.createdAt as unknown as string)}
                                    </span>
                                    {#if notification.link}
                                        <Icon icon="mdi:open-in-new" width="0.75rem" height="0.75rem" class="text-surface-400" />
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </button>
                </Card>
            {/each}
        </div>
    {/if}
</div>
