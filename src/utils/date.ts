export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateKey(d: Date): string {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatDateRange(startDate: Date, endDate: Date): string {
    return startDate.getMonth() === endDate.getMonth()
        ? `${startDate.getDate()} – ${endDate.getDate()} ${MONTHS[endDate.getMonth()]}`
        : `${startDate.getDate()} ${MONTHS[startDate.getMonth()]} – ${endDate.getDate()} ${MONTHS[endDate.getMonth()]}`;
}

export function formatDayFullLabel(d: Date, isToday = false): string {
    const dayName = DAYS[d.getDay()];
    const dateStr = `${dayName}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    return isToday ? `Today (${dateStr})` : dateStr;
}

// Creates Date offset by N days at midday (DST safe)
export function createOffsetDate(daysAgo: number): Date {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    return d;
}
