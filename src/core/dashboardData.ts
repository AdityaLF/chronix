import * as vscode from 'vscode';
import * as path from 'path';
import { Storage } from './storage';
import { Tracker } from './tracker';
import { formatTime } from '../utils/time';
import { sortedEntries, getHourlyStats } from '../utils/stats';
import { NON_CODE_LANGUAGES, normalizeLanguage } from '../constants/languages';
import { getFileIcon, getLangIcon, displayName } from '../constants/icons';
import {
    DayData,
    FileDisplayItem,
    LanguageDisplayItem,
    ProjectDisplayItem,
    DayStatsItem,
    WeekStatsBucket,
    FourWeeksAggregateData
} from '../types/dashboard';

// Resolves workspace path for a project
export function resolveProjectPath(proj: string, byFile: Record<string, number> = {}): string {
    const wsFolder = vscode.workspace.workspaceFolders?.find(f => f.name === proj);
    if (wsFolder) return wsFolder.uri.fsPath;

    for (const fpath of Object.keys(byFile)) {
        const parts = fpath.split(path.sep);
        const idx = parts.lastIndexOf(proj);
        if (idx !== -1) {
            return parts.slice(0, idx + 1).join(path.sep);
        }
    }
    return proj;
}

// Aggregates coding time by language (excluding non-code files)
export function aggregateLanguages(byLanguage: Record<string, number> = {}): Array<[string, number]> {
    const merged: Record<string, number> = {};
    for (const [rawLang, sec] of Object.entries(byLanguage || {})) {
        if (sec <= 0) continue;
        const canonical = normalizeLanguage(rawLang);
        if (NON_CODE_LANGUAGES.has(canonical.toLowerCase())) continue;
        merged[canonical] = (merged[canonical] || 0) + sec;
    }
    return sortedEntries(merged);
}

const FOLDER_ICON_SVG = `<svg role="img" viewBox="0 0 16 16" width="14" height="14" fill="#3794ff" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 4H7.414L5.707 2.293A1 1 0 0 0 5 2H1.5z"/></svg>`;

// Formats file list with icons and percentages
export function mapFilesToDisplay(byFile: Record<string, number> = {}, totalSec: number, minSec = 0, limit?: number): FileDisplayItem[] {
    let rawFiles = sortedEntries(byFile);
    if (minSec > 0) rawFiles = rawFiles.filter(([, sec]) => sec >= minSec);
    if (limit !== undefined) rawFiles = rawFiles.slice(0, limit);
    return rawFiles.map(([file, sec]) => {
        const fname   = path.basename(file);
        const iconRes = getFileIcon(file, 14);
        const pct     = totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0;
        return {
            file,
            fname,
            color: iconRes.color,
            percent: pct,
            barWidth: sec > 0 ? Math.max(pct, 3) : 0,
            formattedTime: formatTime(sec),
            iconHtml: `<span class="file-icon-svg">${iconRes.svg}</span>`
        };
    });
}

// Formats language list with icons and percentages
export function mapLanguagesToDisplay(byLanguage: Record<string, number> = {}): LanguageDisplayItem[] {
    const rawLangs = aggregateLanguages(byLanguage);
    const langTotalSec = rawLangs.reduce((acc, [, s]) => acc + s, 0);
    return rawLangs.map(([lang, sec]) => {
        const pct     = langTotalSec > 0 ? Math.round((sec / langTotalSec) * 100) : 0;
        const iconRes = getLangIcon(lang, 14);
        return {
            lang,
            displayName: displayName(lang),
            color: iconRes.color,
            percent: pct,
            barWidth: sec > 0 ? Math.max(pct, 3) : 0,
            formattedTime: formatTime(sec),
            iconHtml: `<span class="lang-icon">${iconRes.svg}</span>`
        };
    });
}

// Formats project list with paths and percentages
export function mapProjectsToDisplay(byProject: Record<string, number> = {}, totalSec: number, byFile: Record<string, number> = {}): ProjectDisplayItem[] {
    const rawProjects = sortedEntries(byProject);
    return rawProjects.map(([proj, sec]) => {
        const pct      = totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0;
        const projPath = resolveProjectPath(proj, byFile);
        return {
            project: proj,
            path: projPath,
            percent: pct,
            barWidth: sec > 0 ? Math.max(pct, 3) : 0,
            formattedTime: formatTime(sec),
            iconHtml: `<span class="lang-icon">${FOLDER_ICON_SVG}</span>`
        };
    });
}

// Injects live unsaved time into the current hour
function injectLiveHourGap(
    byHour: Record<string, number>,
    tracker: Tracker,
    todaySec: number,
    storedSec: number
): Record<string, number> {
    const updated = { ...(byHour || {}) };
    const liveGap = tracker.isActive() ? Math.max(todaySec - storedSec, 0) : 0;
    if (liveGap > 0) {
        const currentHour = String(new Date().getHours());
        updated[currentHour] = (updated[currentHour] || 0) + liveGap;
    }
    return updated;
}

// Builds UI stats for a single day
function buildDayStatsItem(
    dateInfo: { date: string; label: string; fullLabel?: string },
    dayObj: DayData,
    daySec: number,
    isToday: boolean,
    tracker: Tracker,
    todaySec: number,
    goalSeconds: number
): DayStatsItem {
    const files = mapFilesToDisplay(dayObj.byFile, daySec);
    const languages = mapLanguagesToDisplay(dayObj.byLanguage);
    const projects = mapProjectsToDisplay(dayObj.byProject, daySec, dayObj.byFile);

    const byHour = isToday ? injectLiveHourGap(dayObj.byHour || {}, tracker, todaySec, dayObj.totalSeconds) : (dayObj.byHour || {});
    const hourlyStats = getHourlyStats(byHour);
    const goalPct = goalSeconds > 0 ? Math.min(Math.round((daySec / goalSeconds) * 100), 100) : 0;
    const goalMet = goalSeconds > 0 && daySec >= goalSeconds;

    return {
        date: dateInfo.date,
        label: dateInfo.label,
        fullLabel: dateInfo.fullLabel || (dateInfo.label === 'Today' ? 'Today' : `${dateInfo.label} (${dateInfo.date})`),
        formattedTotal: formatTime(daySec),
        seconds: daySec,
        isToday,
        goalPct,
        goalMet,
        files,
        languages,
        projects,
        hourly: hourlyStats.hourly,
        peakHour: hourlyStats.peakHour,
        maxHourSec: hourlyStats.maxHourSec
    };
}

// Gets 7-day stats for the current week
export function getWeekData(storage: Storage, tracker: Tracker, goalSeconds = 0): DayStatsItem[] {
    const today    = storage.getDay();
    const week     = storage.getThisWeekDays();
    const todaySec = tracker.getTodaySeconds();

    return week.map((d, i) => {
        const isToday = (i === 6);
        const dayObj = isToday ? today : storage.getDay(d.date);
        const dayTotalSec = isToday ? Math.max(todaySec, 0) : dayObj.totalSeconds;
        return buildDayStatsItem(d, dayObj, dayTotalSec, isToday, tracker, todaySec, goalSeconds);
    });
}

// Gets weekly bucket stats for the last 4 weeks
export function getFourWeeksData(storage: Storage, tracker: Tracker, goalSeconds = 0): WeekStatsBucket[] {
    const rawWeeks = storage.getFourWeeks();
    const todaySec = tracker.getTodaySeconds();

    return rawWeeks.map((w, wIdx) => {
        const isThisWeek = (wIdx === 0);
        const totalSec = isThisWeek ? (w.totalSeconds - storage.getDay().totalSeconds + Math.max(todaySec, 0)) : w.totalSeconds;

        const days = w.days.map((d, dIdx) => {
            const isToday = isThisWeek && (dIdx === 6);
            const dayObj  = isToday ? storage.getDay() : storage.getDay(d.date);
            const daySec  = isToday ? Math.max(todaySec, 0) : d.seconds;
            return buildDayStatsItem(d, dayObj, daySec, isToday, tracker, todaySec, goalSeconds);
        });

        const files = mapFilesToDisplay(w.byFile, totalSec);
        const languages = mapLanguagesToDisplay(w.byLanguage);
        const projects = mapProjectsToDisplay(w.byProject, totalSec, w.byFile);

        const weekByHour = isThisWeek
            ? injectLiveHourGap(w.byHour || {}, tracker, todaySec, storage.getDay().totalSeconds)
            : (w.byHour || {});
        const weekHourlyStats = getHourlyStats(weekByHour);

        return {
            weekIndex: w.weekIndex,
            label: w.label,
            dateRange: w.dateRange,
            totalSeconds: totalSec,
            formattedTotal: formatTime(totalSec),
            days,
            files,
            languages,
            projects,
            hourly: weekHourlyStats.hourly,
            peakHour: weekHourlyStats.peakHour,
            maxHourSec: weekHourlyStats.maxHourSec
        };
    });
}

// Gets aggregated 28-day overview stats
export function getFourWeeksAggData(storage: Storage, tracker: Tracker): FourWeeksAggregateData {
    const rawWeeks = storage.getFourWeeks();
    const todaySec = tracker.getTodaySeconds();
    let totalSec = 0;
    const fileMap: Record<string, number> = {};
    const langMap: Record<string, number> = {};
    const projMap: Record<string, number> = {};
    const hourMap: Record<string, number> = {};

    rawWeeks.forEach((w, wIdx) => {
        const isThisWeek = (wIdx === 0);
        const wTotal = isThisWeek ? (w.totalSeconds - storage.getDay().totalSeconds + Math.max(todaySec, 0)) : w.totalSeconds;
        totalSec += wTotal;

        for (const [f, s] of Object.entries(w.byFile || {})) {
            fileMap[f] = (fileMap[f] || 0) + s;
        }
        for (const [l, s] of Object.entries(w.byLanguage || {})) {
            langMap[l] = (langMap[l] || 0) + s;
        }
        for (const [p, s] of Object.entries(w.byProject || {})) {
            projMap[p] = (projMap[p] || 0) + s;
        }
        for (const [h, s] of Object.entries(w.byHour || {})) {
            hourMap[h] = (hourMap[h] || 0) + s;
        }
    });

    const finalHourMap = injectLiveHourGap(hourMap, tracker, todaySec, storage.getDay().totalSeconds);
    const fourWeeksHourlyStats = getHourlyStats(finalHourMap);
    const files = mapFilesToDisplay(fileMap, totalSec, 5, 15);
    const languages = mapLanguagesToDisplay(langMap);
    const projects = mapProjectsToDisplay(projMap, totalSec, fileMap);

    const summary = storage.getFourWeeksSummary();
    let liveActiveDays = summary.activeDays;
    if (todaySec > 0 && (storage.getDay().totalSeconds === 0)) {
        liveActiveDays++;
    }
    const restDays = Math.max(28 - liveActiveDays, 0);

    return {
        totalSeconds: totalSec,
        dateRange: summary.dateRange,
        activeDays: liveActiveDays,
        restDays,
        maxStreak: summary.maxStreak,
        avgSecondsPerDay: summary.avgSecondsPerDay,
        peakDay: summary.peakDay,
        files,
        languages,
        projects,
        hourly: fourWeeksHourlyStats.hourly,
        peakHour: fourWeeksHourlyStats.peakHour,
        maxHourSec: fourWeeksHourlyStats.maxHourSec
    };
}
