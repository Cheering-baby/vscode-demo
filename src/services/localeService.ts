import { ILocale, IUmiProConfig } from "../common/types";
import Logger, { ILogger } from "../common/logger";
import { IVscodeService, VscodeServiceToken } from "./vscodeService";
import { ILocaleParser, LocaleParser } from "./parser/localeParser";
import Container from "typedi";
import { join } from "path";
import { existsSync, readdirSync } from "fs";
import * as vscode from "vscode";
import { getFolderNameByOne, getFolderNameByTwo } from '../common/utils';

// 缓存Locale文件和定义Locale的一些操作函数
export interface ILocaleService {
  getData(): {
    [projectPath: string]: ILocale[];
  };
  getKeys(filePath: string): string[];
  getLocaleAst(filePath: string): ILocale[];
  initLocales(): void;
  updateFile(filePath: string): void;
  deleteFile(filePath: string): void;
  getValidLocaleFile(filePath: string): string[] | undefined;
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
    // Logger.info("LocalService!");
    this.vscodeService = Container.get(VscodeServiceToken);
    this.parser = new LocaleParser();
    this.data = {};
    this.projectPath = "";
    this.config = null;
  }

  getData(): { [projectPath: string]: ILocale[] } {
    return this.data;
  }

  public getKeys = (filePath: string) => {
    const projectPath = this.vscodeService.getProjectPath(filePath);
    if (!projectPath) {
      return [];
    }

    const packagesFolder = join(projectPath, "packages");

    const folderName1 = getFolderNameByOne(filePath);
    if (existsSync(packagesFolder)) {
      return this.data[projectPath]
        .filter((r) => {
          const {
            fileUri: { path },
          } = r;
          
          const folderName2 = getFolderNameByTwo(path);
          return folderName1 === folderName2;
        })
        .map((r) => r.key);
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
      .map((f) => {
        return this.getValidLocaleFile(f.uri.fsPath);
      })
      .filter((f): f is string[] => {
        return !!f;
      })
      .forEach(async (f) => {
        for (let i = 0; i < f.length; i++) {
          await this.updateFile(f[i]);
        }
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
      const projectPath = this.vscodeService.getProjectPath(filePath);
      const result = await this.parser.parseFile(filePath);
      if (!this.data[projectPath]) {
        this.data[projectPath] = result;
      } else {
        this.data[projectPath].push(...result);
      }
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
    return this.getLocaleFiles(filePath).filter((l) => existsSync(l));
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

    const packagesFolder = join(projectPath, "packages");
    // 判断是否存在packages目录 lerna项目
    if (existsSync(packagesFolder)) {
      const file = readdirSync(packagesFolder);
      const localeFiles = [];
      file.forEach((i) => {
        const localeProjectPath = join(
          packagesFolder,
          i,
          "src",
          this.config.localeFolder
        );

        if (existsSync(localeProjectPath)) {
          localeFiles.push(
            ...readdirSync(localeProjectPath)
              .filter((i) => i.includes("."))
              .map((i) => join(localeProjectPath, i))
          );
        }
      });
      return localeFiles;
    } else {
      const localeProjectPath = join(
        this.projectPath,
        "src",
        this.config.localeFolder
      );

      if (!existsSync(localeProjectPath)) {
        return [];
      }

      const localeFiles = readdirSync(localeProjectPath);
      return localeFiles
        .filter((i) => i.includes("."))
        .map((i) => join(localeProjectPath, i));
    }
  }
}
