import { describe, expect, it } from "vitest";
import { parseWebviewMessage } from "./protocol";

describe("parseWebviewMessage", () => {
  it("parses ready payload", () => {
    expect(parseWebviewMessage({ type: "vscode-quiver.webviewReady" })).toEqual({
      type: "vscode-quiver.webviewReady",
    });
  });

  it("parses error payload", () => {
    expect(
      parseWebviewMessage({
        message: "failed",
        phase: "bridge",
        type: "vscode-quiver.webviewError",
      }),
    ).toEqual({
      message: "failed",
      phase: "bridge",
      type: "vscode-quiver.webviewError",
    });
  });

  it("rejects unknown payload", () => {
    expect(parseWebviewMessage({ type: "unknown" })).toBeUndefined();
  });
});
