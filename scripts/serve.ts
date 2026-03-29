#!/usr/bin/env tsx
/**
 * scripts/serve.ts — (re)start the static HTTP server on the configured port.
 *
 * Steps:
 *   1. Kill whatever process is currently bound to the configured port (if any)
 *   2. Spawn `node server.js` as a detached background process
 *   3. Confirm the server is accepting connections
 *
 * Run: npm run serve
 * Env: PORT=3100 npm run serve
 *
 * After running, refresh the Simple Browser (already open at
 * http://127.0.0.1:3000 by default) to see the latest version of the site.
 */

import { execSync, spawn } from "child_process";
import { platform }        from "os";
import { join, dirname }   from "path";
import { fileURLToPath }   from "url";
import net                 from "net";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || "3000");
const HOST = "127.0.0.1";
const DETACH = process.env.SERVE_DETACH !== "false";

// ── 1. Kill any process currently on PORT ─────────────────────────

function killPort(port: number): void {
  if (platform() === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8" });
      const pids = [
        ...new Set(
          out.trim().split("\n")
            .map(line => line.trim().split(/\s+/).at(-1))
            .filter((p): p is string => !!p && /^\d+$/.test(p) && p !== "0"),
        ),
      ];
      if (pids.length) {
        console.log(`  Stopping PID(s) ${pids.join(", ")} bound to port ${port}...`);
        for (const pid of pids) {
          try { execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" }); } catch { /* already gone */ }
        }
      }
    } catch { /* nothing on port — proceed */ }
  } else {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    } catch { /* nothing on port */ }
  }
}

// ── 2. Wait for the port to be free ──────────────────────────────

function waitForPortFree(port: number, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const probe = net.createConnection({ port, host: HOST });
      probe.once("connect", () => {
        probe.destroy();
        if (Date.now() < deadline) setTimeout(check, 150);
        else reject(new Error(`Port ${port} still occupied after ${timeoutMs}ms`));
      });
      probe.once("error", () => { probe.destroy(); resolve(); });
    };
    check();
  });
}

// ── 3. Wait for the server to be ready ───────────────────────────

function waitForPortOpen(port: number, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const probe = net.createConnection({ port, host: HOST });
      probe.once("connect", () => { probe.destroy(); resolve(); });
      probe.once("error", () => {
        probe.destroy();
        if (Date.now() < deadline) setTimeout(check, 150);
        else reject(new Error(`Server did not start within ${timeoutMs}ms`));
      });
    };
    check();
  });
}

// ── Main ──────────────────────────────────────────────────────────

console.log("\n── album-review serve ──────────────────────────────────────\n");

killPort(PORT);

await waitForPortFree(PORT);

console.log("  Starting server...");
const srv = spawn("node", ["server.js"], {
  cwd: ROOT,
  detached: DETACH,
  env: { ...process.env, PORT: String(PORT) },
  stdio: DETACH ? "ignore" : "inherit",
});

if (DETACH) srv.unref();

await waitForPortOpen(PORT);

console.log(`  Server running at http://${HOST}:${PORT}`);

if (DETACH) {
  console.log("\n  Refresh the Simple Browser panel to see the latest index.\n");
} else {
  console.log("\n  Running in foreground mode. Press Ctrl+C to stop.\n");
  await new Promise((resolve, reject) => {
    srv.once("exit", code => {
      if (code === 0 || code === null) resolve(undefined);
      else reject(new Error(`server.js exited with code ${code}`));
    });
  });
}
