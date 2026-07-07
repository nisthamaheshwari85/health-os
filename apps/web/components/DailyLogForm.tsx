"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { awardXp } from "@/lib/gamification";
import type { HealthMetric } from "@health-os/shared";

export function DailyLogForm({ onLogged }: { onLogged: (metric: HealthMetric) => void }) {
  const [sleepHours, setSleepHours] = useState("8");
  const [activityMinutes, setActivityMinutes] = useState("20");
  const [mood, setMood] = useState(6);
  const [stress, setStress] = useState(4);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setFeedback("Couldn't verify your session — try refreshing the page.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("health_metrics")
      .upsert(
        {
          user_id: user.id,
          metric_date: today,
          source: "manual",
          sleep_hours: sleepHours ? Number(sleepHours) : null,
          activity_minutes: activityMinutes ? Number(activityMinutes) : null,
          mood_score: mood,
          stress_score: stress,
        },
        { onConflict: "user_id,metric_date,source" }
      )
      .select()
      .single<HealthMetric>();

    if (!error && data) {
      onLogged(data);
      try {
        await awardXp(supabase, user.id, 15, "logged_metrics");
        setFeedback("Vitals saved — +15 XP");
      } catch (xpErr) {
        console.error("XP award failed (vitals were still saved):", xpErr);
        setFeedback("Vitals saved, but XP didn't update this time.");
      }
    } else if (error) {
      console.error("Vitals save failed:", error);
      setFeedback(`Couldn't save: ${error.message}`);
    }
    setSaving(false);
  }

  return (
    <form
      id="log-vitals"
      onSubmit={handleSubmit}
      className="bg-surface rounded-2xl p-6 border border-surface2 flex flex-col gap-5"
    >
      <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
        Log today's vitals
      </p>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Sleep (hours)</span>
          <input
            type="number"
            min={0}
            max={16}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className="bg-ink border border-surface2 rounded-lg px-3 py-2 text-bone focus:border-vital outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Active minutes</span>
          <input
            type="number"
            min={0}
            max={300}
            value={activityMinutes}
            onChange={(e) => setActivityMinutes(e.target.value)}
            className="bg-ink border border-surface2 rounded-lg px-3 py-2 text-bone focus:border-vital outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-muted">Mood ({mood}/10)</span>
        <input
          type="range"
          min={1}
          max={10}
          value={mood}
          onChange={(e) => setMood(Number(e.target.value))}
          className="accent-vital"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-muted">Stress ({stress}/10)</span>
        <input
          type="range"
          min={1}
          max={10}
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="accent-coral"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="bg-vital text-ink font-semibold py-3 rounded-full hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save today's vitals (+15 XP)"}
      </button>

      {feedback && <p className="text-sm text-muted text-center">{feedback}</p>}
    </form>
  );
}
