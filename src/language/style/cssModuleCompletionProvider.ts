import path = require("path");
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Position,
  TextDocument,
} from "vscode";
import {
  findImportModule,
  getAllClassNames,
  getWords,
} from "../../common/cssModule";
import { getFocusCodeInfo } from "../../common/utils";

// check if current character or last character is .
function isTrigger(line: string, position: Position): boolean {
  const i = position.character - 1;
  return line[i] === "." || (i > 1 && line[i - 1] === ".");
}

export default class CSSModuleCompletionProvider
  implements CompletionItemProvider
{
  async provideCompletionItems(
    document: TextDocument,
    position: Position
  ): Promise<CompletionItem[]> {
    const currentDir = path.dirname(document.uri.fsPath);
    const { line } = getFocusCodeInfo(document, position);

    const lineText = line.text;

    if (!isTrigger(lineText, position)) {
      return Promise.resolve([]);
    }

    const matchWords = getWords(lineText, position);
    if (matchWords === "" || matchWords.indexOf(".") === -1) {
      return Promise.resolve([]);
    }

    const [obj, field] = matchWords.split(".");

    const importModule = findImportModule(document.getText(), obj);
    const importPath = path.resolve(currentDir, importModule);
    if (importPath === "") {
      return Promise.resolve([]);
    }
    const classNames = await getAllClassNames(importPath, field);
    return Promise.resolve(
      classNames.map((_class) => {
        return new CompletionItem(_class, CompletionItemKind.Variable);
      })
    );
  }
}
