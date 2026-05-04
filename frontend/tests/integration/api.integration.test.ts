/**
 * End-to-end integration test: frontend HTTP client ↔ FastAPI backend.
 *
 * The backend is spawned by tests/integration/setup.ts on a random free port
 * (exposed via process.env.BACKEND_PORT). This suite exercises the full HTTP
 * surface that the frontend's api.ts uses, against the real running server.
 *
 * Run with: npm run test:integration
 */

import { describe, expect, it, beforeAll } from "vitest";
import axios, { type AxiosInstance } from "axios";

let api: AxiosInstance;
let userPassword = "IntegrationTest!9";
let userEmail = "";
let userId = 0;
let token = "";

beforeAll(() => {
  const port = process.env.BACKEND_PORT;
  if (!port) {
    throw new Error("BACKEND_PORT not set — globalSetup must run before tests.");
  }
  api = axios.create({
    baseURL: `http://127.0.0.1:${port}/api`,
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true, // we'll assert manually
  });
  // Unique email per test run so reruns don't collide on the persistent DB
  userEmail = `it_${Date.now()}@example.com`;
});

describe("Integration: backend health", () => {
  it("GET / returns ok", async () => {
    const port = process.env.BACKEND_PORT;
    const resp = await axios.get(`http://127.0.0.1:${port}/`, { validateStatus: () => true });
    expect(resp.status).toBe(200);
    expect(resp.data.status).toBe("ok");
  });

  it("GET /api/health returns healthy", async () => {
    const resp = await api.get("/health");
    expect(resp.status).toBe(200);
    expect(resp.data).toEqual({ status: "healthy" });
  });

  it("attaches security headers", async () => {
    const resp = await api.get("/health");
    expect(resp.headers["x-content-type-options"]).toBe("nosniff");
    expect(resp.headers["x-frame-options"]).toBe("DENY");
  });
});

describe("Integration: auth flow (frontend -> backend)", () => {
  it("creates a new account", async () => {
    const resp = await api.post("/create-account", {
      username: "ituser",
      email: userEmail,
      password: userPassword,
    });
    expect(resp.status).toBe(201);
    expect(resp.data.email).toBe(userEmail);
    expect(resp.data.username).toBe("ituser");
    expect(typeof resp.data.id).toBe("number");
    userId = resp.data.id;
  });

  it("rejects duplicate email", async () => {
    const resp = await api.post("/create-account", {
      username: "dup",
      email: userEmail,
      password: userPassword,
    });
    expect([400, 409]).toContain(resp.status);
  });

  it("logs in with valid credentials", async () => {
    const resp = await api.post("/login", { email: userEmail, password: userPassword });
    expect(resp.status).toBe(200);
    expect(typeof resp.data.access_token).toBe("string");
    expect(resp.data.token_type).toBe("bearer");
    token = resp.data.access_token;
  });

  it("rejects invalid credentials", async () => {
    const resp = await api.post("/login", { email: userEmail, password: "WrongPassword" });
    expect(resp.status).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const resp = await api.get("/users/me", { headers: { Authorization: `Bearer ${token}` } });
    expect(resp.status).toBe(200);
    expect(resp.data.email).toBe(userEmail);
    expect(resp.data.id).toBe(userId);
  });

  it("rejects /users/me without a token", async () => {
    const resp = await api.get("/users/me");
    expect(resp.status).toBe(401);
  });
});

describe("Integration: journal CRUD over real HTTP", () => {
  it("creates, lists, reads, updates, and deletes a journal", async () => {
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    // Create
    const created = await api.post("/journals/create", { body: "Integration day 1" }, auth);
    expect(created.status).toBe(201);
    const journalId = created.data.id;
    expect(created.data.body).toBe("Integration day 1");
    expect(created.data).not.toHaveProperty("sentiment_score");

    // List
    const list = await api.get("/journals", auth);
    expect(list.status).toBe(200);
    expect(list.data.some((j: { id: number }) => j.id === journalId)).toBe(true);

    // Read
    const single = await api.get(`/journals/${journalId}`, auth);
    expect(single.status).toBe(200);
    expect(single.data.id).toBe(journalId);

    // Update
    const updated = await api.put(`/journals/${journalId}`, { body: "Integration day 1 (edited)" }, auth);
    expect(updated.status).toBe(200);
    expect(updated.data.body).toBe("Integration day 1 (edited)");

    // Delete
    const removed = await api.delete(`/journals/${journalId}`, auth);
    expect(removed.status).toBe(200);
    expect(removed.data.success).toBe(true);

    // Verify
    const missing = await api.get(`/journals/${journalId}`, auth);
    expect(missing.status).toBe(404);
  });

  it("rejects unauthenticated journal access", async () => {
    const resp = await api.get("/journals");
    expect(resp.status).toBe(401);
  });
});

describe("Integration: questionnaire flow over real HTTP", () => {
  it("submits a mood entry and reads it back", async () => {
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const created = await api.post(
      "/questionnaires",
      { mood: 8, depression: 4, anxiety: 3 },
      auth
    );
    expect([200, 201]).toContain(created.status);
    expect(created.data.mood).toBe(8);
    expect(created.data.depression).toBe(4);
    expect(created.data.anxiety).toBe(3);
    expect(typeof created.data.score).toBe("number");

    const today = await api.get("/questionnaires/today", auth);
    expect(today.status).toBe(200);
    expect(today.data.mood).toBe(8);

    const all = await api.get("/questionnaires", auth);
    expect(all.status).toBe(200);
    expect(Array.isArray(all.data)).toBe(true);
    expect(all.data.length).toBeGreaterThanOrEqual(1);

    const avg = await api.get("/questionnaires/average", auth);
    expect(avg.status).toBe(200);
    expect(typeof avg.data.average_score).toBe("number");
  });
});

describe("Integration: 404 + CORS sanity checks", () => {
  it("returns 404 for unknown routes", async () => {
    const resp = await api.get("/__definitely_not_a_route__");
    expect(resp.status).toBe(404);
  });

  it("permits CORS preflight from the frontend origin", async () => {
    const port = process.env.BACKEND_PORT;
    const resp = await axios.options(`http://127.0.0.1:${port}/api/login`, {
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
      validateStatus: () => true,
    });
    expect(resp.status).toBe(200);
  });
});
