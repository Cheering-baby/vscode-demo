// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import Container from "typedi";
import * as vscode from "vscode";
import { workspace } from "vscode";
import { getUmiFileWatcher } from "./common/fileWatcher";
import logger from "./common/logger";
import styleInfoViewer from "./language/cssModule";
import localeContext from "./language/locale";
import { UmircDecoration } from "./language/umircDecoration";
import { LocalService } from "./services/localeService";
import {
  loadVscodeService,
  VscodeServiceToken,
} from "./services/vscodeService";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  logger.info('extension "cre-umi-pro" is now active!');
  const umiFileWatcher = await getUmiFileWatcher(workspace.workspaceFolders);

  if (!umiFileWatcher) {
    logger.info("no project use umi");
    return;
  }

  const localeService = new LocalService();
  const vscodeService = Container.get(VscodeServiceToken);

  umiFileWatcher.onDidCreate((e) => localeService.updateFile(e.fsPath));
  umiFileWatcher.onDidChange((e) => localeService.updateFile(e.fsPath));
  umiFileWatcher.onDidDelete((e) => localeService.deleteFile(e.fsPath));
  
  await loadVscodeService(vscodeService);
  await localeService.initLocales();
  workspace.onDidChangeWorkspaceFolders(() => loadVscodeService(vscodeService));
  workspace.onDidChangeConfiguration(() => loadVscodeService(vscodeService));

  localeContext(context, localeService);
  styleInfoViewer(context);

  context.subscriptions.push(Container.get(UmircDecoration));
}

// this method is called when your extension is deactivated
export function deactivate() {}
