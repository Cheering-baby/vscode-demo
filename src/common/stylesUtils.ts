import * as fs from "fs";
import * as css from "css";
// import CSSflatten from "css-flatten";
import { supportCssFiles, IStyleDependency, IStyle } from "./types";

import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";
import { join } from "path";
import postcss from "postcss";
import logger from "./logger";

export function existStyleDependencies(code:string) {
  const reg = /import *\w* *from *(w|'|"|.)*\/\w*.(less|css|sass|scss)/g;
  console.log(code.match(reg));
  return reg.test(code);
}

// Find style dependencies, like import style form './index.css';
export function findStyleDependencies(code: string, config: any) {
  const StyleDependencies: IStyleDependency[] = [];
  console.log(code);
  try {
    const ast = babelParser.parse(code, config.parserOptions);
    console.log(ast);
    // @ts-ignore
    traverse(ast, {
      ImportDeclaration(path) {
        const { node } = path;
        console.log(node);
        // Example /\.css$|\.scss$|\.sass$/
        if (
          new RegExp(
            `${supportCssFiles
              .map((supportFile) => `\\.${supportFile}$`)
              .join("|")}`,
            "i"
          ).test(node.source.value)
        ) {
          StyleDependencies.push({
            source: node.source.value,
            // Just return first identifier.
            identifier: node.specifiers[0]
              ? node.specifiers[0].local.name
              : null,
          });
        }
      },
    });
  } catch (e) {
    logger.info(e.message);
  }

  return StyleDependencies;
}

// Find styles selectors, ['.wrap', '.header' ....]
export function findStyleSelectors(
  directory: string,
  styleDependencies: IStyleDependency[] = []
): string[] {
  let selectors: string[] = [];

  for (let i = 0, l = styleDependencies.length; i < l; i++) {
    const file = join(directory, styleDependencies[i].source);

    const fileContent = fs.readFileSync(file, "utf-8");
    let cssContent = fileContent;

    // Remove media and keyframes, it will cause css.parse error
    cssContent = cssContent.replace(
      /@[media|keyframes][^{]+\{([\s\S]+?})\s*}/g,
      ""
    );

    if (
      // Flattens nested SASS LESS string
      /s(c|a)ss$|\.less$/.test(file)
    ) {
      // https://www.npmjs.com/package/css-flatten
      // Before:
      // .foo {
      //   color: red;
      //   .bar {
      //     color: blue;
      //   }
      // }
      // After:
      // .foo {
      //   color: red;
      // }
      // .foo .bar {
      //   color: blue;
      // }
      // cssContent = CSSflatten(cssContent);
      cssContent = null;
    }

    const { stylesheet } = css.parse(cssContent);

    // eslint-disable-next-line
    stylesheet.rules.forEach((rule: IStyle) => {
      if (rule.selectors) {
        selectors = selectors.concat(
          rule.selectors.map((selector) => {
            // .foo .bar => .bar
            return selector.split(" ").pop() || "";
          })
        );
      }
    });
  }

  return selectors;
}

export function parseCssFile(filePath: string) {
  const code = fs.readFileSync(filePath, "utf-8");
  const result = postcss.parse(code);
  console.log(result);
}
