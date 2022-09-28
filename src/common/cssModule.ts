import { existsSync, readFileSync } from "fs";
import { Position, TextDocument } from "vscode";
import * as _ from "lodash";
import { ClickInfo, IStyle, Keyword } from "./types";
import css from "css";
import path = require("path");
const postcss = require("postcss");
const syntax = require("postcss-less");

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

function getWordsByTwo(line: string, position: Position): string {
  const headText = line.slice(0, position.character);
  const startIndex = headText.search(/[a-zA-Z0-9._]*$/);
  // not found or not clicking object field
  if (startIndex === -1 || headText.slice(startIndex).indexOf(".") === -1) {
    return "";
  }

  const match = /^([a-zA-Z0-9._]*)/.exec(line.slice(startIndex));
  if (match === null) {
    return "";
  }

  return match[1];
}

export function getPosition(filePath: string, className: string): Position {
  const content = readFileSync(filePath, { encoding: "utf8" });
  const lines = content.split("\n");

  let lineNumber = -1;
  let character = -1;
  let keyWord = className;

  /**
   * This is a simple solution for definition match.
   * Only guarantee keyword not follow normal characters
   *
   * if we want match [.main] classname
   * escaped dot char first and then use RegExp to match
   * more detail -> https://github.com/clinyong/vscode-css-modules/pull/41#discussion_r696247941
   *
   * 1. .main,   // valid
   * 2. .main    // valid
   *
   * 3. .main-sub   // invalid
   * 4. .main09     // invalid
   * 5. .main_bem   // invalid
   * 6. .mainsuffix // invalid
   *
   * @TODO Refact by new tokenizer later
   */
  const keyWordMatchReg = new RegExp(
    `${keyWord.replace(/^\./, "\\.")}(?![_0-9a-zA-Z-])`
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    /**
     * The only way to guarantee that a position will be returned for a camelized class
     * is to check after camelizing the source line.
     * Doing the opposite -- uncamelizing the used classname -- would not always give
     * correct result, as camelization is lossy.
     * i.e. `.button--disabled`, `.button-disabled` both give same
     * final class: `css.buttonDisabled`, and going back from this to that is not possble.
     *
     * But this has a drawback - camelization of a line may change the final
     * positions of classes. But as of now, I don't see a better way, and getting this
     * working is more important, also putting this functionality out there would help
     * get more eyeballs and hopefully a better way.
     */
    // const line = originalLine;

    /**
     * @isMatchChar for match check
     * @character for position
     */
    let isMatchChar = keyWordMatchReg.test(line);
    character = line.indexOf(keyWord);
    if (!isMatchChar) {
      // if camelized match fails, and transformer is there
      // try matching the un-camelized classnames too!
      character = line.indexOf(keyWord);
      isMatchChar = keyWordMatchReg.test(line);
    }

    if (isMatchChar) {
      lineNumber = i;
      break;
    }
  }

  if (lineNumber === -1) {
    return null;
  } else {
    return new Position(lineNumber, character);
  }
}

function isImportLineMatch(
  line: string,
  matches: RegExpExecArray,
  current: number
): boolean {
  if (matches === null) {
    return false;
  }

  const start1 = line.indexOf(matches[1]) + 1;
  const start2 = line.indexOf(matches[2]) + 1;

  // check current character is between match words
  return (
    (current > start2 && current < start2 + matches[2].length) ||
    (current > start1 && current < start1 + matches[1].length)
  );
}

function getKeyword(currentLine: string, position: Position): Keyword | null {
  const words = getWordsByTwo(currentLine, position);
  if (words === "" || words.indexOf(".") === -1) {
    return null;
  }

  const [obj, field] = words.split(".");
  if (!obj || !field) {
    // probably a spread operator
    return null;
  }

  return { obj, field };
}

function getClickInfoByKeyword(
  document: TextDocument,
  currentLine: string,
  position: Position
): ClickInfo | null {
  const keyword = getKeyword(currentLine, position);
  if (!keyword) {
    return null;
  }

  const importModule = findImportModule(document.getText(), keyword.obj);
  const targetClass = keyword.field;
  return {
    importModule,
    targetClass,
  };
}

export function getClickInfo(
  document: TextDocument,
  currentLine: string,
  position: Position
): ClickInfo | null {
  const matches = genImportRegExp("(\\S+)").exec(currentLine);
  if (isImportLineMatch(currentLine, matches, position.character)) {
    return {
      importModule: matches[2],
      targetClass: "",
    };
  }

  return getClickInfoByKeyword(document, currentLine, position);
}

function cssParseDeal(rule: any, targetClass) {
  if (
    rule?.type === "rule" &&
    rule?.selector.replace(".", "") === targetClass
  ) {
    return rule;
  } else if (rule?.nodes?.length > 0) {
    for (let i = 0; i < rule.nodes.length; i++) {
      const target = cssParseDeal(rule.nodes[i], targetClass);
      if (target) {
        return target;
      }
    }
  }

  return null;
}

export async function matchClassNameInfo(filePath: string, className: string) {
  const extname = path.extname(filePath);
  // current only support less
  if (extname !== ".less") {
    return null;
  }
  const fileContent = readFileSync(filePath, { encoding: "utf8" });
  // const result = await postcss().process(fileContent, { syntax });
  // const { stylesheet } = css.parse(content);
  const result = syntax.parse(fileContent);
  // const result = postcss.parse(fileContent);
  const target = cssParseDeal(result, className);

  return target;
}
