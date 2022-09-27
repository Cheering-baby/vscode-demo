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
import { findImportModule, genImportRegExp } from "../../common/cssModule";
import { ClickInfo, Keyword } from "../../common/types";
import { getFocusCodeInfo } from "../../common/utils";
import * as fs from "fs";
import path = require("path");

function getWords(line: string, position: Position): string {
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

function getPosition(filePath: string, className: string): Position {
  const content = fs.readFileSync(filePath, { encoding: "utf8" });
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
  const words = getWords(currentLine, position);
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

function getClickInfo(
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
