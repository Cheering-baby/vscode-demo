// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { getUmiFileWatcher } from './common/fileWatcher';
import logger from './common/logger';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	logger.info('extension "umi-pro-test" is now active!');
  const umiFileWatcher = await getUmiFileWatcher(workspace.workspaceFolders);
  console.log(umiFileWatcher);
}

// this method is called when your extension is deactivated
export function deactivate() {}
