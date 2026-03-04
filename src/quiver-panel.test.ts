import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuiverPanelController } from "./quiver-panel";

interface MockUri {
  readonly fsPath: string;
  toString: () => string;
}

const harness = vi.hoisted(() => {
  let disposeHandler: (() => void) | undefined;
  let messageHandler: ((message: unknown) => void) | undefined;

  const webview = {
    asWebviewUri: vi.fn((uri: MockUri) => ({
      toString: () => `webview:${uri.toString()}`,
    })),
    cspSource: "vscode-webview",
    html: "",
    onDidReceiveMessage: vi.fn((callback: (message: unknown) => void) => {
      messageHandler = callback;
      return { dispose: vi.fn() };
    }),
  };

  const panel = {
    dispose: vi.fn(),
    onDidDispose: vi.fn((callback: () => void) => {
      disposeHandler = callback;
      return { dispose: vi.fn() };
    }),
    reveal: vi.fn(),
    webview,
  };

  const vscodeModule = {
    Uri: {
      file: vi.fn((value: string): MockUri => ({
        fsPath: value,
        toString: () => value,
      })),
      joinPath: vi.fn((base: MockUri, ...parts: readonly string[]): MockUri => {
        const joined = path.join(base.toString(), ...parts);
        return {
          fsPath: joined,
          toString: () => joined,
        };
      }),
    },
    ViewColumn: {
      Beside: 2,
    },
    window: {
      createWebviewPanel: vi.fn(() => panel),
      showErrorMessage: vi.fn(() => Promise.resolve()),
    },
  };

  const logger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  const reset = (): void => {
    messageHandler = undefined;
    disposeHandler = undefined;
    webview.html = "";

    for (const fn of [
      webview.asWebviewUri,
      webview.onDidReceiveMessage,
      panel.dispose,
      panel.onDidDispose,
      panel.reveal,
      vscodeModule.Uri.file,
      vscodeModule.Uri.joinPath,
      vscodeModule.window.createWebviewPanel,
      vscodeModule.window.showErrorMessage,
      logger.debug,
      logger.error,
      logger.info,
      logger.warn,
    ]) {
      fn.mockClear();
    }
  };

  return {
    disposeHandler: () => disposeHandler,
    logger,
    messageHandler: () => messageHandler,
    panel,
    reset,
    vscodeModule,
    webview,
  };
});

vi.mock("vscode", () => harness.vscodeModule);

function createController(): QuiverPanelController {
  return new QuiverPanelController({
    extensionPath: "/home/as_user/Projects/vscode-quiver-fixture",
    logger: harness.logger,
  });
}

describe("QuiverPanelController", () => {
  beforeEach(() => {
    harness.reset();
  });

  it("creates a webview panel and assigns q.uiver HTML", () => {
    const controller = createController();

    controller.openOrReveal();

    expect(harness.vscodeModule.window.createWebviewPanel).toHaveBeenCalledTimes(1);
    expect(harness.webview.html).toContain("vscode-quiver-topbar");
    expect(harness.webview.html).toContain("lean-cd.host.ping");
    expect(harness.webview.html).toContain("script type=\"module\"");
  });

  it("reuses existing panel on repeated open calls", () => {
    const controller = createController();

    controller.openOrReveal();
    controller.openOrReveal();

    expect(harness.vscodeModule.window.createWebviewPanel).toHaveBeenCalledTimes(1);
    expect(harness.panel.reveal).toHaveBeenCalledWith(2, true);
  });

  it("recreates panel after panel disposal callback", () => {
    const controller = createController();

    controller.openOrReveal();
    harness.disposeHandler()?.();
    controller.openOrReveal();

    expect(harness.vscodeModule.window.createWebviewPanel).toHaveBeenCalledTimes(2);
  });

  it("logs ready message from webview bridge", () => {
    const controller = createController();

    controller.openOrReveal();
    harness.messageHandler()?.({ type: "vscode-quiver.webviewReady" });

    expect(harness.logger.info).toHaveBeenCalledWith("q.uiver webview is ready");
  });

  it("logs unknown webview payloads as warnings", () => {
    const controller = createController();

    controller.openOrReveal();
    harness.messageHandler()?.({ type: "unknown" });

    expect(harness.logger.warn).toHaveBeenCalledWith(
      "Received unknown message from webview",
      { messageType: "object" },
    );
  });

  it("reports webview errors to logger and VS Code", () => {
    const controller = createController();

    controller.openOrReveal();
    harness.messageHandler()?.({
      message: "bridge failed",
      phase: "bridge",
      type: "vscode-quiver.webviewError",
    });

    expect(harness.logger.error).toHaveBeenCalledWith(
      "q.uiver webview reported an error",
      {
        message: "bridge failed",
        phase: "bridge",
      },
    );
    expect(harness.vscodeModule.window.showErrorMessage).toHaveBeenCalledWith(
      "vscode-quiver: bridge: bridge failed",
    );
  });

  it("disposes active panel", () => {
    const controller = createController();

    controller.openOrReveal();
    controller.dispose();

    expect(harness.panel.dispose).toHaveBeenCalledTimes(1);
  });
});
