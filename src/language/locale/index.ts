import * as vscode from "vscode";
import { SUPPORT_LANGUAGE } from "../../common/types";
import { ILocaleService, LocalService } from "../../services/localeService";
import { LocaleDefinitionProvider } from "./localeDefinitionProvider";
import { LocalKeyCompletionItemProvider } from "./localeKeyCompletionItemProvider";
import { LocalKeyReferenceProvider } from "./localKeyReferenceProvider";

export default function localeContext(
  context: vscode.ExtensionContext,
  localeService: ILocaleService
) {
  // locale自动补全
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SUPPORT_LANGUAGE,
      new LocalKeyCompletionItemProvider(localeService),
      "=",
      " ",
      ":"
    )
  );

  // locale定义文件跳转
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      SUPPORT_LANGUAGE,
      new LocaleDefinitionProvider(localeService)
    )
  );

  // locale引用跳转
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      [SUPPORT_LANGUAGE[0], SUPPORT_LANGUAGE[1]],
      new LocalKeyReferenceProvider(localeService)
    )
  );
}
