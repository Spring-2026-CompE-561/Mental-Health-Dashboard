import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkGrammar } from "./grammarCheck";

describe("checkGrammar", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns [] for empty / very-short text without making a network call", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    expect(await checkGrammar("")).toEqual([]);
    expect(await checkGrammar("hi")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps the LanguageTool response shape into GrammarMatch[]", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        matches: [
          {
            offset: 4,
            length: 5,
            message: "Possible spelling mistake",
            shortMessage: "Spelling",
            rule: { issueType: "misspelling", category: { id: "TYPOS" } },
            replacements: [{ value: "happy" }, { value: "harpy" }, { value: "hippy" }, { value: "drop-me" }],
          },
        ],
      }),
    })) as unknown as typeof fetch;

    const matches = await checkGrammar("I am hapyy today and feeling great.");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      offset: 4,
      length: 5,
      category: "spelling",
      message: "Spelling",
    });
    // Only 3 replacements are exposed.
    expect(matches[0].replacements).toEqual(["happy", "harpy", "hippy"]);
  });

  it("returns [] when the network call fails (never throws)", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    await expect(checkGrammar("This is a long enough sentence to trigger a check.")).resolves.toEqual([]);
  });

  it("returns [] when LanguageTool responds non-2xx", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as unknown as typeof fetch;
    await expect(checkGrammar("This is a long enough sentence to trigger a check.")).resolves.toEqual([]);
  });
});
