import * as vscode from 'vscode';
import * as path from 'path';
import { Storage } from './storage';
import { getDailyGoalSeconds, formatTime } from '../utils/time';
import { inferLanguageFromPath } from '../constants/languages';

const IDLE_TIMEOUT_SEC   = 120;
const HEARTBEAT_THROTTLE = 15_000;

export function resolveDocLanguage(doc: vscode.TextDocument): string {
    const inferred = inferLanguageFromPath(doc.uri.fsPath);
    if (inferred) return inferred;
    return doc.languageId || 'plaintext';
}

// Activity tracker for VS Code events and idle detection
export class Tracker {
    private lastBeatAt    = 0;
    private lastBeatFile  = '';
    private lastActiveAt  = Date.now();

    private curFile     = '';
    private curLanguage = '';
    private curProject  = '';
    private isFocused   = true;

    private readonly _onChange = new vscode.EventEmitter<void>();
    readonly onDidChange = this._onChange.event;

    constructor(
        private readonly storage: Storage,
        private readonly context: vscode.ExtensionContext,
    ) {}

    start() {
        // Window focus
        vscode.window.onDidChangeWindowState(state => {
            this.isFocused = state.focused;
            if (!state.focused) {
                this.flushCurrentGap();
            } else {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.uri.scheme === 'file') {
                    this.beat(editor.document, true);
                }
            }
        }, null, this.context.subscriptions);

        // Active editor switch
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.uri.scheme === 'file') {
                this.beat(editor.document, true);
            } else {
                this.flushCurrentGap();
            }
        }, null, this.context.subscriptions);

        // Text edits
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.scheme === 'file') {
                this.beat(e.document, false);
            }
        }, null, this.context.subscriptions);

        // Cursor selection
        vscode.window.onDidChangeTextEditorSelection(e => {
            if (e.textEditor.document.uri.scheme === 'file') {
                this.beat(e.textEditor.document, false);
            }
        }, null, this.context.subscriptions);

        // 1s background tick
        const tick = setInterval(() => {
            if (!this.checkIdleState() && this.isActive()) {
                this.checkGoalNotification();
            }
        }, 1_000);
        this.context.subscriptions.push({ dispose: () => clearInterval(tick) });

        // Config updates
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('chronix')) {
                this.checkGoalNotification();
            }
        }, null, this.context.subscriptions);

        // Initial check
        const initialEditor = vscode.window.activeTextEditor;
        if (initialEditor && initialEditor.document.uri.scheme === 'file') {
            this.beat(initialEditor.document, true);
        }
    }

    // Total coding time today including live session
    getTodaySeconds(): number {
        return this.storage.getTodayTotal() + this.liveGap();
    }

    // Returns true if user is actively coding
    isActive(): boolean {
        return this.isFocused &&
               this.lastBeatAt > 0 &&
               (Date.now() - this.lastBeatAt) / 1000 < IDLE_TIMEOUT_SEC;
    }

    getCurrentFile():     string { return this.curFile; }
    getCurrentLanguage(): string { return this.curLanguage; }
    getCurrentProject():  string { return this.curProject; }

    // Seconds elapsed since last activity
    getIdleSeconds(): number {
        if (this.isActive()) { return 0; }
        return Math.max(0, Math.floor((Date.now() - this.lastActiveAt) / 1000));
    }

    private beat(doc: vscode.TextDocument, forced: boolean) {
        if (!this.isFocused) { return; }

        const now  = Date.now();
        const file = doc.uri.fsPath;

        // Automatic internal storage & report export exclusion
        const storagePath = this.storage.getStoragePath();
        const baseName = path.basename(file).toLowerCase();
        if (
            file === storagePath ||
            baseName === 'chronix-data.json' ||
            baseName.startsWith('chronix-report-')
        ) {
            this.flushCurrentGap();
            return;
        }

        // Privacy Exclusion List check
        const ignoredPatterns: string[] = vscode.workspace.getConfiguration('chronix').get('ignoredPatterns') || [];
        if (ignoredPatterns.some(pat => pat && (file.includes(pat) || (pat.startsWith('.') && file.endsWith(pat))))) {
            this.flushCurrentGap();
            return;
        }

        const fileChanged = file !== this.lastBeatFile;
        const throttleOk  = (now - this.lastBeatAt) >= HEARTBEAT_THROTTLE;

        // Throttle high-frequency edit events
        if (!forced && !fileChanged && !throttleOk) { return; }

        const language = resolveDocLanguage(doc);
        const project  = this.getProject(doc.uri);

        // Commit elapsed duration within active session
        if (!fileChanged && this.lastBeatAt > 0) {
            const gapSec = (now - this.lastBeatAt) / 1000;
            if (gapSec <= IDLE_TIMEOUT_SEC) {
                this.storage.addTime(this.curFile, this.curLanguage, this.curProject, gapSec);
            }
        } else if (fileChanged && this.lastBeatAt > 0) {
            this.flushCurrentGap();
        }

        // Update state
        this.lastBeatAt   = now;
        this.lastBeatFile = file;
        this.lastActiveAt = now;
        this.curFile      = file;
        this.curLanguage  = language;
        this.curProject   = project;

        this.checkGoalNotification();
        this._onChange.fire();
    }

    private checkIdleState(): boolean {
        if (this.lastBeatAt > 0) {
            const idleSec = (Date.now() - this.lastBeatAt) / 1000;
            if (idleSec >= IDLE_TIMEOUT_SEC) {
                this.flushCurrentGap();
                return true;
            }
        }
        return false;
    }

    private flushCurrentGap() {
        if (!this.lastBeatAt || !this.curFile) { return; }
        const gapSec = (Date.now() - this.lastBeatAt) / 1000;
        if (gapSec > 0 && gapSec <= IDLE_TIMEOUT_SEC) {
            this.storage.addTime(this.curFile, this.curLanguage, this.curProject, gapSec);
        }
        this.lastActiveAt = this.lastBeatAt || this.lastActiveAt || Date.now();
        this.lastBeatAt = 0;
        this.checkGoalNotification();
        this._onChange.fire();
    }

    private lastGoalNotifiedKey = '';

    private checkGoalNotification() {
        const goalSec = getDailyGoalSeconds();
        const notify = vscode.workspace.getConfiguration('chronix').get<boolean>('notifyGoalAchieved', true);
        if (!goalSec || goalSec <= 0 || !notify) { return; }

        const todayKey = this.storage.todayKey();
        const notifKey = `${todayKey}_${goalSec}`;
        if (this.lastGoalNotifiedKey === notifKey) { return; }

        if (this.getTodaySeconds() >= goalSec) {
            this.lastGoalNotifiedKey = notifKey;
            vscode.window.showInformationMessage(`Chronix: Daily goal (${formatTime(goalSec)}) reached today.`);
        }
    }

    private liveGap(): number {
        if (!this.isActive()) { return 0; }
        return Math.min(
            (Date.now() - this.lastBeatAt) / 1000,
            IDLE_TIMEOUT_SEC,
        );
    }

    private getProject(uri: vscode.Uri): string {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        return folder?.name ?? vscode.workspace.name ?? 'Unknown';
    }
}
