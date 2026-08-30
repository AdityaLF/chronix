import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Storage } from '../core/storage';
import { Tracker } from '../core/tracker';
import { getWeekData, getFourWeeksData, getFourWeeksAggData } from '../core/dashboardData';
import { computeMonotoneCubicSpline } from '../utils/spline';
import { formatTime, getDailyGoalSeconds, parseDurationToSeconds } from '../utils/time';
import { saveExportReportFile } from '../utils/export';
import { ExportScope } from '../types/dashboard';
import { getFileIcon } from '../constants/icons';
import { getDashboardHtml } from './dashboardHtml';

// Sidebar webview provider for Chronix dashboard
export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly storage: Storage,
        private readonly tracker: Tracker,
    ) {
        tracker.onDidChange(() => this.refresh());
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('chronix')) {
                this.refresh();
            }
        }, null, context.subscriptions);
    }

    resolveWebviewView(view: vscode.WebviewView) {
        this._view = view;
        view.webview.options = { enableScripts: true };
        view.webview.html = this.buildHtml();

        view.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'setGoal': {
                    const currentSec = getDailyGoalSeconds();
                    const currentFormatted = currentSec > 0 ? formatTime(currentSec) : '2h';
                    const input = await vscode.window.showInputBox({
                        title: 'Chronix: Daily Goal',
                        prompt: 'Enter daily goal (e.g. 2h, 30m, 1h 30m, 45s, or 0 to disable)',
                        value: currentSec > 0 ? currentFormatted : '2h',
                        validateInput: (val) => {
                            const sec = parseDurationToSeconds(val);
                            if (sec === null || sec < 0 || sec > 86400) {
                                return 'Please enter a valid duration up to 24h (e.g. 2h, 30m, 1h 30m, 45s, or 0 to disable)';
                            }
                            return null;
                        }
                    });
                    if (input !== undefined) {
                        const newSec = parseDurationToSeconds(input) ?? 0;
                        const goalVal = newSec > 0 ? formatTime(newSec) : '0';
                        await vscode.workspace.getConfiguration('chronix').update('dailyGoal', goalVal, vscode.ConfigurationTarget.Global);
                        this.refresh();
                        if (newSec > 0) {
                            vscode.window.showInformationMessage(`Chronix: Daily goal set to ${formatTime(newSec)}.`);
                        } else {
                            vscode.window.showInformationMessage('Chronix: Daily goal disabled.');
                        }
                    }
                    break;
                }
                case 'export': {
                    const scope: ExportScope = {
                        activePeriod: msg.activePeriod,
                        currentDayIndex: msg.currentDayIndex,
                        liveTodaySec: this.tracker.getTodaySeconds()
                    };
                    const exportData = this.storage.getExportData(scope);
                    const scopeLabel = exportData.scopeTitle;
                    const slug = (exportData.periodLabel || 'report').toLowerCase().replace(/\s+/g, '-');
                    const dateKey = this.storage.todayKey();

                    const selection = await vscode.window.showQuickPick([
                        {
                            label: '$(markdown) Export Markdown (.md)',
                            description: `Report for ${scopeLabel}`,
                            value: 'exportMarkdown'
                        },
                        {
                            label: '$(table) Export CSV (.csv)',
                            description: `Spreadsheet for ${scopeLabel}`,
                            value: 'exportCsv'
                        }
                    ], {
                        placeHolder: `Select export format for "${scopeLabel}"`
                    });
                    if (selection) {
                        if (selection.value === 'exportMarkdown') {
                            const md = this.storage.exportMarkdown(scope);
                            await saveExportReportFile(`chronix-report-${slug}-${dateKey}.md`, md, { 'Markdown Files': ['md'] }, 'Markdown');
                        } else if (selection.value === 'exportCsv') {
                            const csv = this.storage.exportCsv(scope);
                            await saveExportReportFile(`chronix-report-${slug}-${dateKey}.csv`, csv, { 'CSV Files': ['csv'] }, 'CSV');
                        }
                    }
                    break;
                }
                case 'openStorage': {
                    const doc = await vscode.workspace.openTextDocument(this.storage.getStoragePath());
                    vscode.window.showTextDocument(doc);
                    break;
                }
                case 'clearData': {
                    const answer = await vscode.window.showWarningMessage(
                        'Chronix: Are you sure you want to clear all recorded data? This action cannot be undone.',
                        { modal: true },
                        'Clear Data'
                    );
                    if (answer === 'Clear Data') {
                        this.storage.clearAll();
                        this.refresh();
                        vscode.window.showInformationMessage('Chronix: All tracking data has been cleared.');
                    }
                    break;
                }
                case 'openFile': {
                    if (msg.file) {
                        try {
                            let uri: vscode.Uri;
                            if (path.isAbsolute(msg.file)) {
                                uri = vscode.Uri.file(msg.file);
                            } else {
                                const wsPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                                uri = wsPath ? vscode.Uri.file(path.join(wsPath, msg.file)) : vscode.Uri.file(msg.file);
                            }
                            const doc = await vscode.workspace.openTextDocument(uri);
                            await vscode.window.showTextDocument(doc);
                        } catch {
                            vscode.window.showErrorMessage(`Unable to open file: ${msg.file}`);
                        }
                    }
                    break;
                }
                case 'openProject': {
                    const targetPath = msg.path || msg.project;
                    if (targetPath) {
                        let uri: vscode.Uri | undefined;
                        if (targetPath.startsWith('/') || /^[a-zA-Z]:[\\\/]/.test(targetPath)) {
                            uri = vscode.Uri.file(targetPath);
                        } else {
                            const folder = vscode.workspace.workspaceFolders?.find(f => f.name === msg.project || f.name === targetPath);
                            if (folder) uri = folder.uri;
                        }
                        if (uri && fs.existsSync(uri.fsPath)) {
                            const isCurrent = vscode.workspace.workspaceFolders?.some(f => f.uri.fsPath === uri!.fsPath);
                            if (isCurrent) {
                                await vscode.commands.executeCommand('workbench.files.action.focusFilesExplorer');
                            } else {
                                await vscode.commands.executeCommand('vscode.openFolder', uri, true);
                            }
                        } else {
                            vscode.window.showInformationMessage(`Project "${msg.project || targetPath}" could not be found.`);
                        }
                    }
                    break;
                }
            }
        });
    }

    refresh() {
        if (this._view) {
            this._view.webview.html = this.buildHtml();
        }
    }

    private buildHtml(): string {
        const active   = this.tracker.isActive();
        const curFile  = this.tracker.getCurrentFile();
        const curFileName = curFile ? path.basename(curFile) : '';
        let curFileIconSvg = '';
        if (curFile) {
            const iconRes = getFileIcon(curFile, 13);
            curFileIconSvg = iconRes ? iconRes.svg : '';
        }
        const todaySec = this.tracker.getTodaySeconds();
        const idleSec = this.tracker.getIdleSeconds();
        const chronixCfg = vscode.workspace.getConfiguration('chronix');
        const dailyGoalSeconds = getDailyGoalSeconds();
        const initialItemsLimit = chronixCfg.get<number>('initialItemsLimit', 5) || 5;
        const maxExpandedItems = chronixCfg.get<number>('maxExpandedItems', 10) || 10;

        const weekData = getWeekData(this.storage, this.tracker, dailyGoalSeconds);
        const fourWeeksData = getFourWeeksData(this.storage, this.tracker, dailyGoalSeconds);
        const fourWeeksAgg = getFourWeeksAggData(this.storage, this.tracker);
        const streak   = this.storage.getStreak();
        const weekTotalSec = weekData.reduce((acc, d) => acc + d.seconds, 0);
        const prevWeekData = (fourWeeksData[1] && fourWeeksData[1].days) ? fourWeeksData[1].days : [];
        const maxWeek  = Math.max(
            ...weekData.map(d => d.seconds),
            ...prevWeekData.map(d => d.seconds),
            1
        );
        const waveXs = [20, 60, 100, 140, 180, 220, 260];
        const toWavePoint = (d: { seconds: number }, i: number, isToday = false) => ({
            x: waveXs[i] ?? 20,
            y: 50 - ((d.seconds / maxWeek) * 40),
            ...(isToday ? { isToday: true } : {})
        });

        const initialPoints = weekData.map((d, i) => toWavePoint(d, i, i === 6));
        const initialLineD = computeMonotoneCubicSpline(initialPoints);
        const initialAreaD = `${initialLineD} L 260 56 L 20 56 Z`;

        let initialGhostLineD = '';
        if (prevWeekData.length === 7) {
            const prevPoints = prevWeekData.map((d, i) => toWavePoint(d, i));
            initialGhostLineD = computeMonotoneCubicSpline(prevPoints);
        }
        const goalPct = dailyGoalSeconds > 0 ? Math.min(Math.round((todaySec / dailyGoalSeconds) * 100), 100) : 0;
        const goalDone = dailyGoalSeconds > 0 && todaySec >= dailyGoalSeconds;
        const todayHourly = weekData[6] || { hourly: new Array(24).fill(0), peakHour: 'None', maxHourSec: 0 };

        return getDashboardHtml({
            active,
            curFile,
            curFileName,
            curFileIconSvg,
            todaySec,
            idleSec,
            weekData,
            fourWeeksData,
            fourWeeksAgg,
            streak,
            dailyGoalSeconds,
            goalPct,
            goalDone,
            todayHourly,
            waveXs,
            initialPoints,
            initialLineD,
            initialAreaD,
            initialGhostLineD,
            weekTotalSec,
            initialItemsLimit,
            maxExpandedItems
        });
    }
}
