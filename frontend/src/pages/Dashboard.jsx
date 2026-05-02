import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { getJournals, getQuestionnaires } from '../services/api';

const STRIPE_COLORS = ['#f9b2d7', '#b2def9', '#b2f9c8', '#f9f0b2'];
const PERIODS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const METRIC_CHARTS = [
  { field: 'mood',       label: 'Mood',       color: '#b2f9c8', gradientId: 'moodGrad',       emptyMsg: 'No mood data yet.' },
  { field: 'depression', label: 'Depression',  color: '#f9b2d7', gradientId: 'depressionGrad', emptyMsg: 'No depression data yet.' },
  { field: 'anxiety',    label: 'Anxiety',     color: '#f9f0b2', gradientId: 'anxietyGrad',    emptyMsg: 'No anxiety data yet.' },
];

// ──────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────

function toLocalDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function formatRange(start, end, period) {
  if (period === 'year') {
    const opts = { month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const startOpts = { month: 'long', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) };
  const endOpts = { month: 'long', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', startOpts)} – ${end.toLocaleDateString('en-US', endOpts)}`;
}

// ──────────────────────────────────────────────────────────
// Chart data builders — field: 'mood' | 'depression' | 'anxiety'
// ──────────────────────────────────────────────────────────

function buildWeekChart(questionnaires, field) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = daysAgo(6);
  const byDate = new Map();
  for (const q of questionnaires) byDate.set(q.created_at, q[field]);
  const data = [];
  const ticks = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toISODate(d);
    data.push({ score: byDate.has(key) ? byDate.get(key) : null });
    ticks.push({
      index: i,
      primary: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      secondary: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return { data, ticks, startDate: start, endDate: today };
}

function buildMonthChart(questionnaires, field) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = daysAgo(29);
  const byDate = new Map();
  for (const q of questionnaires) byDate.set(q.created_at, q[field]);
  const data = [];
  const ticks = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toISODate(d);
    data.push({ score: byDate.has(key) ? byDate.get(key) : null });
    if (i % 5 === 0 || i === 29) {
      ticks.push({
        index: i,
        primary: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        secondary: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
  }
  return { data, ticks, startDate: start, endDate: today };
}

function buildYearChart(questionnaires, field) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstMonth = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -11);
  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
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
  const data = [];
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = addMonths(firstMonth, i);
    data.push({ score: counts[i] > 0 ? sums[i] / counts[i] : null });
    ticks.push({
      index: i,
      primary: monthStart.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      secondary: `'${String(monthStart.getFullYear()).slice(-2)}`,
    });
  }
  const endDate = addMonths(firstMonth, 11);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  return { data, ticks, startDate: firstMonth, endDate };
}

function buildChartForPeriod(period, questionnaires, field) {
  if (period === 'month') return buildMonthChart(questionnaires, field);
  if (period === 'year') return buildYearChart(questionnaires, field);
  return buildWeekChart(questionnaires, field);
}

// ──────────────────────────────────────────────────────────
// Chart component
// ──────────────────────────────────────────────────────────

function MoodChart({ data, ticks, accentColor = '#b2def9', gradientId = 'moodGradient', emptyMessage = 'No data for this period.' }) {
  const n = data.length;
  const leftPad = 3;
  const rightPad = 3;
  const xAt = (i) => {
    if (n === 1) return 50;
    return leftPad + (i / (n - 1)) * (100 - leftPad - rightPad);
  };
  const yAt = (score) => 100 - (score / 10) * 100;

  const points = data.map((d, i) =>
    d.score === null || d.score === undefined
      ? null
      : { i, x: xAt(i), y: yAt(d.score) }
  );
  const presentPoints = points.filter(Boolean);
  const linePath = presentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath =
    presentPoints.length > 0
      ? [
          presentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '),
          `L${presentPoints[presentPoints.length - 1].x},100`,
          `L${presentPoints[0].x},100 Z`,
        ].join(' ')
      : '';
  const hasData = presentPoints.length > 0;

  return (
    <div className="flex-1 relative w-full min-h-[200px]">
      {/* Gridlines + Y-axis labels */}
      <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-16 pl-2 pr-8">
        {[10, 8, 6, 4, 2, 0].map((val) => (
          <div key={val} className="w-full flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="w-4 text-right text-[11px] font-bold text-gray-300">{val}</span>
          </div>
        ))}
      </div>

      {/* Chart body */}
      <div className="absolute inset-0 pt-2 pb-16 pl-2 pr-8">
        {hasData ? (
          <div className="relative w-full h-full">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
                  className="absolute w-2.5 h-2.5 rounded-full bg-white border-[2.5px] shadow-sm"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    borderColor: accentColor,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${data[p.i].score.toFixed(1)}`}
                />
              ) : null
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[#aaa] text-center text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* X-axis tick labels */}
      <div className="absolute bottom-0 left-0 right-8 h-14">
        {ticks.map((tick) => (
          <div
            key={tick.index}
            className="absolute flex items-start justify-center gap-0.5"
            style={{ left: `${xAt(tick.index)}%`, transform: 'translateX(-50%)' }}
          >
            <span
              className="text-[9px] font-bold text-gray-500 whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {tick.primary}
            </span>
            <span
              className="text-[10px] font-medium text-gray-400 whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
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
// Positivity-score chart data builders (journal sentiment)
// ──────────────────────────────────────────────────────────

function buildPositivityWeek(journals) {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = daysAgo(6);
  const byDate = new Map();
  for (const j of journals) {
    if (j.sentiment_score == null) continue;
    const key = j.created_at;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(j.sentiment_score);
  }
  const data = []; const ticks = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = toISODate(d);
    const scores = byDate.get(key);
    data.push({ score: scores ? scores.reduce((a,b)=>a+b,0)/scores.length : null });
    ticks.push({ index: i, primary: d.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase(), secondary: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) });
  }
  return { data, ticks, startDate: start, endDate: today };
}

function buildPositivityMonth(journals) {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = daysAgo(29);
  const byDate = new Map();
  for (const j of journals) {
    if (j.sentiment_score == null) continue;
    const key = j.created_at;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(j.sentiment_score);
  }
  const data = []; const ticks = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = toISODate(d);
    const scores = byDate.get(key);
    data.push({ score: scores ? scores.reduce((a,b)=>a+b,0)/scores.length : null });
    if (i % 5 === 0 || i === 29) {
      ticks.push({ index: i, primary: d.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase(), secondary: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) });
    }
  }
  return { data, ticks, startDate: start, endDate: today };
}

function buildPositivityYear(journals) {
  const today = new Date(); today.setHours(0,0,0,0);
  const firstMonth = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -11);
  const sums = new Array(12).fill(0); const counts = new Array(12).fill(0);
  for (const j of journals) {
    if (j.sentiment_score == null) continue;
    const d = toLocalDate(j.created_at);
    const diff = (d.getFullYear()-firstMonth.getFullYear())*12+(d.getMonth()-firstMonth.getMonth());
    if (diff >= 0 && diff < 12) { sums[diff] += j.sentiment_score; counts[diff]++; }
  }
  const data = []; const ticks = [];
  for (let i = 0; i < 12; i++) {
    const ms = addMonths(firstMonth, i);
    data.push({ score: counts[i] > 0 ? sums[i]/counts[i] : null });
    ticks.push({ index: i, primary: ms.toLocaleDateString('en-US',{month:'short'}).toUpperCase(), secondary: `'${String(ms.getFullYear()).slice(-2)}` });
  }
  const endDate = addMonths(firstMonth, 11); endDate.setMonth(endDate.getMonth()+1); endDate.setDate(0);
  return { data, ticks, startDate: firstMonth, endDate };
}

function buildPositivityChart(period, journals) {
  if (period === 'month') return buildPositivityMonth(journals);
  if (period === 'year') return buildPositivityYear(journals);
  return buildPositivityWeek(journals);
}

// ──────────────────────────────────────────────────────────
// Recent journals helpers
// ──────────────────────────────────────────────────────────

function formatJournalDate(dateString) {
  return toLocalDate(dateString).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function previewOf(body) {
  const firstLine = (body || '').split('\n')[0].trim();
  return firstLine.length > 50 ? firstLine.slice(0, 50) + '…' : firstLine || '(empty)';
}

// ──────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week');
  const [questionnaires, setQuestionnaires] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [error, setError] = useState('');
  const [positivityPeriod, setPositivityPeriod] = useState('week');

  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start;
    if (period === 'year') {
      start = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -11);
    } else if (period === 'month') {
      start = daysAgo(29);
    } else {
      start = daysAgo(6);
    }
    getQuestionnaires({ fromDate: toISODate(start), toDate: toISODate(today) })
      .then((qs) => { if (!cancelled) setQuestionnaires(qs); })
      .catch(() => { if (!cancelled) setError('Could not load mood data.'); })
      .finally(() => { if (!cancelled) setLoadingChart(false); });
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
      .catch(() => { if (!cancelled) setError('Could not load journal entries.'); })
      .finally(() => { if (!cancelled) setLoadingJournals(false); });
    return () => { cancelled = true; };
  }, []);

  const metricCharts = useMemo(
    () => METRIC_CHARTS.map((m) => ({ ...m, chart: buildChartForPeriod(period, questionnaires, m.field) })),
    [period, questionnaires]
  );

  const rangeLabel = useMemo(
    () => formatRange(metricCharts[0].chart.startDate, metricCharts[0].chart.endDate, period),
    [metricCharts, period]
  );

  const positivityChart = useMemo(() => buildPositivityChart(positivityPeriod, journals), [positivityPeriod, journals]);
  const positivityRangeLabel = useMemo(
    () => formatRange(positivityChart.startDate, positivityChart.endDate, positivityPeriod),
    [positivityChart, positivityPeriod]
  );

  const recentJournals = journals.slice(0, 3);
  const displayName = user?.username || 'there';

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-[#Fafbfb]">
      <AppHeader logout />

      <main className="flex-1 w-full p-[24px] md:p-[64px] flex flex-col gap-[32px] md:gap-[48px]">
        {/* Welcome + log mood */}
        <div className="flex w-full items-center justify-between gap-6 flex-wrap">
          <h1 className="font-semibold text-[32px] md:text-[44px] text-[#222] tracking-tight m-0">
            Welcome back, <span className="text-[#b2def9]">{displayName}</span>!
          </h1>
          <div className="flex items-center gap-[16px] md:gap-[24px] bg-white border border-gray-100 rounded-[24px] px-[24px] md:px-[32px] py-[16px] md:py-[20px] shadow-sm">
            <p className="font-normal text-[16px] md:text-[18px] text-[#555] m-0">
              How are you feeling today?
            </p>
            <button
              type="button"
              onClick={() => navigate('/questionnaire')}
              className="bg-[#b2def9] rounded-[16px] shadow-[0px_4px_16px_rgba(178,222,249,0.4)] flex items-center justify-center px-[24px] h-[48px] hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              <span className="font-semibold text-[15px] text-white tracking-wide">Log your mood</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        {/* 3 metric charts */}
        <div className="flex flex-col gap-[20px]">
          {/* shared header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-[20px] md:text-[24px] text-[#333] tracking-tight m-0">
              Mental Health Metrics
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-[12px] p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`px-[14px] py-[6px] rounded-[8px] font-medium text-[13px] transition-colors border-none cursor-pointer ${
                      period === p.id ? 'bg-white text-[#333] shadow-sm' : 'bg-transparent text-[#888] hover:text-[#333]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center bg-gray-50 px-[16px] py-[8px] rounded-[12px] border border-gray-100">
                <span className="font-medium text-[13px] text-[#555] whitespace-nowrap">{rangeLabel}</span>
              </div>
            </div>
          </div>

          {/* chart grid */}
          <div className="grid grid-cols-1 gap-[20px]">
            {metricCharts.map(({ field, label, color, gradientId, emptyMsg, chart }) => (
              <div
                key={field}
                className="bg-white border border-gray-100 rounded-[24px] p-[20px] md:p-[28px] shadow-sm flex flex-col gap-[12px] min-h-[280px]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-[16px] text-[#333]">{label}</span>
                </div>
                {loadingChart ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[#aaa] text-sm">Loading…</p>
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
              </div>
            ))}
          </div>
        </div>

        {/* Recent journals + positivity chart */}
        <div className="flex flex-col lg:flex-row items-stretch gap-[32px] md:gap-[40px] w-full">
          {/* Recent journal entries */}
          <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[32px] p-[28px] md:p-[40px] shadow-sm">
            <h2 className="font-semibold text-[20px] md:text-[22px] text-[#333] tracking-tight mb-[24px] md:mb-[32px]">
              Recent Entries
            </h2>
            <div className="flex-1 flex flex-col gap-[16px]">
              {loadingJournals ? (
                <p className="text-[#888]">Loading…</p>
              ) : recentJournals.length === 0 ? (
                <p className="text-[#888] text-[14px]">No entries yet. Start writing to see them here.</p>
              ) : (
                recentJournals.map((entry, i) => (
                  <Link
                    key={entry.id}
                    to="/journals"
                    className="w-full flex flex-col gap-[6px] p-[20px] rounded-[20px] bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer no-underline"
                  >
                    <div className="flex items-center gap-[10px] w-full overflow-hidden">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STRIPE_COLORS[i % STRIPE_COLORS.length] }} />
                      <p className="font-medium text-[15px] text-[#555] truncate w-full m-0">{previewOf(entry.body)}</p>
                    </div>
                    <p className="font-bold text-[11px] text-gray-300 uppercase tracking-tight ml-[20px] m-0">
                      {formatJournalDate(entry.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </div>
            <div className="flex items-center gap-[32px] mt-[24px] md:mt-[32px] pt-[16px]">
              <Link
                to="/journals"
                className="font-bold text-[14px] text-[#888] hover:text-[#111] transition-colors uppercase tracking-widest border-b-2 border-[#b2f9c8] pb-1 no-underline"
              >
                View All Journals
              </Link>
            </div>
          </div>

          {/* Positivity score chart */}
          <div className="flex-[2] flex flex-col">
            <div className="relative w-full min-h-[360px] bg-white border border-gray-100 rounded-[32px] p-[24px] md:p-[40px] shadow-sm flex flex-col gap-[16px] md:gap-[24px]">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="font-semibold text-[20px] md:text-[24px] text-[#333] tracking-tight">
                  Journal Positivity Score
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-[12px] p-1">
                    {PERIODS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPositivityPeriod(p.id)}
                        className={`px-[14px] py-[6px] rounded-[8px] font-medium text-[13px] transition-colors border-none cursor-pointer ${
                          positivityPeriod === p.id ? 'bg-white text-[#333] shadow-sm' : 'bg-transparent text-[#888] hover:text-[#333]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center bg-gray-50 px-[16px] py-[8px] rounded-[12px] border border-gray-100">
                    <span className="font-medium text-[13px] text-[#555] whitespace-nowrap">{positivityRangeLabel}</span>
                  </div>
                </div>
              </div>
              {loadingJournals ? (
                <p className="text-[#888] text-center flex-1 flex items-center justify-center">Loading…</p>
              ) : (
                <MoodChart
                  data={positivityChart.data}
                  ticks={positivityChart.ticks}
                  accentColor="#b2f9c8"
                  gradientId="positivityGradient"
                  emptyMessage="No journal entries for this period — write a journal to start tracking positivity."
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
