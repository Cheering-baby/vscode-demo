import * as vscode from "vscode";
import {
  getFilenameWithoutExtname,
  getFocusCodeInfo,
} from "../../common/utils";
import * as fs from "fs";
import * as babelParser from "@babel/parser";
import {
  IVscodeService,
  VscodeServiceToken,
} from "../../services/vscodeService";
import Container from "typedi";

export class StyleCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  public readonly vscodeService: IVscodeService;
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
    const filePath = document.uri.fsPath;
    const config = this.vscodeService.getConfig(filePath);
    const { directory, fileName } = getFocusCodeInfo(document, position);
    console.log(directory, fileName);

    const completionClassNameItem = new vscode.CompletionItem(
      "className={}",
      vscode.CompletionItemKind.Text
    );
    completionClassNameItem.detail = "Cre Config ClassName";
    completions.push(completionClassNameItem);

    // add styles completion item and auto import
    let newImport = "";
    fs.readdirSync(directory).forEach((file) => {
      if (
        new RegExp(
          `${getFilenameWithoutExtname(fileName)}.(less|css|scss)$`
        ).test(file)
      ) {
        newImport = `import styles from './${file}';`;
      }
    });

    if (newImport) {
      const ast = babelParser.parse(editorText, config.parserOptions);

      let positionForNewImport = new vscode.Position(0, 0);
      const importASTNodes = ast.program.body.filter(
        (node) => node.type === "ImportDeclaration"
      );
      const lastImportNode = importASTNodes[importASTNodes.length - 1];
      if (lastImportNode) {
        positionForNewImport = new vscode.Position(
          lastImportNode.loc.end.line,
          0
        );
      }
      const item = new vscode.CompletionItem(
        "styles",
        vscode.CompletionItemKind.Property
      );
      item.insertText = "styles";
      item.documentation = new vscode.MarkdownString(
        `**Auto import** \n ${newImport}`
      );
      item.additionalTextEdits = [
        vscode.TextEdit.insert(positionForNewImport, `${newImport}\n`),
      ];
      completions.push(item);
    }

    console.log(completions);

    return completions;
  }
}
