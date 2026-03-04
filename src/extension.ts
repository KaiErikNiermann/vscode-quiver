import * as vscode from "vscode";
import { createLogger } from "./logger";
import { QuiverPanelController } from "./quiver-panel";

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("vscode-quiver", {
    log: true,
  });
  const logger = createLogger(output);
  const quiverPanel = new QuiverPanelController({
    extensionPath: context.extensionPath,
    logger,
  });

  context.subscriptions.push(output, quiverPanel);

  const openPanel = vscode.commands.registerCommand(
    "vscode-quiver.openPanel",
    () => {
      quiverPanel.openOrReveal();
    },
  );

  context.subscriptions.push(openPanel);
  logger.info("vscode-quiver extension activated");
}

export function deactivate(): void {
  // no-op
}
