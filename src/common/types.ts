import * as vscode from 'vscode';
import { ParserOptions } from '@babel/parser';
import { SourceLocation } from '@babel/types';

export enum QuoteType {
  double = 'double',
  single = 'single',
  backtick = 'backtick',
}

export const QuoteCharMap = {
  [QuoteType.single]: "'",
  [QuoteType.double]: '"',
  [QuoteType.backtick]: '`',
};

export interface IUmiProConfig {
  quotes: QuoteType;
  routerConfigPath?: string;
  parserOptions: ParserOptions;
  routerExcludePath: string[];
  saveOnGenerateEffectsCommandTimeout: number;
  autoGenerateSagaEffectsCommands: boolean;
  localeFolder: string;
}

export const DEFAULT_ROUTER_CONFIG_PATH = [
  '.umirc.js',
  '.umirc.ts',
  'config/config.js',
  'config/router.config.js',
];

interface CodeWithLoc {
  code: string;
  loc: {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  };
}

export interface IDvaModel {
  namespace: string;
  effects: {
    [name: string]: CodeWithLoc;
  };
  reducers: {
    [name: string]: CodeWithLoc;
  };
}

export interface IDvaModelWithFilePath extends IDvaModel {
  filePath: string;
}

export interface IUmirc {
  key: string;
  loc: SourceLocation;
  start: number;
  end: number;
}

export interface ILocale {
  key: string;
  range: vscode.Range;
  fileUri: vscode.Uri;
}
export enum Brackets {
  ROUND = '()',
  BOX = '[]',
  CURLY = '{}',
}

// import styles from './xxx.css'; -> { source: './xxx.css', identifier: 'styles' }
// import './xxx.css'; -> { source: './xxx.css', identifier: null }
export interface IStyleDependency {
  source: string;
  identifier: string | null;
}

export interface ICodeInfo {
  line: vscode.TextLine;
  word: string;
  fileName: string;
  directory: string;
}

// https://www.npmjs.com/package/css
export interface IStylePosition {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

export interface IStyle {
  type: string;
  selectors: string[];
  position: IStylePosition;
  file: string;
  code: string;
}

export const JS_EXT_NAMES = ['.js', '.jsx', '.ts', '.tsx'];

export const EXCLUDE_EXT_NAMES = ['.d.ts', '.test.js', '.test.jsx', '.test.ts', '.test.tsx'];

export const SUPPORT_LANGUAGE = ['javascript', 'typescript', 'typescriptreact'];

export const supportCssFiles = ["css", "scss", "sass", "less"];

export type CamelCaseValues = false | true | "dashes";
export type AliasFromUserOptions = Record<string, string>;
export type AliasFromTsConfig = Record<string, string[]>;
export type PathAlias = AliasFromUserOptions | AliasFromTsConfig;

export interface ClickInfo {
  importModule: string;
  targetClass: string;
}

export interface Keyword {
  obj: string;
  field: string;
}