// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import Container from "typedi";
import * as vscode from "vscode";
import { workspace } from "vscode";
import { getUmiFileWatcher } from "./common/fileWatcher";
import logger from "./common/logger";
import { SUPPORT_LANGUAGE } from "./common/types";
import {
  LocaleDefinitionProvider,
  LocalKeyCompletionItemProvider,
} from "./language/locale";
import { LocalService } from "./services/localeService";
import {
  loadVscodeService,
  VscodeServiceToken,
} from "./services/vscodeService";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  logger.info('extension "umi-pro-test" is now active!');
  const umiFileWatcher = await getUmiFileWatcher(workspace.workspaceFolders);

  umiFileWatcher.onDidChange((e) => console.log(e));
  umiFileWatcher.onDidCreate((e) => console.log(e));
  umiFileWatcher.onDidDelete((e) => console.log(e));

  const localeService = new LocalService();
  umiFileWatcher.onDidCreate((e) => localeService.updateFile(e.fsPath));
  umiFileWatcher.onDidChange((e) => localeService.updateFile(e.fsPath));
  umiFileWatcher.onDidDelete((e) => localeService.deleteFile(e.fsPath));

  let vscodeService = Container.get(VscodeServiceToken);
  await loadVscodeService(vscodeService);
  await localeService.initLocales();
  workspace.onDidChangeWorkspaceFolders(() => loadVscodeService(vscodeService));
  workspace.onDidChangeConfiguration(() => loadVscodeService(vscodeService));

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SUPPORT_LANGUAGE,
      new LocalKeyCompletionItemProvider(localeService),
      "=",
      " ",
      ":"
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      SUPPORT_LANGUAGE,
      new LocaleDefinitionProvider(localeService)
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
