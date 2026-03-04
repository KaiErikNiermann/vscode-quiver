#!/usr/bin/env node

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { runTests } = require("@vscode/test-electron");

const DEFAULT_DEBUG_PORT = "9333";

async function makeWorkspace() {
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vscode-quiver-e2e-"));
  const fixturePath = path.join(workspaceDir, "Fixture.txt");
  await fs.writeFile(fixturePath, "vscode-quiver smoke fixture\n", "utf8");
  return { fixturePath, workspaceDir };
}

function resolveLocalCodeExecutable() {
  const fromEnvironment = process.env.VSCODE_QUIVER_VSCODE_EXECUTABLE;
  if (typeof fromEnvironment === "string" && fromEnvironment.trim().length > 0) {
    return fromEnvironment.trim();
  }
  const resolved = spawnSync("sh", ["-lc", "command -v code"], {
    encoding: "utf8",
  });
  if (resolved.status !== 0) {
    return undefined;
  }
  const candidate = resolved.stdout.trim();
  return candidate.length === 0 ? undefined : candidate;
}

async function main() {
  const extensionRoot = path.resolve(__dirname, "..");
  const debugPort = process.env.VSCODE_QUIVER_E2E_DEBUG_PORT ?? DEFAULT_DEBUG_PORT;
  const { fixturePath, workspaceDir } = await makeWorkspace();
  const extensionTestsPath = path.join(__dirname, "quiver-puppeteer-suite.cjs");
  const localCodeExecutable = resolveLocalCodeExecutable();

  try {
    await runTests({
      extensionDevelopmentPath: extensionRoot,
      extensionTestsEnv: {
        ...process.env,
        VSCODE_QUIVER_E2E_DEBUG_PORT: String(debugPort),
        VSCODE_QUIVER_E2E_FIXTURE: fixturePath,
      },
      extensionTestsPath,
      launchArgs: [
        workspaceDir,
        `--remote-debugging-port=${String(debugPort)}`,
        "--disable-updates",
        "--skip-release-notes",
        "--skip-welcome",
        "--disable-workspace-trust",
      ],
      reuseMachineInstall: false,
      ...(localCodeExecutable === undefined
        ? {}
        : { vscodeExecutablePath: localCodeExecutable }),
    });
  } finally {
    if (process.env.VSCODE_QUIVER_E2E_KEEP_WORKSPACE !== "1") {
      await fs.rm(workspaceDir, {
        force: true,
        recursive: true,
      });
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vscode-quiver Puppeteer E2E failed: ${message}`);
  process.exitCode = 1;
});
