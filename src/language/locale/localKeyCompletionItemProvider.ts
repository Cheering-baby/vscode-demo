import * as vscode from "vscode";
import { QuoteType } from "../../common/types";
import { quoteString } from "../../common/utils";
import { ILocaleService } from "../../services/localService";

export class LocalKeyCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  private localeService: ILocaleService;

  constructor(localeServiceToken: ILocaleService) {
    this.localeService = localeServiceToken;
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<
    vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>
  > {
    const filePath = document.uri.fsPath;
    // 从当前点向前找50个字符
    const text = document.getText(
      new vscode.Range(
        document.positionAt(document.offsetAt(position) - 50),
        position
      )
    );

    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character + 1);
    if (!linePrefix.endsWith("id=") && !linePrefix.match(/id\s*:\s*}{0,1}$/)) {
      return [];
    }
    if (!text.includes("formatMessage")) {
      return [];
    }
    const keys = this.localeService.getKeys(filePath);

    let quoteType = QuoteType.single;
    return keys.map((k) => {
      return new vscode.CompletionItem(
        quoteString(k, quoteType),
        vscode.CompletionItemKind.Value
      );
    });
  }
  resolveCompletionItem?(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    throw new Error("Method not implemented.");
  }
}
