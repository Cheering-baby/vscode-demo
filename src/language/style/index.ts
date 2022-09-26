import * as vscode from "vscode";
import { SUPPORT_LANGUAGE } from "../../common/types";
import CSSModuleCompletionProvider from './cssModuleCompletionProvider';
import StyleCompletionItemProvider from "./styleCompletionItemProvider";
import StylesAutoCompletionItemProvider from "./stylesAutoCompletionItemProvider";

export default function styleInfoViewer(context: vscode.ExtensionContext) {
  // style自动补全 import styles from './index.less'
  // className自动补全 className={}
  // context.subscriptions.push(
  //   vscode.languages.registerCompletionItemProvider(
  //     SUPPORT_LANGUAGE,
  //     new StyleCompletionItemProvider()
  //   )
  // );
  // win: Ctrl + Click , mac: Cmd + Click  Jump to style definition
  // context.subscriptions.push(
  //   vscode.languages.registerCompletionItemProvider(
  //     SUPPORT_LANGUAGE,
  //     new StylesAutoCompletionItemProvider(),
  //     "."
  //   )
  // );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SUPPORT_LANGUAGE,
      new CSSModuleCompletionProvider(),
      "."
    )
  );
}
