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
      new vscode.Range(
        document.positionAt(document.offsetAt(position) - 50),
        position
      )
    );

    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character + 1);
    console.log("linePrefix:",linePrefix);
    if (!linePrefix.endsWith("id=") && !linePrefix.match(/id\s*:\s*}{0,1}$/)) {
      return [];
    }
    console.log(1,text);
    
    if (!text.includes("formatMessage")) {
      return [];
    }
    console.log(2);
    const simpleCompletion = new vscode.CompletionItem("formatMessage");
    return [simpleCompletion];
  }
  resolveCompletionItem?(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    throw new Error("Method not implemented.");
  }
}
