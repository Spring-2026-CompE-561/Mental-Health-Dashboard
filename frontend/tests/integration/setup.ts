/**
 * Boot the FastAPI backend in a subprocess for the duration of the integration tests.
 *
 * - Picks a free port and writes it to the BACKEND_PORT env so the tests know where to connect.
 * - Uses the backend's uv-managed venv at backend/.venv when present; otherwise falls back to `python3`.
 * - Sets DATABASE_URL to a throwaway SQLite file so we don't touch dev data.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import fs from "node:fs";

let backend: ChildProcess | null = null;

const ROOT = path.resolve(__dirname, "../../..");
const BACKEND_DIR = path.join(ROOT, "backend");
const VENV_PYTHON = path.join(BACKEND_DIR, ".venv", "bin", "python");
const TEST_DB = path.join(BACKEND_DIR, "integration_test.db");

function pickPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Could not pick a free port"));
        return;
      }
      const port = addr.port;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHealthy(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) {
        const body = (await res.json()) as { status: string };
        if (body.status === "healthy") return;
      }
    } catch {
      // backend not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Backend did not become healthy on port ${port} within ${timeoutMs}ms`);
}

export async function setup(): Promise<void> {
  const port = await pickPort();
  process.env.BACKEND_PORT = String(port);

  // Start fresh — drop any lingering test DB
  try {
    fs.unlinkSync(TEST_DB);
  } catch {
    // not present, fine
  }

  const python = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";

  backend = spawn(
    python,
    ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port), "--log-level", "warning"],
    {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        PYTHONPATH: path.join(BACKEND_DIR, "src"),
        DATABASE_URL: `sqlite:///./integration_test.db`,
        SECRET_KEY: "integration-test-secret-key-which-is-long-enough",
        SMTP_USERNAME: "test@example.com",
        SMTP_PASSWORD: "test-password",
        SMTP_FROM_EMAIL: "test@example.com",
        FRONTEND_URL: "http://localhost:3000",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  backend.stderr?.on("data", (chunk: Buffer) => {
    const line = chunk.toString();
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("traceback")) {
      process.stderr.write(`[backend] ${line}`);
    }
  });

  await waitForHealthy(port);
}

export async function teardown(): Promise<void> {
  if (backend && !backend.killed) {
    backend.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 250));
    if (!backend.killed) backend.kill("SIGKILL");
  }
  try {
    fs.unlinkSync(TEST_DB);
  } catch {
    // already gone
  }
}
