"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "healthos_onboarding_seen";

interface Step {
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to Health OS 👋",
    body: "This is your daily health command center. Quick 30-second tour of what everything actually does — then you're set.",
  },
  {
    title: "Your Health Score",
    body: "One number, 0-100, combining your sleep, movement, food, mood, and stress. It's your daily report card — tap into it and you'll see exactly which of those 5 things is pulling it down right now.",
  },
  {
    title: "XP, streaks & quests",
    body: "Every time you log something or talk to your coach, you earn XP and build a streak — like a game. It's there so showing up daily feels rewarding, not like a chore.",
  },
  {
    title: "Health GPS & 7-Day Debt",
    body: "Health GPS is a simple 3-week plan — which habit to focus on each week to raise your score. Health Debt shows what's built up over the last week (like accumulated sleep shortfall) so patterns don't stay invisible.",
  },
  {
    title: "Quick Decision & AI Coach",
    body: "Stuck on \"should I eat this\" or \"should I skip today's workout\"? Ask in Quick Decision for a fast answer. The full Coach chat remembers things you tell it and explains WHY behind every piece of advice.",
  },
  {
    title: "Nutrition",
    body: "Log meals by typing or snapping a photo. Either way, it feeds your Health Score's nutrition input automatically.",
  },
  {
    title: "That's it!",
    body: "You can replay this tour anytime with the (?) button in the top nav. Go log something and watch your score move.",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = window.localStorage.getItem(SEEN_KEY);
    if (!seen) setVisible(true);

    function handleReopen() {
      setStep(0);
      setVisible(true);
    }
    window.addEventListener("open-onboarding-tour", handleReopen);
    return () => window.removeEventListener("open-onboarding-tour", handleReopen);
  }, []);

  function finish() {
    window.localStorage.setItem(SEEN_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="bg-surface border border-surface2 rounded-2xl p-8 max-w-md w-full">
        <p className="font-mono text-xs tracking-[0.2em] text-vital uppercase mb-3">
          {step + 1} / {STEPS.length}
        </p>
        <h2 className="font-display text-2xl text-bone mb-3">{current.title}</h2>
        <p className="text-muted text-sm leading-relaxed mb-8">{current.body}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={finish}
            className="text-muted hover:text-bone transition text-sm"
          >
            Skip
          </button>
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="border border-surface2 text-bone px-4 py-2 rounded-full text-sm hover:border-vital transition"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="bg-vital text-ink font-semibold px-5 py-2 rounded-full text-sm hover:opacity-90 transition"
            >
              {isLast ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
