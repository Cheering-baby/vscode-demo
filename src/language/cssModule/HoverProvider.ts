import path = require("path");
import { Document } from "postcss";
import {
  CancellationToken,
  Hover,
  HoverProvider,
  Position,
  ProviderResult,
  TextDocument,
  workspace,
} from "vscode";
import {
  getClickInfo,
  getPosition,
  matchClassNameInfo,
} from "../../common/cssModule";
import { getFocusCodeInfo } from "../../common/utils";

export class CSSModuleHoverProvider implements HoverProvider {
  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): Promise<Hover> {
    const { line, directory } = getFocusCodeInfo(document, position);

    const lineText = line.text;
    // {importModule: './index.less', targetClass: 'container3'}
    const hoverInfo = getClickInfo(document, lineText, position);

    if (!hoverInfo) {
      return Promise.resolve(null);
    }

    const importPath = path.resolve(directory, hoverInfo.importModule);
    if (importPath === "") {
      return Promise.resolve(null);
    }

    const result = await matchClassNameInfo(importPath, hoverInfo.targetClass);
    if (result && result?.nodes.length > 0) {
      let code = "";

      result.nodes.forEach((i) => {
        if (i.type === "decl") {
          code += `${i.prop}${i.raws?.between}${i.value}; \n `;
        }
      });

      return Promise.resolve(
        new Hover(`**Cre Plugin** \n \`\`\`css \n ${code} \`\`\`\``)
      );
    }

    return Promise.resolve(null);
  }
}
