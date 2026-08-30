import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NON_CODE_LANGUAGES, inferLanguageFromPath, normalizeLanguage, displayName } from '../constants/languages';
import { formatTime } from '../utils/time';
import { DAYS, formatDateKey, formatDateRange, formatDayFullLabel, createOffsetDate } from '../utils/date';
import { sortedEntries } from '../utils/stats';
import {
    DayData,
    StorageData,
    ExportScope,
    FourWeeksSummaryData
} from '../types/dashboard';

// Local JSON storage and metrics engine
export class Storage {
    private data: StorageData = { version: 1, days: {} };
    private readonly filePath: string;
    private dirty = false;
    private saveTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(context: vscode.ExtensionContext) {
        const dir = context.globalStorageUri.fsPath;
        fs.mkdirSync(dir, { recursive: true });
        this.filePath = path.join(dir, 'chronix-data.json');
        this.load();

        // Auto-save every 30s
        const periodicSave = setInterval(() => this.flushIfDirty(), 30_000);
        context.subscriptions.push({
            dispose: () => {
                clearInterval(periodicSave);
                this.flush();
            },
        });
    }

    // Records coding time for file, language, and project
    addTime(file: string, language: string, project: string, seconds: number) {
        if (seconds <= 0) { return; }
        const day  = this.ensureDay(this.todayKey());
        const lang = normalizeLanguage(language);
        const hour = String(new Date().getHours());
        day.totalSeconds       += seconds;
        if (!NON_CODE_LANGUAGES.has(lang.toLowerCase())) {
            day.byLanguage[lang] = (day.byLanguage[lang] ?? 0) + seconds;
        }
        day.byFile[file]        = (day.byFile[file]       ?? 0) + seconds;
        day.byProject[project]  = (day.byProject[project] ?? 0) + seconds;
        day.byHour              = day.byHour ?? {};
        day.byHour[hour]        = (day.byHour[hour]       ?? 0) + seconds;
        this.dirty = true;
        if (this.saveTimer) { clearTimeout(this.saveTimer); }
        this.saveTimer = setTimeout(() => this.flush(), 3_000);
    }

    getTodayTotal(): number {
        return this.data.days[this.todayKey()]?.totalSeconds ?? 0;
    }

    getDay(key?: string): DayData {
        return this.data.days[key ?? this.todayKey()] ?? this.emptyDay();
    }

    getThisWeekDays(): Array<{ date: string; label: string; fullLabel: string; seconds: number }> {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = createOffsetDate(i);
            const key = formatDateKey(d);
            const dayName = DAYS[d.getDay()];
            const fullLabel = formatDayFullLabel(d, i === 0);
            result.push({
                date: key,
                label: i === 0 ? 'Today' : dayName,
                fullLabel,
                seconds: this.data.days[key]?.totalSeconds ?? 0,
            });
        }
        return result;
    }

    getFourWeeksSummary(): FourWeeksSummaryData {
        let totalSeconds = 0;
        let activeDays   = 0;
        let currentStreak = 0;
        let maxStreak     = 0;
        let peakDay: { date: string; label: string; seconds: number } | null = null;
        let maxSec       = 0;
        const days = [];

        for (let i = 27; i >= 0; i--) {
            const d = createOffsetDate(i);
            const key = formatDateKey(d);
            const sec = this.data.days[key]?.totalSeconds ?? 0;
            totalSeconds += sec;
            if (sec > 0) {
                activeDays++;
                currentStreak++;
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
            if (sec > maxSec) {
                maxSec = sec;
                peakDay = {
                    date: key,
                    label: formatDayFullLabel(d),
                    seconds: sec
                };
            }

            days.push({
                date: key,
                label: formatDayFullLabel(d),
                seconds: sec
            });
        }

        const restDays = Math.max(28 - activeDays, 0);
        const avgSecondsPerDay = Math.round(totalSeconds / 28);
        const startDateObj = createOffsetDate(27);
        const endDateObj = createOffsetDate(0);
        const dateRange = formatDateRange(startDateObj, endDateObj);
        return {
            totalSeconds,
            activeDays,
            restDays,
            maxStreak,
            avgSecondsPerDay,
            peakDay,
            days,
            dateRange
        };
    }

    getFourWeeks() {
        const weeks = [];

        for (let w = 0; w < 4; w++) {
            const days = [];
            let totalSeconds = 0;
            const byFile: Record<string, number> = {};
            const byLanguage: Record<string, number> = {};
            const byProject: Record<string, number> = {};
            const byHour: Record<string, number> = {};

            const endDaysAgo = w * 7;
            const startDaysAgo = endDaysAgo + 6;

            const startDateObj = createOffsetDate(startDaysAgo);
            const endDateObj = createOffsetDate(endDaysAgo);

            for (let i = 6; i >= 0; i--) {
                const daysAgo = endDaysAgo + i;
                const d = createOffsetDate(daysAgo);
                const key = formatDateKey(d);
                const dayData = this.data.days[key];
                const sec = dayData?.totalSeconds ?? 0;
                totalSeconds += sec;
                const dayName = DAYS[d.getDay()];
                const fullLabel = formatDayFullLabel(d, daysAgo === 0);

                days.push({
                    date: key,
                    label: daysAgo === 0 ? 'Today' : dayName,
                    fullLabel,
                    seconds: sec
                });

                if (dayData) {
                    for (const [f, s] of Object.entries(dayData.byFile || {})) {
                        byFile[f] = (byFile[f] || 0) + s;
                    }
                    for (const [l, s] of Object.entries(dayData.byLanguage || {})) {
                        byLanguage[l] = (byLanguage[l] || 0) + s;
                    }
                    for (const [p, s] of Object.entries(dayData.byProject || {})) {
                        byProject[p] = (byProject[p] || 0) + s;
                    }
                    for (const [h, s] of Object.entries(dayData.byHour || {})) {
                        byHour[h] = (byHour[h] || 0) + s;
                    }
                }
            }

            const label = w === 0 ? 'This Week' : (w === 1 ? 'Last Week' : `${w} Weeks Ago`);
            const dateRange = formatDateRange(startDateObj, endDateObj);

            weeks.push({
                weekIndex: w,
                label,
                dateRange,
                totalSeconds,
                days,
                byFile,
                byLanguage,
                byProject,
                byHour
            });
        }

        return weeks;
    }

    getStreak(): number {
        let streak = 0;
        const now = createOffsetDate(0);
        const todayKey = formatDateKey(now);
        const todaySec = this.data.days[todayKey]?.totalSeconds ?? 0;

        let startOffset = 0;
        if (todaySec > 0) {
            streak++;
            startOffset = 1;
        } else {
            const y = createOffsetDate(1);
            const yKey = formatDateKey(y);
            if ((this.data.days[yKey]?.totalSeconds ?? 0) === 0) {
                return 0;
            }
            startOffset = 1;
        }

        for (let i = startOffset; i < 365; i++) {
            const d = createOffsetDate(i);
            const key = formatDateKey(d);
            if ((this.data.days[key]?.totalSeconds ?? 0) > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    getExportData(scope?: ExportScope) {
        const streak = this.getStreak();
        const activePeriod = scope?.activePeriod || 'thisweek';
        const liveTodaySec = scope?.liveTodaySec;

        if (activePeriod === 'fourweeks') {
            const summary = this.getFourWeeksSummary();
            const rawWeeks = this.getFourWeeks();
            const fileMap: Record<string, number> = {};
            const langMap: Record<string, number> = {};
            const projMap: Record<string, number> = {};

            rawWeeks.forEach((w) => {
                for (const [f, s] of Object.entries(w.byFile || {})) { fileMap[f] = (fileMap[f] || 0) + s; }
                for (const [l, s] of Object.entries(w.byLanguage || {})) { langMap[l] = (langMap[l] || 0) + s; }
                for (const [p, s] of Object.entries(w.byProject || {})) { projMap[p] = (projMap[p] || 0) + s; }
            });

            return {
                scopeTitle: `Last 4 Weeks (${summary.dateRange})`,
                periodLabel: 'Last 4 Weeks',
                dateRange: summary.dateRange,
                totalSeconds: summary.totalSeconds,
                activeDays: summary.activeDays,
                avgSecondsPerDay: summary.avgSecondsPerDay,
                streak,
                days: summary.days,
                files: sortedEntries(fileMap),
                languages: sortedEntries(langMap).filter(([l]) => !NON_CODE_LANGUAGES.has(l.toLowerCase())),
                projects: sortedEntries(projMap)
            };
        }

        const wIdx = (activePeriod.startsWith('week') && activePeriod !== 'thisweek')
            ? parseInt(activePeriod.replace('week', '') || '0', 10)
            : 0;
        const weeks = this.getFourWeeks();
        const targetWeek = weeks[wIdx] || weeks[0];
        const isThisWeek = (wIdx === 0);
        const totalSec = (isThisWeek && liveTodaySec !== undefined)
            ? (targetWeek.totalSeconds - this.getDay().totalSeconds + Math.max(liveTodaySec, 0))
            : targetWeek.totalSeconds;
        const avgSec = Math.round(totalSec / 7);

        return {
            scopeTitle: `${targetWeek.label} (${targetWeek.dateRange})`,
            periodLabel: targetWeek.label,
            dateRange: targetWeek.dateRange,
            totalSeconds: totalSec,
            activeDays: targetWeek.days.filter(d => d.seconds > 0).length,
            avgSecondsPerDay: avgSec,
            streak,
            days: targetWeek.days,
            files: sortedEntries(targetWeek.byFile),
            languages: sortedEntries(targetWeek.byLanguage).filter(([l]) => !NON_CODE_LANGUAGES.has(l.toLowerCase())),
            projects: sortedEntries(targetWeek.byProject)
        };
    }

    exportMarkdown(scope?: ExportScope): string {
        const data = this.getExportData(scope);
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        let md = `# Chronix Activity Report — ${data.scopeTitle}\n\n`;
        md += `> Generated: **${now}** · Total Time: **${formatTime(data.totalSeconds)}** · Current Streak: **${data.streak} day${data.streak === 1 ? '' : 's'}**\n\n`;

        md += `### Files (${data.files.length})\n\n`;
        if (data.files.length === 0) {
            md += `*No files tracked for this period.*\n\n`;
        } else {
            md += `| File | Time | Share |\n|---|---|---|\n`;
            for (const [file, sec] of data.files) {
                const pct = data.totalSeconds > 0 ? Math.round((sec / data.totalSeconds) * 100) : 0;
                md += `| \`${path.basename(file)}\` | ${formatTime(sec)} | ${pct}% |\n`;
            }
            md += `\n`;
        }

        const langTotalSec = data.languages.reduce((acc, [, s]) => acc + s, 0);
        md += `### Languages (${data.languages.length})\n\n`;
        if (data.languages.length === 0) {
            md += `*No languages tracked for this period.*\n\n`;
        } else {
            md += `| Language | Time | Share |\n|---|---|---|\n`;
            for (const [lang, sec] of data.languages) {
                const pct = langTotalSec > 0 ? Math.round((sec / langTotalSec) * 100) : 0;
                md += `| **${displayName(lang)}** | ${formatTime(sec)} | ${pct}% |\n`;
            }
            md += `\n`;
        }

        md += `### Projects (${data.projects.length})\n\n`;
        if (data.projects.length === 0) {
            md += `*No projects tracked for this period.*\n\n`;
        } else {
            md += `| Project | Time | Share |\n|---|---|---|\n`;
            for (const [proj, sec] of data.projects) {
                const pct = data.totalSeconds > 0 ? Math.round((sec / data.totalSeconds) * 100) : 0;
                md += `| **${proj}** | ${formatTime(sec)} | ${pct}% |\n`;
            }
            md += `\n`;
        }

        if (data.days.length > 1) {
            md += `## Daily Breakdown\n\n`;
            md += `| Day / Date | Time | Share |\n|---|---|---|\n`;
            for (const d of data.days) {
                const label = ('fullLabel' in d && d.fullLabel) ? d.fullLabel : (d.label || d.date);
                const pct = data.totalSeconds > 0 ? Math.round((d.seconds / data.totalSeconds) * 100) : 0;
                md += `| ${label} | ${formatTime(d.seconds)} | ${pct}% |\n`;
            }
            md += `\n`;
        }

        return md;
    }

    exportCsv(scope?: ExportScope): string {
        const data = this.getExportData(scope);
        let csv = 'DateRange,Category,Name,DurationSeconds,FormattedTime\n';

        for (const [file, sec] of data.files) {
            csv += `"${data.dateRange}","File","${path.basename(file).replace(/"/g, '""')}",${sec},"${formatTime(sec)}"\n`;
        }
        for (const [lang, sec] of data.languages) {
            csv += `"${data.dateRange}","Language","${displayName(lang)}",${sec},"${formatTime(sec)}"\n`;
        }
        for (const [proj, sec] of data.projects) {
            csv += `"${data.dateRange}","Project","${proj.replace(/"/g, '""')}",${sec},"${formatTime(sec)}"\n`;
        }

        return csv;
    }

    clearAll() {
        this.data = { version: 1, days: {} };
        this.flush();
    }

    getStoragePath(): string {
        return this.filePath;
    }

    public todayKey(): string {
        return formatDateKey(createOffsetDate(0));
    }

    private ensureDay(key: string): DayData {
        if (!this.data.days[key]) { this.data.days[key] = this.emptyDay(); }
        return this.data.days[key];
    }

    private emptyDay(): DayData {
        return { totalSeconds: 0, byLanguage: {}, byFile: {}, byProject: {}, byHour: {} };
    }

    private load() {
        try {
            if (fs.existsSync(this.filePath)) {
                this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
                for (const day of Object.values(this.data.days || {})) {
                    if (!day.byLanguage) day.byLanguage = {};

                    for (const [file, sec] of Object.entries(day.byFile || {})) {
                        const inferred = inferLanguageFromPath(file);
                        if (inferred) {
                            day.byLanguage[inferred] = Math.max(day.byLanguage[inferred] || 0, sec);
                        }
                    }

                    const merged: Record<string, number> = {};
                    for (const [lk, sec] of Object.entries(day.byLanguage)) {
                        if (sec <= 0) continue;
                        const canonical = normalizeLanguage(lk);
                        if (!NON_CODE_LANGUAGES.has(canonical.toLowerCase())) {
                            merged[canonical] = (merged[canonical] || 0) + sec;
                        }
                    }
                    day.byLanguage = merged;
                }
            }
        } catch { /* start fresh */ }
    }

    public flush() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
            this.dirty = false;
        } catch { /* ignore */ }
    }

    private flushIfDirty() { if (this.dirty) { this.flush(); } }
}
