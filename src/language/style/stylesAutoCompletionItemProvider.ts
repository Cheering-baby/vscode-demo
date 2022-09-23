import * as vscode from "vscode";
import { getFocusCodeInfo } from "../../common/utils";
import {
  IVscodeService,
  VscodeServiceToken,
} from "../../services/vscodeService";
import Container from "typedi";
import {
  existStyleDependencies,
  findStyleDependencies,
  parseCssFile,
} from "../../common/stylesUtils";
import { join } from "path";
import { IStyleDependency } from "../../common/types";

export default class StylesAutoCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  public readonly vscodeService: IVscodeService;
  public styleDependencies: IStyleDependency[];
  constructor() {
    this.vscodeService = Container.get(VscodeServiceToken);
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<
    vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>
  > {
    const completions = [];
    const editorText = document.getText();
    const { line, fileName, directory } = getFocusCodeInfo(document, position);
    if (!/styles|className/g.test(line.text)) {
      return [];
    }
    const filePath = document.uri.fsPath;
    const config = this.vscodeService.getConfig(filePath);

    // In case of cursor shaking
    const word = line.text.substring(0, position.character);
    const styleDependencies = existStyleDependencies(editorText);
    console.log(styleDependencies);

    // for (let i = 0; i < styleDependencies.length; i++) {
    //   if (
    //     /className=/.test(line.text) ||
    //     (styleDependencies[i].identifier &&
    //       new RegExp(`${styleDependencies[i].identifier}\\.$`).test(word))
    //   ) {
    //     const element = styleDependencies[i];
    //     const filePath = join(directory, element.source);
    //     // parseCssFile(filePath);
    //   }
    // }

    const completionClassNameItem = new vscode.CompletionItem(
      "completionClassNameItem",
      vscode.CompletionItemKind.Text
    );

    completions.push(completionClassNameItem);

    return completions;
  }
}
