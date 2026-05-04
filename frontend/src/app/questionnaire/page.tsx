"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { createQuestionnaire, getTodaysQuestionnaire } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ScoreKey = "mood" | "depression" | "anxiety";

interface SliderConfig {
  key: ScoreKey;
  label: string;
  description: string;
  color: string;
  lowLabel: string;
  highLabel: string;
}

const sliders: SliderConfig[] = [
  {
    key: "mood",
    label: "Mood",
    description: "How positive are you feeling?",
    color: "#b2f9c8",
    lowLabel: "Very Low",
    highLabel: "Excellent",
  },
  {
    key: "depression",
    label: "Depression",
    description: "How depressed or hopeless have you felt?",
    color: "#f9b2d7",
    lowLabel: "None",
    highLabel: "Severe",
  },
  {
    key: "anxiety",
    label: "Anxiety",
    description: "How anxious or worried have you felt?",
    color: "#f9f0b2",
    lowLabel: "None",
    highLabel: "Severe",
  },
];

const DEFAULT_VALUES = { mood: 7, depression: 3, anxiety: 3 };

function QuestionnaireContent() {
  const router = useRouter();
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      await createQuestionnaire(values);
      toast.success("Mood logged!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const detail = ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail);
      toast.error(typeof detail === "string" ? detail : "Could not save your answer. Try again.");
      setLoading(false);
    }
  }

  const submitLabel = loading
    ? "Saving…"
    : existedAtLoad
    ? "Update today's entry"
    : "Submit";

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader />

      <main className="flex-1 w-full flex items-center justify-center p-[24px] md:p-[40px]">
        <Card className="w-full max-w-[800px] p-[32px] md:p-[64px] flex flex-col gap-[32px] md:gap-[48px]">
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="font-semibold text-[24px] md:text-[36px] tracking-tight m-0 text-center leading-tight"
              style={{ color: "var(--heading-color)" }}
            >
              How have you been feeling today?
            </h1>
            {existedAtLoad && !initializing && (
              <p className="text-center text-[14px] mt-2" style={{ color: "var(--muted-color)" }}>
                You&apos;ve already logged today — adjust the sliders to update your entry.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[40px] w-full md:px-[24px]">
            {sliders.map(({ key, label, description, color, lowLabel, highLabel }) => {
              const val = values[key];
              const fillPercent = ((val - 1) / 9) * 100;
              return (
                <div key={key} className="flex flex-col gap-[12px]">
                  <div className="flex flex-col gap-[2px]">
                    <span
                      className="font-semibold text-[18px]"
                      style={{ color: "var(--heading-color)" }}
                    >
                      {label}
                    </span>
                    <span className="text-[14px]" style={{ color: "var(--muted-color)" }}>
                      {description}
                    </span>
                  </div>

                  <div className="relative w-full h-[40px] flex items-center">
                    <div
                      className="absolute w-full h-[12px] rounded-full"
                      style={{ backgroundColor: "var(--input-bg)" }}
                    />
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
                      className="absolute w-[32px] h-[32px] border-4 rounded-full shadow-md pointer-events-none transition-all"
                      style={{
                        left: `calc(${fillPercent}% - 16px)`,
                        borderColor: color,
                        backgroundColor: "var(--card-bg)",
                      }}
                    />
                  </div>

                  <div className="flex justify-between w-full px-[8px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span
                        key={num}
                        className="font-medium text-[14px] w-[20px] text-center flex-shrink-0 transition-colors"
                        style={{
                          color: num === val ? color : "var(--muted-color)",
                          fontWeight: num === val ? "700" : "500",
                        }}
                      >
                        {num}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between w-full px-[8px]">
                    <span className="text-[13px]" style={{ color: "var(--placeholder-color)" }}>
                      {lowLabel}
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--placeholder-color)" }}>
                      {highLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-[16px]">
            <Button
              type="button"
              size="lg"
              onClick={handleSubmit}
              disabled={loading || initializing}
              className="px-[48px]"
            >
              {submitLabel}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <ProtectedRoute>
      <QuestionnaireContent />
    </ProtectedRoute>
  );
}
