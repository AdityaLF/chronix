export interface DayData {
    totalSeconds: number;
    byLanguage: Record<string, number>;
    byFile: Record<string, number>;
    byProject: Record<string, number>;
    byHour?: Record<string, number>;
}

export interface StorageData {
    version: number;
    days: Record<string, DayData>;
}

export interface ExportScope {
    activePeriod?: string;
    currentDayIndex?: number;
    liveTodaySec?: number;
}

export interface HourlyStats {
    hourly: number[];
    peakHour: string;
    maxHourSec: number;
}

export interface FileDisplayItem {
    file: string;
    fname: string;
    color: string;
    percent: number;
    barWidth: number;
    formattedTime: string;
    iconHtml: string;
}

export interface LanguageDisplayItem {
    lang: string;
    displayName: string;
    color: string;
    percent: number;
    barWidth: number;
    formattedTime: string;
    iconHtml: string;
}

export interface ProjectDisplayItem {
    project: string;
    path: string;
    percent: number;
    barWidth: number;
    formattedTime: string;
    iconHtml: string;
}

export interface DayStatsItem {
    date: string;
    label: string;
    fullLabel: string;
    formattedTotal: string;
    seconds: number;
    isToday: boolean;
    goalPct: number;
    goalMet: boolean;
    files: FileDisplayItem[];
    languages: LanguageDisplayItem[];
    projects: ProjectDisplayItem[];
    hourly: number[];
    peakHour: string;
    maxHourSec: number;
}

export interface WeekStatsBucket {
    weekIndex: number;
    label: string;
    dateRange: string;
    totalSeconds: number;
    formattedTotal: string;
    days: DayStatsItem[];
    files: FileDisplayItem[];
    languages: LanguageDisplayItem[];
    projects: ProjectDisplayItem[];
    hourly: number[];
    peakHour: string;
    maxHourSec: number;
}

export interface PeakDayInfo {
    date: string;
    label: string;
    seconds: number;
}

export interface FourWeeksSummaryData {
    totalSeconds: number;
    activeDays: number;
    restDays: number;
    maxStreak: number;
    avgSecondsPerDay: number;
    peakDay: PeakDayInfo | null;
    days: Array<{ date: string; label: string; fullLabel?: string; seconds: number }>;
    dateRange: string;
}

export interface FourWeeksAggregateData {
    totalSeconds: number;
    dateRange: string;
    activeDays: number;
    restDays: number;
    maxStreak: number;
    avgSecondsPerDay: number;
    peakDay: PeakDayInfo | null;
    files: FileDisplayItem[];
    languages: LanguageDisplayItem[];
    projects: ProjectDisplayItem[];
    hourly: number[];
    peakHour: string;
    maxHourSec: number;
}

export interface WavePoint {
    x: number;
    y: number;
    isToday?: boolean;
}

export interface DashboardHtmlParams {
    active: boolean;
    curFile: string;
    curFileName: string;
    curFileIconSvg: string;
    todaySec: number;
    idleSec: number;
    weekData: DayStatsItem[];
    fourWeeksData: WeekStatsBucket[];
    fourWeeksAgg: FourWeeksAggregateData;
    streak: number;
    dailyGoalSeconds: number;
    goalPct: number;
    goalDone: boolean;
    todayHourly: {
        hourly: number[];
        peakHour: string;
        maxHourSec: number;
    };
    waveXs: number[];
    initialPoints: WavePoint[];
    initialLineD: string;
    initialAreaD: string;
    initialGhostLineD: string;
    weekTotalSec: number;
    initialItemsLimit: number;
    maxExpandedItems: number;
}
