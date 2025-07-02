export function formatTime(date: Date, is24Hour: boolean = true) {
    return date.toLocaleTimeString('default', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour
    });
}
