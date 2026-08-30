import * as vscode from 'vscode';

export function formatTime(totalSeconds: number): string {
    if (totalSeconds < 60) { return `${Math.floor(totalSeconds)}s`; }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h === 0) { return `${m}m`; }
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Parses duration string to seconds
export function parseDurationToSeconds(input: string | number): number | null {
    if (typeof input === 'number') {
        if (isNaN(input) || input < 0) return null;
        return Math.round(input);
    }
    const str = String(input).trim().toLowerCase();
    if (!str || str === '0' || str === 'off' || str === 'none' || str === 'disable') {
        return 0;
    }

    const unitRegex = /(?:(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours))|(?:(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes))|(?:(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds))/g;
    let match: RegExpExecArray | null;
    let totalSec = 0;
    let matchedAny = false;

    while ((match = unitRegex.exec(str)) !== null) {
        matchedAny = true;
        if (match[1] !== undefined) totalSec += parseFloat(match[1]) * 3600;
        if (match[2] !== undefined) totalSec += parseFloat(match[2]) * 60;
        if (match[3] !== undefined) totalSec += parseFloat(match[3]);
    }

    if (matchedAny) {
        return Math.round(totalSec);
    }

    const num = parseFloat(str);
    if (!isNaN(num) && num >= 0) {
        return Math.round(num * 3600);
    }

    return null;
}

export function getDailyGoalSeconds(): number {
    const config = vscode.workspace.getConfiguration('chronix');
    const rawGoal = config.get<string | number>('dailyGoal');
    if (rawGoal !== undefined && rawGoal !== null && rawGoal !== '') {
        const parsed = parseDurationToSeconds(rawGoal);
        if (parsed !== null && parsed > 0) {
            return parsed;
        }
    }
    const legacySec = config.get<number>('dailyGoalSeconds', 0);
    if (legacySec && legacySec > 0) {
        return legacySec;
    }
    const legacyHours = config.get<number>('dailyGoalHours', 0);
    if (legacyHours && legacyHours > 0) {
        return Math.round(legacyHours * 3600);
    }
    return 0;
}
