import { existsSync, readFileSync } from "fs";
import { Position } from "vscode";
import * as _ from "lodash";

export function genImportRegExp(key: string): RegExp {
  const file = "(.+\\.(\\S{1,2}ss|stylus|styl))";
  const fromOrRequire = "(?:from\\s+|=\\s+require(?:<any>)?\\()";
  const requireEndOptional = "\\)?";
  const pattern = `\\s${key}\\s+${fromOrRequire}["']${file}["']${requireEndOptional}`;
  return new RegExp(pattern);
}

export function findImportModule(text: string, key: string): string {
  const re = genImportRegExp(key);
  const results = re.exec(text);
  if (!!results && results.length > 0) {
    return results[1];
  } else {
    return "";
  }
}

export function getWords(line: string, position: Position): string {
  const text = line.slice(0, position.character);
  // support optional chain https://github.com/tc39/proposal-optional-chaining
  // covert ?. to .
  const convertText = text.replace(/(\?\.)/g, ".");
  const index = convertText.search(/[a-zA-Z0-9._]*$/);
  if (index === -1) {
    return "";
  }

  return convertText.slice(index);
}

/**
 * @TODO Refact by new Tokenizer
 */
export async function getAllClassNames(
  filePath: string,
  keyword: string
): Promise<string[]> {
  // check file exists, if not just return []
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, { encoding: "utf8" });
  let matchLineRegexp = /.*[,{]/g;

  // experimental stylus support
  if (filePath.endsWith(".styl") || filePath.endsWith(".stylus")) {
    matchLineRegexp = /\..*/g;
  }
  const lines = content.match(matchLineRegexp);
  if (lines === null) {
    return [];
  }

  const classNames = lines.join(" ").match(/\.[_A-Za-z0-9-]+/g);
  if (classNames === null) {
    return [];
  }

  const uniqNames = _.uniq(classNames)
    .map((item) => item.slice(1))
    .filter((item) => !/^[0-9]/.test(item));
  return keyword !== ""
    ? uniqNames.filter((item) => item.indexOf(keyword) !== -1)
    : uniqNames;
}
