import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { createQuestionnaire, getTodaysQuestionnaire } from '../services/api';

export default function Questionnaire() {
  const navigate = useNavigate();
  const [score, setScore] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existedAtLoad, setExistedAtLoad] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTodaysQuestionnaire()
      .then((entry) => {
        if (cancelled) return;
        if (entry) {
          setScore(Math.round(entry.score));
          setExistedAtLoad(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await createQuestionnaire({ score });
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save your answer. Try again.');
      setLoading(false);
    }
  }

  const fillPercent = ((score - 1) / 9) * 100;
  const submitLabel = loading
    ? 'Saving…'
    : existedAtLoad
    ? "Update today's mood"
    : 'Submit Answer';

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader logout />

      <main className="flex-1 w-full flex items-center justify-center p-[24px] md:p-[40px]">
        <div
          className="w-full max-w-[800px] rounded-[32px] p-[32px] md:p-[64px] shadow-sm flex flex-col gap-[32px] md:gap-[48px] relative overflow-hidden"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            transition: 'background-color 0.3s, border-color 0.3s',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="font-semibold text-[24px] md:text-[36px] tracking-tight m-0 text-center leading-tight"
              style={{ color: 'var(--heading-color)' }}
            >
              How have you been feeling today?
            </h1>
            {existedAtLoad && !initializing && (
              <p className="text-center text-[14px] mt-2" style={{ color: 'var(--muted-color)' }}>
                You've already logged today — adjust the slider to update your entry.
              </p>
            )}
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-[16px] w-full md:px-[24px]">
            <div className="relative w-full h-[40px] flex items-center">
              <div
                className="absolute w-full h-[12px] rounded-full"
                style={{ backgroundColor: 'var(--input-bg)' }}
              />
              <div
                className="absolute h-[12px] bg-[#b2def9] rounded-full pointer-events-none transition-all"
                style={{ width: `${fillPercent}%` }}
              />
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="absolute w-full h-[40px] opacity-0 cursor-pointer appearance-none"
                aria-label="Mood score from 1 to 10"
                disabled={initializing}
              />
              <div
                className="absolute w-[32px] h-[32px] border-4 border-[#b2def9] rounded-full shadow-md pointer-events-none transition-all"
                style={{
                  left: `calc(${fillPercent}% - 16px)`,
                  backgroundColor: 'var(--card-bg)',
                }}
              />
            </div>

            <div className="flex justify-between w-full px-[8px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <span
                  key={num}
                  className="font-medium text-[16px] md:text-[18px] w-[20px] text-center flex-shrink-0 transition-colors"
                  style={{
                    color: num === score ? '#b2def9' : 'var(--muted-color)',
                    fontWeight: num === score ? '700' : '500',
                  }}
                >
                  {num}
                </span>
              ))}
            </div>

            <div className="flex justify-between w-full px-[8px] mt-[8px]">
              <span className="font-medium text-[16px]" style={{ color: 'var(--placeholder-color)' }}>Very Poor</span>
              <span className="font-medium text-[16px]" style={{ color: 'var(--placeholder-color)' }}>Excellent</span>
            </div>
          </div>

          <div className="flex justify-center mt-[16px]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || initializing}
              className="bg-[#b2def9] rounded-[16px] shadow-[0px_8px_24px_rgba(178,222,249,0.4)] flex items-center justify-center px-[48px] h-[64px] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <span className="font-semibold text-[22px] text-white tracking-wide">
                {submitLabel}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
