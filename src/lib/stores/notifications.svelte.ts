export let notificationState = $state({ hasUnread: false });

export async function refreshHasUnread() {
    try {
        const res = await fetch('/api/notifications/unread-count');
        if (res.ok) {
            notificationState.hasUnread = (await res.json()).hasUnread;
        }
    } catch {
        // silently ignore – dot simply won't show
    }
}
