import {
  CancellationToken,
  Definition,
  DefinitionProvider,
  Location,
  LocationLink,
  Position,
  ProviderResult,
  TextDocument,
  Uri,
} from "vscode";
import { findImportModule, genImportRegExp, getClickInfo, getPosition } from "../../common/cssModule";
import { ClickInfo, Keyword } from "../../common/types";
import { getFocusCodeInfo } from "../../common/utils";
import * as fs from "fs";
import path = require("path");

export default class CSSModuleDefineProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | LocationLink[]> {
    const { line, directory } = getFocusCodeInfo(document, position);

    const lineText = line.text;
    const clickInfo = getClickInfo(document, lineText, position);
    if (!clickInfo) {
      return [];
    }

    const importPath = path.resolve(directory, clickInfo.importModule);

    if (importPath === "") {
      return [];
    }

    let targetPosition: Position | null = null;

    if (clickInfo.targetClass) {
      targetPosition = getPosition(importPath, clickInfo.targetClass);
    } else {
      targetPosition = new Position(0, 0);
    }
    if (targetPosition === null) {
      return [];
    }
    return new Location(Uri.file(importPath), targetPosition);
  }
}
