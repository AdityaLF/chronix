import * as vscode from 'vscode';
import { Storage } from './core/storage';
import { Tracker } from './core/tracker';
import { formatTime } from './utils/time';
import { saveExportReportFile } from './utils/export';
import { SidebarProvider } from './webview/sidebarProvider';

let globalStorage: Storage | undefined;

export function activate(context: vscode.ExtensionContext) {
    const storage = new Storage(context);
    globalStorage = storage;
    const tracker = new Tracker(storage, context);
    const sidebar = new SidebarProvider(context, storage, tracker);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('chronix.sidebar', sidebar)
    );

    tracker.start();

    const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 900
    );
    statusBar.command = 'chronix.sidebar.focus';
    statusBar.tooltip = 'Chronix - click to open dashboard';
    context.subscriptions.push(statusBar);

    function updateStatusBar() {
        const sec    = tracker.getTodaySeconds();
        const active = tracker.isActive();
        const formatted = formatTime(Math.max(sec, 0));
        statusBar.text = active
            ? `$(clock) ${formatted} · Active`
            : `$(clock) ${formatted} · Idle`;
        statusBar.show();
    }

    updateStatusBar();
    tracker.onDidChange(() => updateStatusBar());
    const statusInterval = setInterval(() => updateStatusBar(), 1000);
    context.subscriptions.push({ dispose: () => clearInterval(statusInterval) });

    context.subscriptions.push(
        vscode.commands.registerCommand('chronix.exportMarkdown', async () => {
            const md = storage.exportMarkdown();
            const dateKey = storage.todayKey();
            await saveExportReportFile(`chronix-report-this-week-${dateKey}.md`, md, { 'Markdown Files': ['md'] }, 'Markdown');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('chronix.exportCsv', async () => {
            const csv = storage.exportCsv();
            const dateKey = storage.todayKey();
            await saveExportReportFile(`chronix-report-this-week-${dateKey}.csv`, csv, { 'CSV Files': ['csv'] }, 'CSV');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('chronix.clearData', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Delete ALL Chronix tracking data? This cannot be undone.',
                { modal: true }, 'Yes, Delete All'
            );
            if (confirm === 'Yes, Delete All') {
                storage.clearAll();
                sidebar.refresh();
                updateStatusBar();
                vscode.window.setStatusBarMessage('$(trash) Chronix: all data cleared', 2500);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('chronix.openStorageFile', async () => {
            const uri = vscode.Uri.file(storage.getStoragePath());
            const doc = await vscode.workspace.openTextDocument(uri);
            vscode.window.showTextDocument(doc);
        })
    );

    const welcomed = context.globalState.get<boolean>('chronix.welcomed');
    if (!welcomed) {
        vscode.window.showInformationMessage(
            'Chronix is now tracking your coding time, offline with data stored locally.',
            'Open Dashboard'
        ).then(choice => {
            if (choice === 'Open Dashboard') {
                vscode.commands.executeCommand('chronix.sidebar.focus');
            }
        });
        context.globalState.update('chronix.welcomed', true);
    }
}

export function deactivate() {
    globalStorage?.flush();
}
