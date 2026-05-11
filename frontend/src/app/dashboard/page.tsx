"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useAuth, ProtectedRoute } from "@/contexts/AuthContext";
import { getAiMoodSuggestions, getJournals, getQuestionnaires } from "@/services/api";
import type { Journal, MoodSuggestionsResponse, Questionnaire } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STRIPE_COLORS = ["#f9b2d7", "#b2def9", "#b2f9c8", "#f9f0b2"];

type PeriodId = "week" | "month" | "year";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

type MetricField = "mood" | "depression" | "anxiety";

interface MetricChartConfig {
  field: MetricField;
  label: string;
  color: string;
  gradientId: string;
  emptyMsg: string;
}

const METRIC_CHARTS: MetricChartConfig[] = [
  { field: "mood",       label: "Mood",       color: "#b2f9c8", gradientId: "moodGrad",       emptyMsg: "No mood data yet." },
  { field: "depression", label: "Depression",  color: "#f9b2d7", gradientId: "depressionGrad", emptyMsg: "No depression data yet." },
  { field: "anxiety",    label: "Anxiety",     color: "#f9f0b2", gradientId: "anxietyGrad",    emptyMsg: "No anxiety data yet." },
];

// ──────────────────────────────────────────────────────────
// Mood suggestions
// ──────────────────────────────────────────────────────────

function getMoodSuggestions(score: number): MoodSuggestionsResponse {
  if (score >= 70) {
    return {
      heading: "You're doing great! Keep it up 🌟",
      color: "#b2f9c8",
      source: "fallback",
      suggestions: [
        { emoji: "📓", title: "Journal your wins", body: "Write down what's going well — it reinforces positive patterns." },
        { emoji: "🧘", title: "Keep your routine", body: "Consistency is key. Maintain the habits that are working for you." },
        { emoji: "🤝", title: "Support someone else", body: "Reach out to a friend or family member who might need a boost." },
      ],
    };
  }
  if (score >= 40) {
    return {
      heading: "You're managing — here are some tips 💙",
      color: "#b2def9",
      source: "fallback",
      suggestions: [
        { emoji: "🚶", title: "Take a short walk", body: "Even 10 minutes outside can lift your mood significantly." },
        { emoji: "💧", title: "Stay hydrated", body: "Dehydration affects mood more than most people realize." },
        { emoji: "📓", title: "Write it out", body: "Journaling your thoughts can help you process what you're feeling." },
        { emoji: "😴", title: "Prioritize sleep", body: "Aim for 7–8 hours tonight — sleep has a huge impact on mood." },
      ],
    };
  }
  return {
    heading: "It's okay to have hard days — you're not alone 💗",
    color: "#f9b2d7",
    source: "fallback",
    suggestions: [
      { emoji: "🫁", title: "Try box breathing", body: "Inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times." },
      { emoji: "📞", title: "Reach out to someone", body: "Talk to a friend, family member, or counselor about how you feel." },
      { emoji: "🛁", title: "Do one small kind thing for yourself", body: "A warm shower, your favourite meal, or a short rest." },
      { emoji: "🏥", title: "Consider professional support", body: "If low scores persist, speaking to a mental health professional can really help." },
    ],
  };
}

function MoodSuggestionsCard({ score }: { score: number }) {
  const fallback = getMoodSuggestions(score);
  const [data, setData] = useState<MoodSuggestionsResponse>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAiMoodSuggestions()
      .then((res) => {
        if (!cancelled && res.suggestions.length > 0) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className="rounded-[24px] px-[28px] py-[24px]" style={{ borderColor: data.color }}>
      <p className="font-semibold text-[16px] md:text-[18px] mb-4" style={{ color: data.color }}>
        {loading ? "Getting personalised suggestions..." : data.heading}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.suggestions.map((s) => (
          <div
            key={s.title}
            className="flex gap-3 rounded-xl p-4"
            style={{ backgroundColor: "var(--page-bg)" }}
          >
            <span className="text-[24px] shrink-0">{s.emoji}</span>
            <div>
              <p className="font-semibold text-[14px] mb-1" style={{ color: "var(--heading-color)" }}>{s.title}</p>
              <p className="text-[13px]" style={{ color: "var(--secondary-color)" }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// Chart data types
// ──────────────────────────────────────────────────────────

interface ChartDataPoint {
  score: number | null;
}

interface ChartTick {
  index: number;
  primary: string;
  secondary: string;
}

interface ChartData {
  data: ChartDataPoint[];
  ticks: ChartTick[];
  startDate: Date;
  endDate: Date;
}

// ──────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────

function toLocalDate(dateString: string): Date {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function formatRange(start: Date, end: Date, period: PeriodId): string {
  if (period === "year") {
    const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
    return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const startOpts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) };
  const endOpts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString("en-US", startOpts)} – ${end.toLocaleDateString("en-US", endOpts)}`;
}

// ──────────────────────────────────────────────────────────
// Chart data builders
// ──────────────────────────────────────────────────────────

function buildWeekChart(questionnaires: Questionnaire[], field: MetricField): ChartData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = daysAgo(6);
  const byDate = new Map<string, number>();
  for (const q of questionnaires) byDate.set(q.created_at, q[field]);

  const data: ChartDataPoint[] = [];
  const ticks: ChartTick[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toISODate(d);
    data.push({ score: byDate.has(key) ? byDate.get(key)! : null });
    ticks.push({
      index: i,
      primary: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      secondary: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return { data, ticks, startDate: start, endDate: today };
}

function buildMonthChart(questionnaires: Questionnaire[], field: MetricField): ChartData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = daysAgo(29);
  const byDate = new Map<string, number>();
  for (const q of questionnaires) byDate.set(q.created_at, q[field]);

  const data: ChartDataPoint[] = [];
  const ticks: ChartTick[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toISODate(d);
    data.push({ score: byDate.has(key) ? byDate.get(key)! : null });
    if (i % 5 === 0 || i === 29) {
      ticks.push({
        index: i,
        primary: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        secondary: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
  }
  return { data, ticks, startDate: start, endDate: today };
}

function buildYearChart(questionnaires: Questionnaire[], field: MetricField): ChartData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstMonth = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -11);

  const sums = new Array<number>(12).fill(0);
  const counts = new Array<number>(12).fill(0);
  for (const q of questionnaires) {
    const qDate = toLocalDate(q.created_at);
    const monthDiff =
      (qDate.getFullYear() - firstMonth.getFullYear()) * 12 +
      (qDate.getMonth() - firstMonth.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      sums[monthDiff] += q[field];
      counts[monthDiff] += 1;
    }
  }

  const data: ChartDataPoint[] = [];
  const ticks: ChartTick[] = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = addMonths(firstMonth, i);
    data.push({ score: counts[i] > 0 ? sums[i] / counts[i] : null });
    ticks.push({
      index: i,
      primary: monthStart.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      secondary: `'${String(monthStart.getFullYear()).slice(-2)}`,
    });
  }

  const endDate = addMonths(firstMonth, 11);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  return { data, ticks, startDate: firstMonth, endDate };
}

function buildChartForPeriod(period: PeriodId, questionnaires: Questionnaire[], field: MetricField): ChartData {
  if (period === "month") return buildMonthChart(questionnaires, field);
  if (period === "year") return buildYearChart(questionnaires, field);
  return buildWeekChart(questionnaires, field);
}

// ──────────────────────────────────────────────────────────
// Line chart component
// ──────────────────────────────────────────────────────────

interface ChartPoint {
  i: number;
  x: number;
  y: number;
  color: string;
}

interface MoodChartProps {
  data: ChartDataPoint[];
  ticks: ChartTick[];
  accentColor?: string;
  gradientId?: string;
  emptyMessage?: string;
}

function MoodChart({ data, ticks, accentColor = "#b2def9", gradientId = "moodGradient", emptyMessage }: MoodChartProps) {
  const n = data.length;
  const leftPad = 3;
  const rightPad = 3;
  const xAt = (i: number): number => {
    if (n === 1) return 50;
    return leftPad + (i / (n - 1)) * (100 - leftPad - rightPad);
  };
  const yAt = (score: number): number => 100 - (score / 10) * 100;

  const points = data.map((d, i) =>
    d.score === null || d.score === undefined
      ? null
      : { i, x: xAt(i), y: yAt(d.score), color: accentColor }
  );

  const presentPoints = points.filter((p): p is ChartPoint => p !== null);
  const linePath = presentPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  const areaPath =
    presentPoints.length > 0
      ? [
          presentPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" "),
          `L${presentPoints[presentPoints.length - 1].x},100`,
          `L${presentPoints[0].x},100 Z`,
        ].join(" ")
      : "";

  const hasData = points.some((p) => p !== null);

  return (
    <div className="flex-1 relative w-full min-h-[220px]">
      <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-14 pl-2 pr-10">
        {[10, 8, 6, 4, 2, 0].map((val) => (
          <div key={val} className="w-full flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--grid-line)" }} />
            <span
              className="w-6 text-right text-[12px] font-bold"
              style={{ color: "var(--chart-label)" }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 pt-2 pb-14 pl-2 pr-10">
        {hasData ? (
          <div className="relative w-full h-full">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path
                d={linePath}
                stroke={accentColor}
                strokeWidth="0.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ strokeWidth: 3 }}
              />
            </svg>
            {points.map((p) =>
              p ? (
                <div
                  key={p.i}
                  className="absolute w-3 h-3 rounded-full shadow-sm"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    borderColor: p.color,
                    borderWidth: "3px",
                    borderStyle: "solid",
                    backgroundColor: "var(--card-bg)",
                    transform: "translate(-50%, -50%)",
                  }}
                  title={`Score: ${data[p.i].score!.toFixed(1)}`}
                />
              ) : null
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p style={{ color: "var(--placeholder-color)" }} className="text-center">
              {emptyMessage || "No data for this period."}
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-10 h-12">
        {ticks.map((tick) => (
          <div
            key={tick.index}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${xAt(tick.index)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span
              className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
              style={{ color: "var(--chart-label)" }}
            >
              {tick.primary}
            </span>
            <span
              className="text-[12px] font-medium whitespace-nowrap"
              style={{ color: "var(--muted-color)" }}
            >
              {tick.secondary}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Recent journals helpers
// ──────────────────────────────────────────────────────────

function formatJournalDate(dateString: string): string {
  return toLocalDate(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function previewOf(body: string): string {
  const firstLine = (body || "").split("\n")[0].trim();
  return firstLine.length > 50 ? firstLine.slice(0, 50) + "…" : firstLine || "(empty)";
}

// ──────────────────────────────────────────────────────────
// Period toggle
// ──────────────────────────────────────────────────────────

interface PeriodToggleProps {
  value: PeriodId;
  onChange: (value: PeriodId) => void;
}

function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div
      className="flex items-center rounded-[12px] p-1"
      style={{
        backgroundColor: "var(--input-bg)",
        border: "1px solid var(--border-light)",
      }}
    >
      {PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className="px-[14px] py-[6px] rounded-[8px] font-medium text-[13px] transition-colors border-none cursor-pointer"
          style={{
            backgroundColor: value === p.id ? "var(--card-bg)" : "transparent",
            color: value === p.id ? "var(--body-color)" : "var(--muted-color)",
            boxShadow: value === p.id ? "var(--shadow-sm)" : "none",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodId>("week");
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start: Date;
    if (period === "year") {
      start = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -11);
    } else if (period === "month") {
      start = daysAgo(29);
    } else {
      start = daysAgo(6);
    }

    getQuestionnaires({ fromDate: toISODate(start), toDate: toISODate(today) })
      .then((qs) => {
        if (!cancelled) setQuestionnaires(qs);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load mood data.");
      })
      .finally(() => {
        if (!cancelled) setLoadingChart(false);
      });

    return () => { cancelled = true; };
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    getJournals()
      .then((js) => {
        if (cancelled) return;
        js.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        setJournals(js);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load journal entries.");
      })
      .finally(() => {
        if (!cancelled) setLoadingJournals(false);
      });
    return () => { cancelled = true; };
  }, []);

  const metricCharts = useMemo(
    () => METRIC_CHARTS.map((m) => ({ ...m, chart: buildChartForPeriod(period, questionnaires, m.field) })),
    [period, questionnaires]
  );

  const rangeLabel = useMemo(
    () => metricCharts[0] ? formatRange(metricCharts[0].chart.startDate, metricCharts[0].chart.endDate, period) : "",
    [metricCharts, period]
  );

  const recentJournals = journals.slice(0, 3);
  const displayName = user?.username || "there";
  const todayScore = useMemo(() => {
    const todayKey = toISODate(new Date());
    // questionnaires are fetched for the current period; find today's entry
    const todayEntry = questionnaires.find((q) => q.created_at === todayKey);
    return todayEntry?.score ?? null;
  }, [questionnaires]);


  const [isReturning] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = `visited_${localStorage.getItem("access_token")}`;
    const seen = localStorage.getItem(key) === "true";
    if (!seen) localStorage.setItem(key, "true");
    return seen;
  });

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader />

      <main className="flex-1 w-full p-[24px] md:p-[64px] flex flex-col gap-[32px] md:gap-[48px]">
        {/* Welcome + log mood */}
        <div className="flex w-full items-center justify-between gap-6 flex-wrap">
          <h1
            className="font-semibold text-[32px] md:text-[44px] tracking-tight m-0"
            style={{ color: "var(--heading-color)" }}
          >
            {isReturning ? "Welcome back, " : "Welcome, "}<span className="text-[#b2def9]">{displayName}</span>!
          </h1>

          <Card className="flex items-center gap-[16px] md:gap-[24px] rounded-[24px] px-[24px] md:px-[32px] py-[16px] md:py-[20px]">
            <p className="font-normal text-[16px] md:text-[18px] m-0" style={{ color: "var(--secondary-color)" }}>
              How are you feeling today?
            </p>
            <Button size="sm" onClick={() => router.push("/questionnaire")}>
              Log your mood
            </Button>
          </Card>
        </div>
        {/* Mood suggestions */}
        {todayScore !== null && <MoodSuggestionsCard score={todayScore} />}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)" }}
          >
            {error}
          </div>
        )}
                {/* Today's score card */}
        <Card className="flex items-center gap-[24px] rounded-[24px] px-[28px] py-[20px] flex-wrap">
          <div className="flex flex-col gap-[4px] flex-1 min-w-[120px]">
            <span
              className="font-semibold text-[13px] uppercase tracking-widest"
              style={{ color: "var(--muted-color)" }}
            >
              Today&apos;s Score
            </span>
            {loadingChart ? (
              <span className="text-[36px] font-bold" style={{ color: "var(--muted-color)" }}>—</span>
            ) : todayScore !== null ? (
              <span className="text-[36px] font-bold leading-none" style={{ color: "var(--heading-color)" }}>
                {todayScore.toFixed(1)}
                <span className="text-[18px] font-medium ml-1" style={{ color: "var(--muted-color)" }}>/100</span>
              </span>
            ) : (
              <span className="text-[36px] font-bold" style={{ color: "var(--placeholder-color)" }}>—</span>
            )}
            <span className="text-[13px]" style={{ color: "var(--secondary-color)" }}>
              {todayScore !== null
                ? todayScore >= 70
                  ? "You're doing great today 🌟"
                  : todayScore >= 40
                  ? "Hang in there, you've got this 💙"
                  : "Tough day — be kind to yourself 🌿"
                : "Log your mood to see your score"}
            </span>
          </div>

          {/* Score ring */}
          {todayScore !== null && (
            <div className="relative shrink-0 w-[80px] h-[80px]">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--grid-line)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke={todayScore >= 70 ? "#b2f9c8" : todayScore >= 40 ? "#b2def9" : "#f9b2d7"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(todayScore / 100) * 201} 201`}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[15px] font-bold"
                style={{ color: "var(--heading-color)" }}
              >
                {Math.round(todayScore)}
              </span>
            </div>
          )}
        </Card>

        {/* 3 metric charts */}
        <div className="flex flex-col gap-[20px]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2
              className="font-semibold text-[20px] md:text-[24px] tracking-tight m-0"
              style={{ color: "var(--body-color)" }}
            >
              Mental Health Metrics
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <PeriodToggle value={period} onChange={setPeriod} />
              <div
                className="flex items-center gap-[12px] px-[16px] py-[8px] rounded-[12px]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <span
                  className="font-medium text-[13px] whitespace-nowrap"
                  style={{ color: "var(--secondary-color)" }}
                >
                  {rangeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[20px]">
            {metricCharts.map(({ field, label, color, gradientId, emptyMsg, chart }) => (
              <Card
                key={field}
                className="rounded-[24px] p-[20px] md:p-[28px] flex flex-col gap-[12px] min-h-[280px]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-[16px]" style={{ color: "var(--body-color)" }}>
                    {label}
                  </span>
                </div>
                {loadingChart ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p style={{ color: "var(--muted-color)" }} className="text-sm">Loading…</p>
                  </div>
                ) : (
                  <MoodChart
                    data={chart.data}
                    ticks={chart.ticks}
                    accentColor={color}
                    gradientId={gradientId}
                    emptyMessage={emptyMsg}
                  />
                )}
              </Card>
            ))}
          </div>
        </div>
        
        {/* Recent journal entries */}
        <Card className="flex flex-col p-[28px] md:p-[40px]">
          <h2
            className="font-semibold text-[20px] md:text-[22px] tracking-tight mb-[24px] md:mb-[32px]"
            style={{ color: "var(--body-color)" }}
          >
            Recent Entries
          </h2>

          <div className="flex-1 flex flex-col gap-[16px]">
            {loadingJournals ? (
              <p style={{ color: "var(--muted-color)" }}>Loading…</p>
            ) : recentJournals.length === 0 ? (
              <p className="text-[14px]" style={{ color: "var(--muted-color)" }}>
                No entries yet. Start writing to see them here.
              </p>
            ) : (
              recentJournals.map((entry, i) => (
                <Link
                  key={entry.id}
                  href="/journals"
                  className="w-full flex flex-col gap-[6px] p-[20px] rounded-[20px] transition-colors cursor-pointer no-underline"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border-light)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }}
                >
                  <div className="flex items-center gap-[10px] w-full overflow-hidden">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STRIPE_COLORS[i % STRIPE_COLORS.length] }}
                    />
                    <p
                      className="font-medium text-[15px] truncate w-full m-0"
                      style={{ color: "var(--secondary-color)" }}
                    >
                      {previewOf(entry.body)}
                    </p>
                  </div>
                  <p
                    className="font-bold text-[11px] uppercase tracking-tight ml-[20px] m-0"
                    style={{ color: "var(--chart-label)" }}
                  >
                    {formatJournalDate(entry.created_at)}
                  </p>
                </Link>
              ))
            )}
          </div>

          <div className="flex items-center gap-[32px] mt-[24px] md:mt-[32px] pt-[16px]">
            <Link
              href="/journals"
              className="font-bold text-[14px] uppercase tracking-widest border-b-2 border-[#b2f9c8] pb-1 no-underline transition-colors"
              style={{ color: "var(--muted-color)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--heading-color)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-color)")}
            >
              View All Journals
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
