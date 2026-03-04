import { randomBytes } from "node:crypto";
import * as vscode from "vscode";

function createNonce(): string {
  return randomBytes(16).toString("hex");
}

export function createQuiverWebviewHtml(
  webview: vscode.Webview,
  quiverSourceRoot: vscode.Uri,
): string {
  const nonce = createNonce();
  const uri = (relativePath: string): string =>
    String(webview.asWebviewUri(vscode.Uri.joinPath(quiverSourceRoot, relativePath)));

  const quiverModules = [
    "ds.mjs",
    "dom.mjs",
    "quiver.mjs",
    "curve.mjs",
    "arrow.mjs",
    "parser.mjs",
    "ui.mjs",
  ];

  const moduleScripts = quiverModules
    .map((moduleName) => `<script type="module" src="${uri(moduleName)}"></script>`)
    .join("\n  ");

  const csp = [
    `default-src ${webview.cspSource}`,
    `img-src ${webview.cspSource} data:`,
    `font-src ${webview.cspSource} data: https:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}' 'unsafe-inline' ${webview.cspSource}`,
    `connect-src ${webview.cspSource} data: https:`,
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <base href="${String(webview.asWebviewUri(quiverSourceRoot))}/" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />
  <title>vscode-quiver</title>
  <link rel="preload" href="${uri("quiver-blue.svg")}" as="image" />
  <link rel="stylesheet" type="text/css" media="screen" href="${uri("main.css")}" />
  ${moduleScripts}
  <style>
    :root {
      --vscode-quiver-toolbar-clearance: 40px;
      --vscode-quiver-node-foreground: #000000;
    }
    .toolbar {
      top: calc(16px + var(--vscode-quiver-toolbar-clearance));
    }
    .ui > .tooltip {
      top: calc(var(--vscode-quiver-toolbar-clearance) + 16px + 48px + 8px);
    }
    .vertex .label,
    .arrow .label,
    .arrow foreignObject.arrow-label > .label,
    .vertex .label .katex,
    .arrow .label .katex {
      color: var(--vscode-quiver-node-foreground);
      fill: var(--vscode-quiver-node-foreground);
    }
    .vertex .label .katex *,
    .arrow .label .katex * {
      color: inherit;
    }
    .vertex .label svg text,
    .arrow .label svg text {
      fill: var(--vscode-quiver-node-foreground);
      stroke: none;
    }
    .vscode-quiver-topbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
      background: var(--vscode-sideBar-background, #252526);
      padding: 8px 10px;
      pointer-events: none;
      font: 12px/1.2 var(--vscode-font-family, system-ui, sans-serif);
      color: var(--vscode-descriptionForeground, #9b9b9b);
    }
    .vscode-quiver-topbar > span {
      pointer-events: auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="vscode-quiver-topbar">
    <span>vscode-quiver</span>
    <span id="vscode-quiver-status">Loading q.uiver...</span>
  </div>
  <a id="logo-link" href="https://github.com/varkor/quiver" target="_blank">
    <img src="${uri("quiver.svg")}" class="logo" />
  </a>
  <noscript>JavaScript must be enabled to use q.uiver.</noscript>
  <script type="module" nonce="${nonce}">
    import { cancel, DOM, pointer_event } from "${uri("dom.mjs")}";
    import { url_parameters } from "${uri("ds.mjs")}";

    const queryData = url_parameters();
    if (queryData.has("embed")) {
      document.body.classList.add("embedded");
    }

    const loadingScreen = new DOM.Div({ class: "loading-screen hidden" })
      .add(new DOM.Element("img", { src: "${uri("quiver-blue.svg")}", class: "logo" }))
      .add(new DOM.Element("span").add("Loading diagram..."))
      .listen(pointer_event("down"), cancel)
      .listen(pointer_event("move"), cancel)
      .listen(pointer_event("up"), cancel)
      .listen("wheel", cancel, { passive: true });

    if (queryData.has("q")) {
      document.addEventListener("keydown", cancel);
      document.addEventListener("keyup", cancel);
      loadingScreen.class_list.remove("hidden");
    }

    document.body.appendChild(loadingScreen.element);
  </script>
  <script nonce="${nonce}">
    (function () {
      const statusElement = document.getElementById("vscode-quiver-status");
      if (!(statusElement instanceof HTMLElement)) {
        return;
      }

      const vscodeApi = (() => {
        if (typeof acquireVsCodeApi !== "function") {
          return undefined;
        }
        try {
          return acquireVsCodeApi();
        } catch {
          return undefined;
        }
      })();

      const updateToolbarOffset = () => {
        const topbar = document.querySelector(".vscode-quiver-topbar");
        if (!(topbar instanceof HTMLElement)) {
          return;
        }
        const measured = Math.ceil(topbar.getBoundingClientRect().height);
        const clearance = Number.isFinite(measured) ? Math.max(40, measured) : 40;
        document.documentElement.style.setProperty(
          "--vscode-quiver-toolbar-clearance",
          clearance + "px",
        );
      };

      if (typeof ResizeObserver === "function") {
        const topbar = document.querySelector(".vscode-quiver-topbar");
        if (topbar instanceof HTMLElement) {
          new ResizeObserver(updateToolbarOffset).observe(topbar);
        }
      }
      window.addEventListener("resize", updateToolbarOffset);
      updateToolbarOffset();

      const postToExtension = (payload) => {
        if (!vscodeApi || typeof vscodeApi.postMessage !== "function") {
          return;
        }
        vscodeApi.postMessage(payload);
      };

      window.addEventListener("error", (event) => {
        postToExtension({
          message: event.error instanceof Error ? event.error.message : String(event.message),
          phase: "window.error",
          type: "vscode-quiver.webviewError",
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        postToExtension({
          message: event.reason instanceof Error ? event.reason.message : String(event.reason),
          phase: "window.unhandledrejection",
          type: "vscode-quiver.webviewError",
        });
      });

      const BRIDGE_SOURCE = "lean-cd.quiver.child";
      window.addEventListener("message", (event) => {
        const data = event.data;
        if (typeof data !== "object" || data === null) {
          return;
        }
        if (data.source !== BRIDGE_SOURCE || typeof data.type !== "string") {
          return;
        }
        if (data.type === "lean-cd.quiver.ready") {
          statusElement.textContent = "q.uiver ready";
          postToExtension({ type: "vscode-quiver.webviewReady" });
          return;
        }
        if (data.type === "lean-cd.quiver.error") {
          const phase = typeof data.phase === "string" ? data.phase : "quiver";
          const message = typeof data.message === "string" ? data.message : "Unknown q.uiver error";
          statusElement.textContent = "q.uiver error";
          postToExtension({
            message,
            phase,
            type: "vscode-quiver.webviewError",
          });
        }
      });

      statusElement.textContent = "Waiting for q.uiver...";
      const hostSource = "lean-cd.quiver.host";
      const ping = () => {
        window.postMessage({ source: hostSource, type: "lean-cd.host.ping" }, "*");
      };
      ping();
      const pingTimer = setInterval(ping, 500);
      setTimeout(() => {
        clearInterval(pingTimer);
      }, 15000);
    })();
  </script>
</body>
</html>`;
}
