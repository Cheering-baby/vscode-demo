import { join, resolve, dirname } from "path";
import * as fs from "mz/fs";
import globby from "globby";
import * as vscode from "vscode";
import { QuoteType, QuoteCharMap, JS_EXT_NAMES } from "./types";
import { Range, Position } from "vscode";
import { SourceLocation } from "@babel/types";
import path = require("path");

export async function getModels(cwd: string): Promise<string[]> {
  for (const extName of JS_EXT_NAMES) {
    const absFilePath = join(cwd, `model${extName}`);
    if (await fs.exists(absFilePath)) {
      return [absFilePath];
    }
  }
  const modules = (
    await globby(["./models/**/*.{ts,tsx,js,jsx}"], {
      cwd,
      deep: true,
    })
  ).filter((p) =>
    [".d.ts", ".test.js", ".test.jsx", ".test.ts", ".test.tsx"].every(
      (ext) => !p.endsWith(ext)
    )
  );
  return modules.map((p) => join(cwd, p));
}

/**
 * 参考了 umi 的源码
 * @see https://github.com/umijs/umi/blob/master/packages/umi-plugin-dva/src/index.js
 * @param filePath 文件路径
 * @param projectPath 项目路径
 */
export async function getPageModels(filePath, projectPath): Promise<string[]> {
  let models: string[] = [];
  let cwd = dirname(filePath);
  while (cwd !== projectPath && cwd !== join(projectPath, "src")) {
    models = models.concat(await getModels(cwd));
    cwd = dirname(cwd);
  }
  return models;
}

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

export interface ICodeInfo {
  line: vscode.TextLine;
  word: string;
  fileName: string;
  directory: string;
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
