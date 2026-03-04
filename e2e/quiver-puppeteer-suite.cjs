const assert = require("node:assert/strict");
const puppeteer = require("puppeteer-core");
const vscode = require("vscode");

const DEBUG_PORT = process.env.VSCODE_QUIVER_E2E_DEBUG_PORT ?? "9333";
const FIXTURE_PATH = process.env.VSCODE_QUIVER_E2E_FIXTURE;

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function connectToDebugBrowser(timeoutMs) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await puppeteer.connect({
        browserURL: `http://127.0.0.1:${String(DEBUG_PORT)}`,
        defaultViewport: null,
      });
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  const detail =
    lastError instanceof Error ? lastError.message : String(lastError ?? "unknown");
  throw new Error(`Timed out connecting to VS Code debug browser: ${detail}`);
}

async function findWorkbenchPage(browser, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const pages = await browser.pages();
    const workbench = pages.find((page) => page.url().includes("workbench"));
    if (workbench !== undefined) {
      return workbench;
    }
    if (pages.length > 0) {
      return pages[0];
    }
    await sleep(200);
  }
  throw new Error("No VS Code workbench page found.");
}

async function findQuiverFrame(page, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const frame of page.frames()) {
      try {
        const status = await frame.$("#vscode-quiver-status");
        if (status !== null) {
          return frame;
        }
      } catch {
        // Ignore detached/transient frames while workbench settles.
      }
    }
    await sleep(200);
  }
  throw new Error("Timed out waiting for q.uiver webview frame.");
}

async function openFixtureAndPanel() {
  assert.ok(FIXTURE_PATH, "VSCODE_QUIVER_E2E_FIXTURE env variable is required.");
  const uri = vscode.Uri.file(FIXTURE_PATH);
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
  });
  await vscode.commands.executeCommand("vscode-quiver.openPanel");
}

async function waitForReadyStatus(frame) {
  await frame.waitForFunction(
    () => {
      const status = document.querySelector("#vscode-quiver-status");
      if (!(status instanceof HTMLElement)) {
        return false;
      }
      const value = status.textContent ?? "";
      return value.includes("q.uiver ready");
    },
    { timeout: 30_000 },
  );
}

async function run() {
  await openFixtureAndPanel();
  const browser = await connectToDebugBrowser(45_000);
  try {
    const workbench = await findWorkbenchPage(browser, 30_000);
    const quiverFrame = await findQuiverFrame(workbench, 30_000);
    await waitForReadyStatus(quiverFrame);

    const statusText = await quiverFrame.$eval(
      "#vscode-quiver-status",
      (element) => element.textContent?.trim() ?? "",
    );
    assert.ok(
      statusText.includes("q.uiver ready"),
      `Expected ready status in webview, got: ${statusText}`,
    );
  } finally {
    await browser.close();
  }
}

module.exports = {
  run,
};
