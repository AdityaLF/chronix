import { HourlyStats } from '../types/dashboard';
import { formatTime } from './time';

export function sortedEntries(rec: Record<string, number>): Array<[string, number]> {
    return Object.entries(rec).sort(([, a], [, b]) => b - a);
}

export function getHourlyStats(byHour: Record<string, number> = {}): HourlyStats {
    const hourly = new Array(24).fill(0);
    let maxHourSec = 0;
    let peakHourIdx = -1;

    for (let h = 0; h < 24; h++) {
        const sec = byHour[String(h)] ?? byHour[h] ?? 0;
        hourly[h] = sec;
        if (sec > maxHourSec) {
            maxHourSec = sec;
            peakHourIdx = h;
        }
    }

    let peakHour = 'None';
    if (peakHourIdx >= 0 && maxHourSec > 0) {
        const hourStr = String(peakHourIdx).padStart(2, '0') + ':00';
        peakHour = `${hourStr} · ${formatTime(maxHourSec)}`;
    }

    return { hourly, peakHour, maxHourSec };
}
