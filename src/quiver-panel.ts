import * as path from "node:path";
import * as vscode from "vscode";
import { match } from "ts-pattern";
import { type Logger } from "./logger";
import { parseWebviewMessage } from "./protocol";
import { createQuiverWebviewHtml } from "./webview-html";

export interface QuiverPanelControllerOptions {
  readonly extensionPath: string;
  readonly logger: Logger;
}

export class QuiverPanelController implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionPath: string;
  private readonly logger: Logger;

  public constructor(options: QuiverPanelControllerOptions) {
    this.extensionPath = options.extensionPath;
    this.logger = options.logger;
  }

  public dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
  }

  public openOrReveal(): void {
    if (this.panel !== undefined) {
      this.panel.reveal(vscode.ViewColumn.Beside, true);
      return;
    }

    const quiverSourceRoot = vscode.Uri.file(
      path.join(this.extensionPath, "vendor", "quiver", "src"),
    );

    this.panel = vscode.window.createWebviewPanel(
      "vscode-quiver.panel",
      "vscode-quiver",
      {
        preserveFocus: true,
        viewColumn: vscode.ViewColumn.Beside,
      },
      {
        enableScripts: true,
        localResourceRoots: [quiverSourceRoot],
        retainContextWhenHidden: true,
      },
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message: unknown) => {
      this.handleWebviewMessage(message);
    });

    this.panel.webview.html = createQuiverWebviewHtml(
      this.panel.webview,
      quiverSourceRoot,
    );
  }

  private handleWebviewMessage(message: unknown): void {
    const parsed = parseWebviewMessage(message);
    if (parsed === undefined) {
      this.logger.warn("Received unknown message from webview", {
        messageType: typeof message,
      });
      return;
    }

    match(parsed)
      .with({ type: "vscode-quiver.webviewReady" }, () => {
        this.logger.info("q.uiver webview is ready");
      })
      .with({ type: "vscode-quiver.webviewError" }, (error) => {
        this.logger.error("q.uiver webview reported an error", {
          message: error.message,
          phase: error.phase,
        });
        void vscode.window.showErrorMessage(
          `vscode-quiver: ${error.phase}: ${error.message}`,
        );
      })
      .exhaustive();
  }
}
