import { P, match } from "ts-pattern";

export interface WebviewReadyMessage {
  readonly type: "vscode-quiver.webviewReady";
}

export interface WebviewErrorMessage {
  readonly message: string;
  readonly phase: string;
  readonly type: "vscode-quiver.webviewError";
}

export type WebviewToHostMessage = WebviewReadyMessage | WebviewErrorMessage;

export function parseWebviewMessage(
  value: unknown,
): WebviewToHostMessage | undefined {
  const parsed = match(value)
    .with({ type: "vscode-quiver.webviewReady" }, (): WebviewReadyMessage => ({
      type: "vscode-quiver.webviewReady",
    }))
    .with(
      {
        message: P.string,
        phase: P.string,
        type: "vscode-quiver.webviewError",
      },
      (message): WebviewErrorMessage => ({
        message: message.message,
        phase: message.phase,
        type: "vscode-quiver.webviewError",
      }),
    )
    .otherwise(() => null);
  if (parsed === null) {
    return;
  }
  return parsed;
}
