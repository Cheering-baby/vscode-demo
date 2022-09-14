import * as vscode from "vscode";

export class LocalKeyCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<
    vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>
  > {
    const filePath = document.uri.fsPath;
    // 从当前点向前找50个
    const text = document.getText(
      new vscode.Range(document.positionAt(document.offsetAt(position) - 50), position)
    );
    // a simple completion item which inserts `Hello World!`
    const simpleCompletion = new vscode.CompletionItem(text);
    return [simpleCompletion];
  }
  resolveCompletionItem?(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    throw new Error("Method not implemented.");
  }
}
