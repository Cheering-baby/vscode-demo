// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { workspace } from "vscode";
import { getUmiFileWatcher } from "./common/fileWatcher";
import logger from "./common/logger";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  logger.info('extension "umi-pro-test" is now active!');
  const umiFileWatcher = await getUmiFileWatcher(workspace.workspaceFolders);
  console.log(umiFileWatcher);

  umiFileWatcher.onDidChange((e) => console.log(e));
  umiFileWatcher.onDidCreate((e) => console.log(e));
  umiFileWatcher.onDidDelete((e) => console.log(e));

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      "typescript",
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position,
          token: vscode.CancellationToken,
          context: vscode.CompletionContext
        ) {
          // a simple completion item which inserts `Hello World!`
          const simpleCompletion = new vscode.CompletionItem("Hello World!");

          // return all completion items as array
          return [simpleCompletion];
        },
      },
      "=",
      " ",
      ":"
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
