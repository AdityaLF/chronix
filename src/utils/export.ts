import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function getDefaultExportDirectory(): string {
    const home = os.homedir() || process.env.HOME || process.env.USERPROFILE || '';
    if (home) {
        const downloads = path.join(home, 'Downloads');
        if (fs.existsSync(downloads)) {
            return downloads;
        }
        return home;
    }
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '/tmp';
}

export async function saveExportReportFile(
    filename: string,
    content: string,
    filters: Record<string, string[]>,
    formatName: string
): Promise<void> {
    const defaultDir = getDefaultExportDirectory();
    const defaultUri = vscode.Uri.file(path.join(defaultDir, filename));

    const targetUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters,
        title: `Export ${formatName} Report`
    });

    if (targetUri) {
        fs.writeFileSync(targetUri.fsPath, content, 'utf8');
        const openAction = 'Open File';
        vscode.window.showInformationMessage(
            `Chronix: ${formatName} report saved to ${path.basename(targetUri.fsPath)}`,
            openAction
        ).then(choice => {
            if (choice === openAction) {
                vscode.commands.executeCommand('vscode.open', targetUri);
            }
        });
    }
}
