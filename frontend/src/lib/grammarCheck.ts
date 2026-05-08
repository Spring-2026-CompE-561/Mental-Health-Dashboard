/**
 * Lightweight grammar/spelling check powered by LanguageTool's free public API.
 *
 * LanguageTool is open-source and the public endpoint is rate-limited to roughly
 * 20 req/min/IP without an API key, which is plenty for an interactive textarea
 * with debouncing. If LT is unreachable we silently return no matches so the
 * journal experience never blocks on grammar checking.
 *
 * Docs: https://languagetool.org/http-api/swagger-ui/#!/default/post_check
 */

const LT_ENDPOINT = "https://api.languagetool.org/v2/check";

export interface GrammarMatch {
  /** UTF-16 offset into the input where the issue begins. */
  offset: number;
  /** Number of characters spanned by the issue. */
  length: number;
  /** Short human-readable explanation. */
  message: string;
  /** "spelling" | "grammar" | "style" | "other" — used to pick the underline colour. */
  category: "spelling" | "grammar" | "style" | "other";
  /** Replacement suggestions, capped at 3. */
  replacements: string[];
}

interface LtRawMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage?: string;
  rule?: { issueType?: string; category?: { id?: string } };
  replacements?: { value: string }[];
}

function categoryOf(raw: LtRawMatch): GrammarMatch["category"] {
  const issueType = raw.rule?.issueType ?? "";
  const cat = raw.rule?.category?.id ?? "";
  if (issueType === "misspelling" || cat === "TYPOS") return "spelling";
  if (issueType === "grammar" || cat === "GRAMMAR") return "grammar";
  if (issueType === "style" || cat === "STYLE" || cat === "REDUNDANCY") return "style";
  return "other";
}

export async function checkGrammar(
  text: string,
  signal?: AbortSignal,
): Promise<GrammarMatch[]> {
  if (!text || text.trim().length < 3) return [];

  const body = new URLSearchParams({
    text,
    language: "en-US",
    enabledOnly: "false",
  });

  let res: Response;
  try {
    res = await fetch(LT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal,
    });
  } catch {
    return []; // network down / aborted — non-fatal
  }
  if (!res.ok) return [];

  let payload: { matches?: LtRawMatch[] };
  try {
    payload = await res.json();
  } catch {
    return [];
  }
  const matches = payload.matches ?? [];
  return matches.map((m) => ({
    offset: m.offset,
    length: m.length,
    message: m.shortMessage || m.message,
    category: categoryOf(m),
    replacements: (m.replacements ?? []).slice(0, 3).map((r) => r.value),
  }));
}
