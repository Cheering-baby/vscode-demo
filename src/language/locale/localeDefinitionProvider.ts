import Container, { Inject, Service } from "typedi";
import { ILocaleService } from "../../services/localeService";
import {
  IVscodeService,
  VscodeServiceToken,
} from "../../services/vscodeService";
import * as vscode from "vscode";
import { TextDocumentUtils } from "../../common/document";
import { QuoteType } from "../../common/types";
import { isLocaleFile } from '../../common/utils';

@Service()
export class LocaleDefinitionProvider implements vscode.DefinitionProvider {
  private vscodeService: IVscodeService;

  private localeService: ILocaleService;

  constructor(localeServiceToken: ILocaleService) {
    this.vscodeService = Container.get(VscodeServiceToken);
    this.localeService = localeServiceToken;
  }

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const filePath = document.uri.fsPath;
    const textDocumentUtils = new TextDocumentUtils(document);
    const config = this.vscodeService.getConfig(filePath);
    const localeFile = this.localeService.getValidLocaleFile(filePath);
    if (!config || !localeFile) {
      return;
    }

    // locale文件不跳转
    if(isLocaleFile(filePath, config)){
      return;
    }

    // const text = document.getText(
    //   new vscode.Range(
    //     document.positionAt(document.offsetAt(position) - 50),
    //     position
    //   )
    // );

    let quoteType = config ? config.quotes : QuoteType.single;

    // use double quote while in component usage
    // TODO: better solution?
    // if (
    //   text.includes("<FormattedMessage") ||
    //   text.includes("<FormattedHTMLMessage")
    // ) {
    //   quoteType = QuoteType.double;
    // }

    const range = textDocumentUtils.getQuoteRange(position, quoteType);
    if (!range) {
      return;
    }
    const localeKey = document.getText(range).slice(1, -1);
    let localeKeys;
    try {
      localeKeys = this.localeService.getKeys(filePath);
    } catch (e) {
      console.log(e.message);
    }

    if (!localeKeys.includes(localeKey)) {
      return;
    }

    const localeFileDoc = this.localeService.getLocaleAst(filePath);

    const keyAst = localeFileDoc.find((d) => d.key === localeKey);
    if (!keyAst) {
      return;
    }

    return [
      {
        originSelectionRange: range,
        targetUri: keyAst.fileUri,
        targetRange: keyAst.range,
      },
    ];
  }
}
