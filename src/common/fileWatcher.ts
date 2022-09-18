import { join } from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import logger from "./logger";

function needExtension(projectPath: string) {
  if (!projectPath) {
    return false;
  }

  const packageJsonPath = join(projectPath, "./package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, { encoding: "utf-8" })
    );
    const { dependencies } = packageJson;
    return !!(dependencies?.umi || dependencies?.dva);
  } catch (error) {
    logger.info(error);
    return false;
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
