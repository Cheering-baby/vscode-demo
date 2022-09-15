import { ILocale, IUmiProConfig } from "../common/types";
import Logger, { ILogger } from "../common/logger";
import { IVscodeService, VscodeServiceToken } from "./vscodeService";
import { ILocaleParser, LocaleParser } from "./parser/localeParser";
import Container from "typedi";
import { join } from "path";
import { existsSync } from "fs";
import * as vscode from "vscode";

export interface ILocaleService {
  getData(): {
    [projectPath: string]: ILocale[];
  };
  getKeys(filePath: string): string[];
  getLocaleAst(filePath: string): ILocale[];
  initLocales(): void;
  updateFile(filePath: string): void;
  deleteFile(filePath: string): void;
  getValidLocaleFile(filePath: string): string | undefined;
}

export class LocalService implements ILocaleService {
  public readonly vscodeService: IVscodeService;
  private data: {
    [projectPath: string]: ILocale[];
  };
  private projectPath: string;
  private config: IUmiProConfig | null;
  private logger: ILogger;
  private parser: ILocaleParser;

  constructor() {
    Logger.info("LocalService!");
    this.vscodeService = Container.get(VscodeServiceToken);
    this.parser = new LocaleParser();
    this.data = {};
    this.projectPath = "";
    this.config = null;
  }

  getData(): { [projectPath: string]: ILocale[]; } {
    return this.data;
  }

  public getKeys = (filePath: string) => {
    const projectPath = this.vscodeService.getProjectPath(filePath);
    if (!projectPath) {
      return [];
    }
    return this.data[projectPath].map((r) => r.key);
  };

  public getLocaleAst = (filePath: string) => {
    const projectPath = this.vscodeService.getProjectPath(filePath);
    if (!projectPath) {
      return [];
    }
    return this.data[projectPath];
  };

  public initLocales = async () => {
    const folders = vscode.workspace.workspaceFolders;

    if (!folders) {
      return;
    }
    folders
      .map((f) => this.getValidLocaleFile(f.uri.fsPath))
      .filter((f): f is string => !!f)
      .forEach(async (f) => {
        await this.updateFile(f);
      });
  };

  /**
   * @param {string} filePath only changed while specified locale file modified
   */
  public updateFile = async (filePath: string) => {
    try {
      const localeFile = this.isValidLocaleFile(filePath);
      if (!localeFile) {
        return;
      }

      const result = await this.parser.parseFile(filePath);
      this.data[this.projectPath] = result;
    } catch (error) {
      this.logger.info(error.message);
    }
  };

  public deleteFile = async (filePath: string) => {
    const localeFile = this.isValidLocaleFile(filePath);
    if (!localeFile) {
      return;
    }

    delete this.data[this.projectPath];
  };

  public getValidLocaleFile(filePath: string) {
    return this.getLocaleFiles(filePath).find((l) => existsSync(l));
  }

  private isValidLocaleFile(filePath: string) {
    return this.getLocaleFiles(filePath).some((f) => filePath.endsWith(f));
  }

  private getLocaleFiles(filePath: string) {
    const config = this.vscodeService.getConfig(filePath);
    const projectPath = this.vscodeService.getProjectPath(filePath);
    if (!config || !projectPath) {
      return [];
    }
    this.config = config;
    this.projectPath = projectPath;
    const locale = "en-US";
    return [
      join(this.projectPath, "src", "locales", `${locale}.js`),
      join(this.projectPath, "src", "locales", `${locale}.ts`),
      join(this.projectPath, "src", "locale", `${locale}.js`),
      join(this.projectPath, "src", "locale", `${locale}.ts`),
    ];
  }
}
