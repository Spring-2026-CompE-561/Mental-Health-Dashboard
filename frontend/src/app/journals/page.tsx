"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { JOURNAL_PROMPTS } from "@/data/journalPrompts";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { checkGrammar, type GrammarMatch } from "@/lib/grammarCheck";
import {
  createJournal,
  deleteJournal,
  getAiPrompt,
  getJournals,
  updateJournal,
} from "@/services/api";
import type { Journal } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STRIPE_COLORS = ["#f9b2d7", "#b2def9", "#b2f9c8", "#f9f0b2"];

function previewOf(body: string): string {
  const firstLine = (body || "").split("\n")[0].trim();
  return firstLine.length > 80 ? firstLine.slice(0, 80) + "…" : firstLine || "(empty)";
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// SpeechRecognition is a vendor-prefixed Web API on some browsers; we use
// `unknown` casts to keep the types loose without resorting to plain `any`.
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

const SpeechRecognition: SpeechRecognitionCtor | null =
  typeof window !== "undefined"
    ? (window as SpeechWindow).SpeechRecognition ??
      (window as SpeechWindow).webkitSpeechRecognition ??
      null
    : null;

interface JournalModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialBody: string;
  onClose: () => void;
  onSave: (body: string) => void;
  saving: boolean;
}

function JournalModal({ open, mode, initialBody, onClose, onSave, saving }: JournalModalProps) {
  const [body, setBody] = useState(initialBody || "");
  const [listening, setListening] = useState(false);
  const [promptPlaceholder, setPromptPlaceholder] = useState("What's on your mind today?");
  const [promptLoading, setPromptLoading] = useState(false);
  const [grammarMatches, setGrammarMatches] = useState<GrammarMatch[]>([]);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastPromptRef = useRef<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open && recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setListening(false);
    }
    setBody(initialBody || "");
    setGrammarMatches([]);
  }, [initialBody, open]);

  // Debounced grammar/spell check via LanguageTool. Runs only while modal open
  // and resets on every keystroke, abandoning prior in-flight requests.
  useEffect(() => {
    if (!open) return;
    if (!body || body.trim().length < 6) {
      setGrammarMatches([]);
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setGrammarLoading(true);
      try {
        const matches = await checkGrammar(body, controller.signal);
        if (!controller.signal.aborted) setGrammarMatches(matches);
      } finally {
        if (!controller.signal.aborted) setGrammarLoading(false);
      }
    }, 800);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [body, open]);

  function applyReplacement(match: GrammarMatch, replacement: string) {
    setBody((prev) => prev.slice(0, match.offset) + replacement + prev.slice(match.offset + match.length));
  }

  function toggleListening() {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setBody((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  const insertPrompt = useCallback(async () => {
    if (promptLoading) return;
    setPromptLoading(true);
    try {
      // Try the AI-backed endpoint first; it transparently falls back to the
      // server's curated list when GROQ_API_KEY is not configured.
      const { prompt } = await getAiPrompt();
      setPromptPlaceholder(prompt);
    } catch {
      // Last-resort fallback to the bundled static list, so the button never feels broken.
      let idx: number;
      do {
        idx = Math.floor(Math.random() * JOURNAL_PROMPTS.length);
      } while (idx === lastPromptRef.current && JOURNAL_PROMPTS.length > 1);
      lastPromptRef.current = idx;
      setPromptPlaceholder(JOURNAL_PROMPTS[idx]);
    } finally {
      setPromptLoading(false);
    }
  }, [promptLoading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "var(--overlay-bg)" }}
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-[640px] rounded-[24px] p-[32px] md:p-[40px] flex flex-col gap-[24px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[6px] flex">
          <div className="flex-1 bg-[#f9b2d7]" />
          <div className="flex-1 bg-[#b2def9]" />
          <div className="flex-1 bg-[#b2f9c8]" />
          <div className="flex-1 bg-[#f9f0b2]" />
        </div>

        <h2
          className="font-semibold text-[24px] md:text-[28px] tracking-tight m-0"
          style={{ color: "var(--heading-color)" }}
        >
          {mode === "edit" ? "Edit entry" : "New journal entry"}
        </h2>

        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={promptPlaceholder}
            rows={10}
            autoFocus
            className="w-full rounded-2xl focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none p-[16px] pr-[48px] text-[16px] resize-none transition-all"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--body-color)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#b2def9";
              e.target.style.backgroundColor = "var(--input-focus-bg)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border-color)";
              e.target.style.backgroundColor = "var(--input-bg)";
            }}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {mode === "create" && (
              <button
                type="button"
                onClick={insertPrompt}
                disabled={promptLoading}
                className={`w-[36px] h-[36px] rounded-full border-none flex items-center justify-center transition-all ${promptLoading ? "opacity-60 animate-pulse cursor-wait" : "cursor-pointer hover:opacity-80"}`}
                style={{ backgroundColor: "var(--border-color)" }}
                title={promptLoading ? "Asking AI…" : "Suggest a writing prompt (AI)"}
                aria-label="Suggest a writing prompt"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" stroke="var(--secondary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {SpeechRecognition && (
              <button
                type="button"
                onClick={toggleListening}
                className={`w-[36px] h-[36px] rounded-full border-none cursor-pointer flex items-center justify-center transition-all ${listening ? "bg-[#f9b2d7] animate-pulse" : "hover:opacity-80"}`}
                style={!listening ? { backgroundColor: "var(--border-color)" } : undefined}
                title={listening ? "Stop recording" : "Speak to type"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill={listening ? "#fff" : "var(--secondary-color)"} />
                  <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke={listening ? "#fff" : "var(--secondary-color)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 19V23" stroke={listening ? "#fff" : "var(--secondary-color)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 23H16" stroke={listening ? "#fff" : "var(--secondary-color)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Grammar / spelling suggestions (LanguageTool, free public API). */}
        {(grammarLoading || grammarMatches.length > 0) && (
          <div
            className="rounded-2xl px-[16px] py-[12px] flex flex-col gap-[8px] max-h-[160px] overflow-auto"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
            }}
            aria-live="polite"
          >
            {grammarLoading && grammarMatches.length === 0 ? (
              <p className="text-[13px] m-0" style={{ color: "var(--muted-color)" }}>
                Checking grammar…
              </p>
            ) : (
              <>
                <p className="text-[13px] font-medium m-0" style={{ color: "var(--secondary-color)" }}>
                  {grammarMatches.length} suggestion{grammarMatches.length === 1 ? "" : "s"}
                </p>
                {grammarMatches.slice(0, 5).map((m, i) => {
                  const original = body.slice(m.offset, m.offset + m.length);
                  const dotColor =
                    m.category === "spelling"
                      ? "#f9b2d7"
                      : m.category === "grammar"
                        ? "#b2def9"
                        : m.category === "style"
                          ? "#f9f0b2"
                          : "#b2f9c8";
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-[8px] text-[13px]">
                      <span
                        className="inline-block w-[8px] h-[8px] rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                        aria-hidden="true"
                      />
                      <span style={{ color: "var(--body-color)" }}>{m.message}</span>
                      <code
                        className="px-[6px] py-[2px] rounded text-[12px]"
                        style={{ backgroundColor: "var(--border-light)", color: "var(--secondary-color)" }}
                      >
                        {original}
                      </code>
                      {m.replacements.length > 0 && (
                        <span className="flex items-center gap-[4px]">
                          <span style={{ color: "var(--muted-color)" }}>→</span>
                          {m.replacements.map((rep, j) => (
                            <button
                              key={j}
                              type="button"
                              onClick={() => applyReplacement(m, rep)}
                              className="px-[8px] py-[2px] rounded-full text-[12px] cursor-pointer border-none transition-all hover:opacity-80"
                              style={{ backgroundColor: dotColor, color: "#1a1a1a" }}
                              title={`Replace "${original}" with "${rep}"`}
                            >
                              {rep}
                            </button>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        <p className="text-[13px] text-right m-0" style={{ color: "var(--muted-color)" }}>
          {body.trim() ? body.trim().split(/\s+/).length : 0} {body.trim().split(/\s+/).length === 1 && body.trim() ? "word" : "words"}
        </p>

        <div className="flex items-center justify-end gap-[12px]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            style={{ color: "var(--secondary-color)" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onSave(body)}
            disabled={saving || !body.trim()}
            className="px-[32px] h-[48px]"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  id: number | null;
  body: string;
}

function JournalsContent() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "create", id: null, body: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Journal | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getJournals();
      data.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setJournals(data);
    } catch {
      toast.error("Could not load journal entries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function openCreate() {
    setModal({ open: true, mode: "create", id: null, body: "" });
  }

  function openEdit(entry: Journal) {
    setModal({ open: true, mode: "edit", id: entry.id, body: entry.body });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }

  async function handleSave(body: string) {
    const isEdit = modal.mode === "edit";
    setSaving(true);
    try {
      if (isEdit && modal.id !== null) {
        await updateJournal(modal.id, { body });
      } else {
        await createJournal({ body });
      }
      closeModal();
      await refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(isEdit ? "Entry updated" : "Entry saved");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(entry: Journal) {
    setDeleteTarget(entry);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteJournal(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
      toast.success("Entry deleted");
    } catch {
      toast.error("Could not delete entry.");
      setDeleteTarget(null);
    }
  }

  const filtered = search.trim()
    ? journals.filter((j) => j.body.toLowerCase().includes(search.toLowerCase()))
    : journals;

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader title="Mental Health Dashboard" />

      <main className="flex-1 w-full max-w-[1200px] mx-auto p-[32px] md:p-[64px] flex flex-col gap-[32px] md:gap-[48px]">
        <div className="flex w-full items-center justify-between gap-4 flex-wrap">
          <h1
            className="font-semibold text-[32px] md:text-[48px] tracking-tight m-0"
            style={{ color: "var(--heading-color)" }}
          >
            My Journal Entries
          </h1>
          <Button variant="pink" onClick={openCreate}>
            + New Entry
          </Button>
        </div>

        <div
          className="w-full h-[64px] rounded-[20px] shadow-sm flex items-center px-[24px] gap-[16px] transition-all"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="var(--muted-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21L16.65 16.65" stroke="var(--muted-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries"
            className="flex-1 h-full bg-transparent text-[18px] focus:outline-none border-none"
            style={{ color: "var(--body-color)" }}
          />
        </div>

        {loading ? (
          <p className="text-center py-12" style={{ color: "var(--muted-color)" }}>Loading entries…</p>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 rounded-[24px]"
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-light)",
            }}
          >
            <p className="text-[18px] mb-4" style={{ color: "var(--secondary-color)" }}>
              {journals.length === 0
                ? "You haven't written any entries yet."
                : "No entries match your search."}
            </p>
            {journals.length === 0 && (
              <Button variant="default" onClick={openCreate}>
                Write your first entry
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] md:gap-[32px] w-full">
            {filtered.map((entry, idx) => {
              const stripe = STRIPE_COLORS[idx % STRIPE_COLORS.length];
              return (
                <div
                  key={entry.id}
                  className="group flex flex-col gap-[20px] rounded-[24px] p-[32px] md:p-[40px] shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-light)",
                  }}
                  onClick={() => openEdit(entry)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-[6px]"
                    style={{ backgroundColor: stripe }}
                  />
                  <div className="flex flex-col gap-[8px]">
                    <span className="font-medium text-[16px]" style={{ color: "var(--muted-color)" }}>
                      {formatDate(entry.created_at)}
                    </span>
                    <p
                      className="font-medium text-[20px] md:text-[24px] leading-snug m-0 line-clamp-3"
                      style={{ color: "var(--body-color)" }}
                    >
                      {previewOf(entry.body)}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-[16px] mt-auto pt-[24px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderTop: "1px solid var(--border-light)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="font-medium text-[16px] text-[#b2def9] hover:text-[#7bbce8] bg-transparent border-none cursor-pointer p-0"
                    >
                      Edit
                    </button>
                    <span style={{ color: "var(--chart-label)" }}>|</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="font-medium text-[16px] text-[#f9b2d7] hover:text-[#e88ebf] bg-transparent border-none cursor-pointer p-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <JournalModal
        open={modal.open}
        mode={modal.mode}
        initialBody={modal.body}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function JournalsPage() {
  return (
    <ProtectedRoute>
      <JournalsContent />
    </ProtectedRoute>
  );
}
