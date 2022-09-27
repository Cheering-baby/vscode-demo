import * as vscode from "vscode";
import { SUPPORT_LANGUAGE } from "../../common/types";
import CSSModuleCompletionProvider from "./CompletionProvider";
import CSSModuleDefineProvider from "./DefinitionProvider";
import { CSSModuleHoverProvider } from './HoverProvider';
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

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      SUPPORT_LANGUAGE,
      new CSSModuleDefineProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      SUPPORT_LANGUAGE,
      new CSSModuleHoverProvider()
    )
  );
}
