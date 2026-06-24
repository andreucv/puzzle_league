export function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
	return new Date(d.setDate(diff));
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function formatTime(date: Date, is24Hour: boolean = true) {
	return date.toLocaleTimeString('default', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: !is24Hour
	});
}
