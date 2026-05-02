import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { createQuestionnaire, getTodaysQuestionnaire } from '../services/api';

const sliders = [
  {
    key: 'mood',
    label: 'Mood',
    description: 'How positive are you feeling?',
    color: '#b2f9c8',
    lowLabel: 'Very Low',
    highLabel: 'Excellent',
  },
  {
    key: 'depression',
    label: 'Depression',
    description: 'How depressed or hopeless have you felt?',
    color: '#f9b2d7',
    lowLabel: 'None',
    highLabel: 'Severe',
  },
  {
    key: 'anxiety',
    label: 'Anxiety',
    description: 'How anxious or worried have you felt?',
    color: '#f9f0b2',
    lowLabel: 'None',
    highLabel: 'Severe',
  },
];

const DEFAULT_VALUES = { mood: 7, depression: 3, anxiety: 3 };

export default function Questionnaire() {
  const navigate = useNavigate();
  const [values, setValues] = useState(DEFAULT_VALUES);
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
          setValues({
            mood: Math.round(entry.mood ?? 7),
            depression: Math.round(entry.depression ?? 3),
            anxiety: Math.round(entry.anxiety ?? 3),
          });
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
      await createQuestionnaire(values);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save your answer. Try again.');
      setLoading(false);
    }
  }

  const submitLabel = loading
    ? 'Saving…'
    : existedAtLoad
    ? "Update today's entry"
    : 'Submit';

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-[#Fafbfb]">
      <AppHeader logout />

      <main className="flex-1 w-full flex items-center justify-center p-[24px] md:p-[40px]">
        <div className="w-full max-w-[800px] bg-white border border-gray-100 rounded-[32px] p-[32px] md:p-[64px] shadow-sm flex flex-col gap-[32px] md:gap-[48px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-[24px] md:text-[36px] text-[#222] tracking-tight m-0 text-center leading-tight">
              How have you been feeling today?
            </h1>
            {existedAtLoad && !initializing && (
              <p className="text-center text-[14px] text-[#888] mt-2">
                You've already logged today — adjust the sliders to update your entry.
              </p>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-[40px] w-full md:px-[24px]">
            {sliders.map(({ key, label, description, color, lowLabel, highLabel }) => {
              const val = values[key];
              const fillPercent = ((val - 1) / 9) * 100;
              return (
                <div key={key} className="flex flex-col gap-[12px]">
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-semibold text-[18px] text-[#222]">{label}</span>
                    <span className="text-[14px] text-[#888]">{description}</span>
                  </div>

                  <div className="relative w-full h-[40px] flex items-center">
                    <div className="absolute w-full h-[12px] bg-gray-100 rounded-full" />
                    <div
                      className="absolute h-[12px] rounded-full pointer-events-none transition-all"
                      style={{ width: `${fillPercent}%`, backgroundColor: color }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={val}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                      }
                      className="absolute w-full h-[40px] opacity-0 cursor-pointer appearance-none"
                      aria-label={`${label} score from 1 to 10`}
                      disabled={initializing}
                    />
                    <div
                      className="absolute w-[32px] h-[32px] bg-white border-4 rounded-full shadow-md pointer-events-none transition-all"
                      style={{ left: `calc(${fillPercent}% - 16px)`, borderColor: color }}
                    />
                  </div>

                  <div className="flex justify-between w-full px-[8px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span
                        key={num}
                        className={`font-medium text-[14px] w-[20px] text-center flex-shrink-0 transition-colors ${
                          num === val ? 'font-bold' : 'text-[#888]'
                        }`}
                        style={num === val ? { color } : {}}
                      >
                        {num}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between w-full px-[8px]">
                    <span className="text-[13px] text-[#aaa]">{lowLabel}</span>
                    <span className="text-[13px] text-[#aaa]">{highLabel}</span>
                  </div>
                </div>
              );
            })}
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
