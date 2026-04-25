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
// Chart data builders
// ──────────────────────────────────────────────────────────

function buildWeekChart(questionnaires) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = daysAgo(6);
  const byDate = new Map();
  for (const q of questionnaires) byDate.set(q.created_at, q.score);

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

function buildMonthChart(questionnaires) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = daysAgo(29);
  const byDate = new Map();
  for (const q of questionnaires) byDate.set(q.created_at, q.score);

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

function buildYearChart(questionnaires) {
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
      sums[monthDiff] += q.score;
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

function buildChartForPeriod(period, questionnaires) {
  if (period === 'month') return buildMonthChart(questionnaires);
  if (period === 'year') return buildYearChart(questionnaires);
  return buildWeekChart(questionnaires);
}

// ──────────────────────────────────────────────────────────
// Chart component
// ──────────────────────────────────────────────────────────

function MoodChart({ data, ticks }) {
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
      : { i, x: xAt(i), y: yAt(d.score), color: STRIPE_COLORS[i % STRIPE_COLORS.length] }
  );

  const presentPoints = points.filter(Boolean);
  const linePath = presentPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ');

  const areaPath =
    presentPoints.length > 0
      ? [
          presentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '),
          `L${presentPoints[presentPoints.length - 1].x},100`,
          `L${presentPoints[0].x},100 Z`,
        ].join(' ')
      : '';

  const hasData = points.some((p) => p !== null);

  return (
    <div className="flex-1 relative w-full min-h-[260px]">
      {/* Gridlines + Y-axis labels */}
      <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-14 pl-2 pr-10">
        {[10, 8, 6, 4, 2, 0].map((val) => (
          <div key={val} className="w-full flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--grid-line)' }} />
            <span
              className="w-6 text-right text-[12px] font-bold"
              style={{ color: 'var(--chart-label)' }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* Chart body */}
      <div className="absolute inset-0 pt-2 pb-14 pl-2 pr-10">
        {hasData ? (
          <div className="relative w-full h-full">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b2def9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#b2def9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#moodGradient)" />
              <path
                d={linePath}
                stroke="#b2def9"
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
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    backgroundColor: 'var(--card-bg)',
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`Score: ${data[p.i].score.toFixed(1)}`}
                />
              ) : null
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p style={{ color: 'var(--placeholder-color)' }} className="text-center">
              No mood data for this period — log your mood to start the chart.
            </p>
          </div>
        )}
      </div>

      {/* X-axis tick labels */}
      <div className="absolute bottom-0 left-0 right-10 h-12">
        {ticks.map((tick) => (
          <div
            key={tick.index}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${xAt(tick.index)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span
              className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
              style={{ color: 'var(--chart-label)' }}
            >
              {tick.primary}
            </span>
            <span
              className="text-[12px] font-medium whitespace-nowrap"
              style={{ color: 'var(--muted-color)' }}
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

function formatJournalDate(dateString) {
  return toLocalDate(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
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
      .then((qs) => {
        if (!cancelled) setQuestionnaires(qs);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load mood data.');
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
        if (!cancelled) setError('Could not load journal entries.');
      })
      .finally(() => {
        if (!cancelled) setLoadingJournals(false);
      });
    return () => { cancelled = true; };
  }, []);

  const chart = useMemo(() => buildChartForPeriod(period, questionnaires), [period, questionnaires]);
  const rangeLabel = useMemo(
    () => formatRange(chart.startDate, chart.endDate, period),
    [chart.startDate, chart.endDate, period]
  );
  const recentJournals = journals.slice(0, 3);
  const displayName = user?.username || 'there';

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader logout />

      <main className="flex-1 w-full p-[24px] md:p-[64px] flex flex-col gap-[32px] md:gap-[48px]">
        <div className="flex w-full items-center justify-between gap-6 flex-wrap">
          <h1
            className="font-semibold text-[32px] md:text-[44px] tracking-tight m-0"
            style={{ color: 'var(--heading-color)' }}
          >
            Welcome back, <span className="text-[#b2def9]">{displayName}</span>!
          </h1>

          <div
            className="flex items-center gap-[16px] md:gap-[24px] rounded-[24px] px-[24px] md:px-[32px] py-[16px] md:py-[20px] shadow-sm"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              transition: 'background-color 0.3s, border-color 0.3s',
            }}
          >
            <p className="font-normal text-[16px] md:text-[18px] m-0" style={{ color: 'var(--secondary-color)' }}>
              How are you feeling today?
            </p>
            <button
              type="button"
              onClick={() => navigate('/questionnaire')}
              className="bg-[#b2def9] rounded-[16px] shadow-[0px_4px_16px_rgba(178,222,249,0.4)] flex items-center justify-center px-[24px] h-[48px] hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              <span className="font-semibold text-[15px] text-white tracking-wide">
                Log your mood
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }}
          >
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-stretch gap-[32px] md:gap-[40px] w-full flex-1">
          {/* Mood chart */}
          <div className="flex-[2.5] flex flex-col">
            <div
              className="relative w-full min-h-[420px] lg:aspect-[2/1] rounded-[32px] p-[24px] md:p-[40px] shadow-sm flex flex-col gap-[16px] md:gap-[24px]"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                transition: 'background-color 0.3s, border-color 0.3s',
              }}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2
                  className="font-semibold text-[20px] md:text-[24px] tracking-tight"
                  style={{ color: 'var(--body-color)' }}
                >
                  Mood Analytics
                </h2>

                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="flex items-center rounded-[12px] p-1"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {PERIODS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPeriod(p.id)}
                        className="px-[14px] py-[6px] rounded-[8px] font-medium text-[13px] transition-colors border-none cursor-pointer"
                        style={{
                          backgroundColor: period === p.id ? 'var(--card-bg)' : 'transparent',
                          color: period === p.id ? 'var(--body-color)' : 'var(--muted-color)',
                          boxShadow: period === p.id ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-[12px] px-[16px] py-[8px] rounded-[12px]"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <span
                      className="font-medium text-[13px] whitespace-nowrap"
                      style={{ color: 'var(--secondary-color)' }}
                    >
                      {rangeLabel}
                    </span>
                  </div>
                </div>
              </div>

              {loadingChart ? (
                <p className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted-color)' }}>
                  Loading…
                </p>
              ) : (
                <MoodChart data={chart.data} ticks={chart.ticks} />
              )}
            </div>
          </div>

          {/* Recent journal entries */}
          <div
            className="flex-1 flex flex-col rounded-[32px] p-[28px] md:p-[40px] shadow-sm"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              transition: 'background-color 0.3s, border-color 0.3s',
            }}
          >
            <h2
              className="font-semibold text-[20px] md:text-[22px] tracking-tight mb-[24px] md:mb-[32px]"
              style={{ color: 'var(--body-color)' }}
            >
              Recent Entries
            </h2>

            <div className="flex-1 flex flex-col gap-[16px]">
              {loadingJournals ? (
                <p style={{ color: 'var(--muted-color)' }}>Loading…</p>
              ) : recentJournals.length === 0 ? (
                <p className="text-[14px]" style={{ color: 'var(--muted-color)' }}>
                  No entries yet. Start writing to see them here.
                </p>
              ) : (
                recentJournals.map((entry, i) => (
                  <Link
                    key={entry.id}
                    to="/journals"
                    className="w-full flex flex-col gap-[6px] p-[20px] rounded-[20px] transition-colors cursor-pointer no-underline"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--border-light)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                    }}
                  >
                    <div className="flex items-center gap-[10px] w-full overflow-hidden">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STRIPE_COLORS[i % STRIPE_COLORS.length] }}
                      />
                      <p
                        className="font-medium text-[15px] truncate w-full m-0"
                        style={{ color: 'var(--secondary-color)' }}
                      >
                        {previewOf(entry.body)}
                      </p>
                    </div>
                    <p
                      className="font-bold text-[11px] uppercase tracking-tight ml-[20px] m-0"
                      style={{ color: 'var(--chart-label)' }}
                    >
                      {formatJournalDate(entry.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </div>

            <div className="flex items-center gap-[32px] mt-[24px] md:mt-[32px] pt-[16px]">
              <Link
                to="/journals"
                className="font-bold text-[14px] uppercase tracking-widest border-b-2 border-[#b2f9c8] pb-1 no-underline transition-colors"
                style={{ color: 'var(--muted-color)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading-color)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-color)')}
              >
                View All Journals
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
