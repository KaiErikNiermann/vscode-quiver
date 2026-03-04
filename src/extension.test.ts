import { beforeEach, describe, expect, it, vi } from "vitest";

interface DisposableLike {
  dispose: () => void;
}

const harness = vi.hoisted(() => {
  const commandHandlers = new Map<string, () => void>();
  const controllerInstances: { openOrReveal: ReturnType<typeof vi.fn> }[] = [];

  const outputChannel = {
    debug: vi.fn(),
    dispose: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  const vscodeModule = {
    commands: {
      registerCommand: vi.fn((command: string, callback: () => void): DisposableLike => {
        commandHandlers.set(command, callback);
        return { dispose: vi.fn() };
      }),
    },
    window: {
      createOutputChannel: vi.fn(() => outputChannel),
    },
  };

  class MockQuiverPanelController {
    public readonly openOrReveal = vi.fn();

    public constructor(_options: unknown) {
      controllerInstances.push(this);
    }

    public dispose(): void {
      // no-op mock disposable
    }
  }

  const reset = (): void => {
    commandHandlers.clear();
    controllerInstances.length = 0;

    for (const fn of [
      outputChannel.debug,
      outputChannel.dispose,
      outputChannel.error,
      outputChannel.info,
      outputChannel.warn,
      vscodeModule.commands.registerCommand,
      vscodeModule.window.createOutputChannel,
    ]) {
      fn.mockClear();
    }
  };

  return {
    commandHandlers,
    controllerInstances,
    MockQuiverPanelController,
    reset,
    vscodeModule,
  };
});

vi.mock("vscode", () => harness.vscodeModule);
vi.mock("./quiver-panel", () => ({
  QuiverPanelController: harness.MockQuiverPanelController,
}));

describe("activate", () => {
  beforeEach(() => {
    harness.reset();
    vi.resetModules();
  });

  it("registers open command and wires it to panel reveal", async () => {
    const extension = await import("./extension");
    const context = {
      extensionPath: "/home/as_user/Projects/vscode-quiver",
      subscriptions: [] as DisposableLike[],
    };

    extension.activate(context as never);

    expect(harness.vscodeModule.window.createOutputChannel).toHaveBeenCalledWith(
      "vscode-quiver",
      { log: true },
    );
    expect(harness.vscodeModule.commands.registerCommand).toHaveBeenCalledWith(
      "vscode-quiver.openPanel",
      expect.any(Function),
    );
    expect(context.subscriptions).toHaveLength(3);

    const handler = harness.commandHandlers.get("vscode-quiver.openPanel");
    expect(handler).toBeTypeOf("function");
    handler?.();

    const instance = harness.controllerInstances[0];
    expect(instance).toBeDefined();
    expect(instance?.openOrReveal).toHaveBeenCalledTimes(1);
  });
});
