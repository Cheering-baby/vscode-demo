import Container, { Service } from "typedi";
import * as vscode from "vscode";
import { TextDocumentUtils } from "../../common/document";
import { QuoteType } from "../../common/types";
import { isLocaleFile } from "../../common/utils";
import { ILocaleService } from "../../services/localeService";
import {
  IVscodeService,
  VscodeServiceToken,
} from "../../services/vscodeService";

@Service()
export class LocalKeyReferenceProvider implements vscode.DefinitionProvider {
  private vscodeService: IVscodeService;

  private localeService: ILocaleService;

  constructor(localeServiceToken: ILocaleService) {
    this.vscodeService = Container.get(VscodeServiceToken);
    this.localeService = localeServiceToken;
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const filePath = document.uri.fsPath;

    const textDocumentUtils = new TextDocumentUtils(document);
    const config = this.vscodeService.getConfig(filePath);
    const localeFile = this.localeService.getValidLocaleFile(filePath);
    if (!config || !localeFile) {
      return;
    }

    // locale文件跳转
    if (!isLocaleFile(filePath, config)) {
      return;
    }

    let quoteType = QuoteType.single;

    const range = textDocumentUtils.getQuoteRange(position, quoteType);
    if (!range) {
      return;
    }

    const localeKey = document.getText(range).slice(1, -1);

    console.log("LocalKeyReference", localeKey);

    throw new Error("Method not implemented.");
  }
}
