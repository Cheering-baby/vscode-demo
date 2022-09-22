import { readFileSync } from "fs";
const less = require("less");

export interface ILessParser {
  parseFile(path: string): void;
}

export class LessParser implements ILessParser {
  async parseFile() {
    const file = readFileSync(
      "D:\\project\\vscode\\vscode-demo\\src\\services\\parser\\index.less"
    );

    const parseObj = await less.parse(file.toString());
    console.log(parseObj.rules);
  }
}
