import * as vscode from "vscode";
import { DocumentFormatting } from "./documentFormatting";
import { FourglFormattingRules } from "./fourglFormattingRules";
import { format4GL, IOffsetPosition } from "../parser";

class FourglFormatting
  extends DocumentFormatting
  implements
    vscode.DocumentRangeFormattingEditProvider,
    vscode.OnTypeFormattingEditProvider,
    vscode.DocumentFormattingEditProvider {
  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    const result: vscode.TextEdit[] = [];

    try {
      const offsetPos: IOffsetPosition = {
        rangeStart: document.offsetAt(range.start),
        rangeEnd: document.offsetAt(range.end),
      };

      const formatted = format4GL(
        document.languageId,
        document.getText(),
        offsetPos
      );

      if (formatted.length > 0) {
        result.push(
          vscode.TextEdit.replace(
            range,
            formatted.substring(0, formatted.length - 1)
          )
        );
      }
    } catch (error) {
      console.error(error);
      Promise.reject(error);
    }

    return result;
  }

  public provideOnTypeFormattingEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    ch: string,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    const result: vscode.TextEdit[] = [];

    try {
      const line: vscode.TextLine = document.lineAt(position.line - 1);

      if (line.text.trim() !== "") {
        const offsetPos: IOffsetPosition = {
          rangeStart: document.offsetAt(line.range.start),
          rangeEnd: document.offsetAt(line.range.end),
        };

        const formatted = format4GL(
          document.languageId,
          document.getText(),
          offsetPos
        );

        if (formatted.length > 0) {
          result.push(
            vscode.TextEdit.replace(
              line.range,
              formatted.substring(0, formatted.length - 1)
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
      Promise.reject(error);
    }

    return Promise.resolve(result);
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    const result = super.applyFormattingEdits(document, options, token);

    try {
      const formatted = format4GL(document.languageId, document.getText());

      if (formatted.length > 0) {
        const start = document.validatePosition(new vscode.Position(0, 0));
        const end = document.validatePosition(
          new vscode.Position(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY
          )
        );

        result.push(
          vscode.TextEdit.replace(new vscode.Range(start, end), formatted)
        );
      }
    } catch (error) {
      console.error(error);
      Promise.reject(error);
    }

    return result;
  }
}

export function register(selector: vscode.DocumentSelector): vscode.Disposable {
  const provider = new FourglFormatting(new FourglFormattingRules());

  return vscode.Disposable.from(
    vscode.languages.registerOnTypeFormattingEditProvider(
      selector,
      provider,
      "\n"
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      selector,
      provider
    ),
    vscode.languages.registerDocumentFormattingEditProvider(selector, provider)
  );
}
