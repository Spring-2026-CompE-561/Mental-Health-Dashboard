import { describe, expect, it, vi, beforeEach } from "vitest";

// Mocks must be hoisted before importing the module under test.
const mocks = vi.hoisted(() => {
  const post = vi.fn();
  const get = vi.fn();
  const put = vi.fn();
  const del = vi.fn();
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const instance = { post, get, put, delete: del, interceptors };
  return {
    instance,
    post,
    get,
    put,
    del,
    interceptors,
    create: vi.fn(() => instance),
  };
});

vi.mock("axios", () => ({
  default: { create: mocks.create },
}));

beforeEach(() => {
  mocks.post.mockReset();
  mocks.get.mockReset();
  mocks.put.mockReset();
  mocks.del.mockReset();
});

describe("api service", () => {
  it("creates an axios instance with /api baseURL and registers interceptors", async () => {
    await import("./api");
    expect(mocks.create).toHaveBeenCalledWith({
      baseURL: "/api",
      headers: { "Content-Type": "application/json" },
    });
    expect(mocks.interceptors.request.use).toHaveBeenCalled();
    expect(mocks.interceptors.response.use).toHaveBeenCalled();
  });

  it("login() POSTs /login and returns data", async () => {
    const { login } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { access_token: "abc", token_type: "bearer" } });
    const out = await login({ email: "a@b.com", password: "pw" });
    expect(mocks.post).toHaveBeenCalledWith("/login", { email: "a@b.com", password: "pw" });
    expect(out.access_token).toBe("abc");
  });

  it("createAccount() POSTs /create-account", async () => {
    const { createAccount } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { id: 1, username: "u", email: "e", oauth_provider: null, created_at: "" } });
    const u = await createAccount({ username: "u", email: "e", password: "p" });
    expect(mocks.post).toHaveBeenCalledWith("/create-account", { username: "u", email: "e", password: "p" });
    expect(u.id).toBe(1);
  });

  it("logout() hits /logout", async () => {
    const { logout } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { success: true, message: "ok" } });
    await logout();
    expect(mocks.post).toHaveBeenCalledWith("/logout");
  });

  it("forgotPassword() hits /forgot-password", async () => {
    const { forgotPassword } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { success: true, message: "" } });
    await forgotPassword({ email: "a@b.com" });
    expect(mocks.post).toHaveBeenCalledWith("/forgot-password", { email: "a@b.com" });
  });

  it("resetPassword() forwards token and new_password", async () => {
    const { resetPassword } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { success: true, message: "" } });
    await resetPassword({ token: "t", new_password: "n" });
    expect(mocks.post).toHaveBeenCalledWith("/reset-password", { token: "t", new_password: "n" });
  });

  it("getGoogleAuthUrl() GETs /auth/google/login", async () => {
    const { getGoogleAuthUrl } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: { url: "https://g/oauth" } });
    const out = await getGoogleAuthUrl();
    expect(mocks.get).toHaveBeenCalledWith("/auth/google/login");
    expect(out.url).toBe("https://g/oauth");
  });

  it("getMe() GETs /users/me", async () => {
    const { getMe } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: { id: 1, username: "u", email: "e", oauth_provider: null, created_at: "" } });
    const me = await getMe();
    expect(mocks.get).toHaveBeenCalledWith("/users/me");
    expect(me.id).toBe(1);
  });

  it("createJournal() POSTs to /journals/create", async () => {
    const { createJournal } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { id: 1, user_id: 1, body: "x", created_at: "2026-01-01" } });
    await createJournal({ body: "x" });
    expect(mocks.post).toHaveBeenCalledWith("/journals/create", { body: "x" });
  });

  it("getJournals() GETs /journals", async () => {
    const { getJournals } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: [] });
    const out = await getJournals();
    expect(mocks.get).toHaveBeenCalledWith("/journals");
    expect(out).toEqual([]);
  });

  it("getJournal(id) GETs /journals/:id", async () => {
    const { getJournal } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: { id: 5, user_id: 1, body: "b", created_at: "2026-01-01" } });
    const j = await getJournal(5);
    expect(mocks.get).toHaveBeenCalledWith("/journals/5");
    expect(j.id).toBe(5);
  });

  it("updateJournal(id) PUTs /journals/:id", async () => {
    const { updateJournal } = await import("./api");
    mocks.put.mockResolvedValueOnce({ data: { id: 5, user_id: 1, body: "new", created_at: "2026-01-01" } });
    await updateJournal(5, { body: "new" });
    expect(mocks.put).toHaveBeenCalledWith("/journals/5", { body: "new" });
  });

  it("deleteJournal(id) DELETEs /journals/:id", async () => {
    const { deleteJournal } = await import("./api");
    mocks.del.mockResolvedValueOnce({ data: { success: true, message: "deleted" } });
    await deleteJournal(5);
    expect(mocks.del).toHaveBeenCalledWith("/journals/5");
  });

  it("createQuestionnaire() POSTs to /questionnaires", async () => {
    const { createQuestionnaire } = await import("./api");
    mocks.post.mockResolvedValueOnce({ data: { id: 1, user_id: 1, mood: 5, anxiety: 5, depression: 5, score: null, created_at: "2026-01-01" } });
    await createQuestionnaire({ mood: 5, depression: 5, anxiety: 5 });
    expect(mocks.post).toHaveBeenCalledWith("/questionnaires", { mood: 5, depression: 5, anxiety: 5 });
  });

  it("getQuestionnaires() forwards date filters as snake_case params", async () => {
    const { getQuestionnaires } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: [] });
    await getQuestionnaires({ fromDate: "2026-01-01", toDate: "2026-01-31" });
    expect(mocks.get).toHaveBeenCalledWith("/questionnaires", {
      params: { from_date: "2026-01-01", to_date: "2026-01-31" },
    });
  });

  it("getQuestionnaires() omits empty filters", async () => {
    const { getQuestionnaires } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: [] });
    await getQuestionnaires();
    expect(mocks.get).toHaveBeenCalledWith("/questionnaires", { params: {} });
  });

  it("getTodaysQuestionnaire() GETs /questionnaires/today", async () => {
    const { getTodaysQuestionnaire } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: null });
    await getTodaysQuestionnaire();
    expect(mocks.get).toHaveBeenCalledWith("/questionnaires/today");
  });

  it("getQuestionnaireAverage() forwards filters", async () => {
    const { getQuestionnaireAverage } = await import("./api");
    mocks.get.mockResolvedValueOnce({ data: { mood: 5, depression: 5, anxiety: 5 } });
    await getQuestionnaireAverage({ fromDate: "2026-01-01" });
    expect(mocks.get).toHaveBeenCalledWith("/questionnaires/average", {
      params: { from_date: "2026-01-01" },
    });
  });

  it("updatePassword() PUTs /users/:id with both passwords", async () => {
    const { updatePassword } = await import("./api");
    mocks.put.mockResolvedValueOnce({ data: { success: true, message: "" } });
    await updatePassword(7, { current_password: "old", new_password: "new" });
    expect(mocks.put).toHaveBeenCalledWith("/users/7", {
      current_password: "old",
      new_password: "new",
    });
  });

  it("deleteAccount() DELETEs /users/:id with password body", async () => {
    const { deleteAccount } = await import("./api");
    mocks.del.mockResolvedValueOnce({ data: { success: true, message: "" } });
    await deleteAccount(7, { password: "pw" });
    expect(mocks.del).toHaveBeenCalledWith("/users/7", { data: { password: "pw" } });
  });

  it("getAiPrompt() GETs /journals/ai-prompt and returns prompt+source", async () => {
    const { getAiPrompt } = await import("./api");
    mocks.get.mockResolvedValueOnce({
      data: { prompt: "What is sitting with you today?", source: "ai" },
    });
    const out = await getAiPrompt();
    expect(mocks.get).toHaveBeenCalledWith("/journals/ai-prompt");
    expect(out).toEqual({ prompt: "What is sitting with you today?", source: "ai" });
  });
});
