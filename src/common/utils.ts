import { join, resolve } from "path";
import * as vscode from "vscode";
import { QuoteType, QuoteCharMap, ICodeInfo } from "./types";
import { Range, Position } from "vscode";
import { SourceLocation } from "@babel/types";

import path = require("path");

export function quoteString(input: string, type: QuoteType) {
  const quote = QuoteCharMap[type];
  return `${quote}${input}${quote}`;
}

export function getAbsPath(input: string) {
  const rootPath = resolve(__dirname, "../../");
  return input.replace(join(rootPath, "out"), join(rootPath, "src"));
}

export function isUndefined<T>(data: T | undefined): data is T {
  // eslint-disable-next-line no-undefined
  return data === undefined;
}

export function isNotNull<T>(data: T | null): data is T {
  // eslint-disable-next-line no-undefined
  return data !== null;
}

export function duplicateUnicodeCharacter(str: string, num: number) {
  return new Array(num).fill(str).join("");
}

export function sourceLocationToRange(loc: SourceLocation) {
  return new Range(
    new Position(loc.start.line - 1, loc.start.column),
    new Position(loc.end.line - 1, loc.end.column)
  );
}

export function flatten(arr: Array<any>) {
  return (arr || []).reduce(
    (p, c) => p.concat(Array.isArray(c) ? flatten(c) : c),
    []
  );
}

/**
 *
 * @param filePath d:\\project\\xxx\\xxx\\packages\\cre-test-admin-portal\\index.js
 * @return cre-test-admin-portal
 */
export function getFolderNameByOne(filePath: string): string {
  const reg = /packages\\*(\w|_|-)*/;
  return reg.exec(filePath)?.[0].split("\\")?.[1];
}

/**
 *
 * @param filePath /d:/project/xxx/xxx/packages/cre-test-admin-portal/src/default_i18n/approval_quotation.js
 * @return cre-test-admin-portal
 */
export function getFolderNameByTwo(filePath: string): string {
  const reg = /packages\/*(\w|_|-)*/;
  return reg.exec(filePath)?.[0].split("/")?.[1];
}

export function getFocusCodeInfo(
  document: vscode.TextDocument,
  position: vscode.Position
): ICodeInfo {
  return {
    // Code info
    line: document.lineAt(position),
    word: document.getText(document.getWordRangeAtPosition(position)),

    // File info
    fileName: document.fileName,
    directory: path.dirname(document.fileName),
  };
}

export function getFilenameWithoutExtname(fileName: string): string {
  if ([".js", ".ts", ".jsx", ".tsx"].includes(path.extname(fileName))) {
    return path.basename(fileName, path.extname(fileName));
  } else {
    return fileName;
  }
}
