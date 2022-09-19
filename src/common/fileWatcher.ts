import { join } from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import logger from "./logger";
import { readdirSync, existsSync } from "fs";

function UmiPackageJsonExist(filepath: string) {
  if (!existsSync(filepath)) {
    return false;
  }
 
  const packageJson = JSON.parse(
    fs.readFileSync(filepath, { encoding: "utf-8" })
  );
  const { dependencies, devDependencies } = packageJson;
  return !!(dependencies?.umi || devDependencies?.umi);
}

function needExtension(projectPath: string) {
  if (!projectPath) {
    return false;
  }

  const packageJsonPath = join(projectPath, "./package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  
  
  const packagesFolder = join(projectPath, "packages");
  // 判断是否存在packages目录 lerna项目
  if (fs.existsSync(packagesFolder)) {
    const file = readdirSync(packagesFolder);
    return file.find((i) =>
      UmiPackageJsonExist(join(packagesFolder, i, "./package.json"))
    );
  } else {
    return UmiPackageJsonExist(packageJsonPath);
  }
}

export async function getUmiFileWatcher(
  workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined
) {
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }

  const result: string[] = [];
  for (let workspaceFolder of workspaceFolders) {
    const {
      uri: { fsPath },
    } = workspaceFolder;
    if (needExtension(fsPath)) {
      result.push(fsPath);
    }
  }
  if (result.length === 0) {
    return null;
  }

  logger.info(`watch ${result.length} project \n${result.join("\n")}`);
  const pattern = `{${result.join(",")}}/**/*.{js,ts,tsx,jsx}`;
  return vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
}
